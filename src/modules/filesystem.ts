import { execSync } from 'child_process';
import fs from 'fs';
import { contentType } from 'mime-types';
import { Source } from 'nsblob-stream';
import path from 'path';
import { Queue } from 'ps-std';

import { Plugin } from './plugin';

const ioqueue = new Queue();
const lpqueue = new Queue();

const getContentType = (name: string) => {
    const type = contentType(name);

    return type && type.replace('video/mp2t', 'application/typescript');
};

const resolveSymlink = (filepath: string) => {
    const link_value = fs.readlinkSync(filepath);

    try {
        const stats = fs.statSync(path.resolve(filepath, '..', link_value));

        return stats.isDirectory() ? link_value + '/' : link_value;
    } catch {
        return path.basename(filepath);
    }
};

export interface DataSource
    extends Source<{
        name: string;
        type: string;
    }> {}

export class File {
    protected _filepath: string;
    protected _plugins: Plugin[];

    constructor(filepath: string, plugins: Plugin[]) {
        this._filepath = path.resolve(filepath);
        this._plugins = plugins;
    }

    get filepath() {
        return this._filepath;
    }

    get name() {
        return path.basename(this.filepath);
    }

    get type() {
        const { filepath, name } = this;

        return (
            (name.match(/.+\..+/) && getContentType(name)) ||
            execSync(`file --mime ${filepath}`)
                .toString()
                .replace(/^.*:/g, '')
                .trim()
        );
    }

    protected _last_update = new Date(0);

    protected async lazy_update() {
        await ioqueue.promise;

        try {
            const stats = await fs.promises.stat(this._filepath);

            if (stats.mtime > this._last_update) {
                this._last_update = stats.mtime;

                for (const plugin of this._plugins) {
                    const new_source = await plugin.updateFile(this);

                    if (new_source instanceof Source) {
                        this.source = new_source;
                    }
                }
            }
        } catch {
            this._last_update = new Date(0);
        }

        ioqueue.next_async();
    }

    protected _source: DataSource | undefined;

    get source() {
        this.lazy_update();

        return this._source || this.read();
    }

    set source(source) {
        if (source instanceof Promise) {
            source.then((source) => (this.source = source));
        } else {
            this._source = source;
        }
    }

    get loaded(): boolean {
        return this._source instanceof Source;
    }

    async read(): Promise<DataSource> {
        try {
            await ioqueue.promise;

            const stats = await fs.promises.stat(this.filepath);

            if (stats.isFile()) {
                const properties = { name: this.name, type: this.type };
                const stream = fs.createReadStream(this.filepath);

                this.source = await Source.fromStream(stream, properties);
            } else if (stats.isDirectory()) {
                const properties = { name: `${this.name}/`, type: 'text/html' };
                const children = await fs.promises.readdir(this.filepath);
                const items = ['..', ...children].map((child) => {
                    const { filepath, type } = new File(
                        path.resolve(this.filepath, child),
                        this._plugins
                    );

                    const is_directory = type.startsWith('inode/directory');
                    const is_symlink = type.startsWith('inode/symlink');

                    if (is_directory) {
                        child += '/';
                    }

                    const blank = is_directory ? '' : ' target="_blank"';
                    const href = is_symlink ? resolveSymlink(filepath) : child;

                    return [
                        `<a href="${href}"${blank}>${child}</a>`,
                        type,
                    ].join('</td><td>');
                });
                const html =
                    '<link rel="stylesheet" href="https://l.og.ax/p0jxr6r">' +
                    `<h1>Index of ${this.name}/</h1>` +
                    '<table><tr><td>' +
                    items.join('</td></tr><tr><td>') +
                    '</td></tr></table>';
                const buffer = Buffer.from(html);

                this.source = await Source.fromBuffer(buffer, properties);
            } else {
                const properties = {
                    name: this.name,
                    type: 'application/json',
                };
                const json = JSON.stringify(stats, undefined, '\t') + '\n';
                const buffer = Buffer.from(json);

                this.source = await Source.fromBuffer(buffer, properties);
            }
        } catch (error) {
            ioqueue.next_async();

            return Source.fromBuffer(Buffer.from(String(error)), {
                name: this.name,
                type: 'text/plain',
            });
        }

        ioqueue.next_async();

        return this.source;
    }
}

export class Directory extends File {
    children: Record<string, Directory | File> = {};
    plugins: Plugin[];

    constructor(filepath: string, plugins: Plugin[] = []) {
        super(filepath, plugins);

        this.lazyload((this.plugins = plugins));
    }

    getChild(child: string) {
        if (this.children[child]) {
            return this.children[child];
        }

        child = path.resolve(this.filepath, child);

        const stats = fs.statSync(child);

        const node = stats.isDirectory()
            ? new Directory(child, this.plugins)
            : new File(child, this.plugins);

        return (this.children[node.name] = node);
    }

    traverse(relpath: string): Directory | File {
        const parts = relpath.split(/\/+/g).filter((a) => a);
        const first = parts.shift();
        const next = parts.join('/');

        if (!first) {
            return this;
        } else if (next.length > 0) {
            const child = this.getChild(first);

            if (child instanceof Directory) {
                return child.traverse(next);
            } else {
                throw new TypeError('Directory cannot be traversed further.');
            }
        } else {
            return this.getChild(first);
        }
    }

    async lazyload(plugins: Plugin[]) {
        await lpqueue.promise;

        for (const child of await fs.promises.readdir(this.filepath)) {
            const node = this.getChild(child);

            await node.read();

            const is_directory = node instanceof Directory;

            for (const plugin of plugins) {
                const source_p = is_directory
                    ? plugin.loadDirectory(node)
                    : plugin.loadFile(node);

                const source = await source_p;

                if (source) {
                    node.source = source;
                }
            }
        }

        await this.read();

        lpqueue.next_async();
    }
}
