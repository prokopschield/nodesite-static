import { Directory, File } from './filesystem';
import { Plugin } from './plugin';

export async function resolve(file: File, plugins: Plugin[]) {
    if (file.loaded) {
        return file.source;
    }

    for (const plugin of plugins) {
        const source =
            file instanceof Directory
                ? await plugin.loadDirectory(file)
                : await plugin.loadFile(file);

        if (source) {
            file.source = source;
        }
    }

    return file.source;
}
