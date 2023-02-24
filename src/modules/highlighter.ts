import fs from 'fs';
import hljs from 'highlight.js';
import { Source } from 'nsblob-stream';

import { File } from './filesystem';
import { Plugin } from './plugin';

export class Highlighter extends Plugin {
    async loadFile(file: File) {
        const match = file.type.match(/.*\/([^;]+);?.*/);
        const language = match && match[1];
        const language_good = language && hljs.getLanguage(language);
        const code = await fs.promises.readFile(file.filepath, 'utf8');

        if (language_good && language !== 'html') {
            const { value } = hljs.highlight(code, { language });
            const html = [
                '<link rel="stylesheet" href="https://l.og.ax/p0jxr6r">',
                '<link rel="stylesheet" href="https://l.og.ax/l3q7i15">',
                `<pre><code language=${language}>${value.trim()}</code></pre>`,
            ].join('\n');
            const buffer = Buffer.from(html);

            return Source.fromBuffer(buffer, {
                name: file.name,
                type: 'text/html; charset=utf-8',
            });
        }
    }
}
