import fs from 'fs';
import { Source } from 'nsblob-stream';
import Showdown from 'showdown';

import { File } from './filesystem';
import { Plugin } from './plugin';

export class Markdown extends Plugin {
    convertor: Showdown.Converter;

    constructor(options: Showdown.ConverterOptions) {
        super();

        this.convertor = new Showdown.Converter({
            completeHTMLDocument: true,
            customizedHeaderId: true,
            ellipsis: true,
            emoji: true,
            encodeEmails: true,
            ghCodeBlocks: true,
            ghCompatibleHeaderId: true,
            ghMentions: true,
            noHeaderId: true,
            omitExtraWLInCodeBlocks: true,
            openLinksInNewWindow: true,
            parseImgDimensions: true,
            requireSpaceBeforeHeadingText: false,
            simpleLineBreaks: true,
            simplifiedAutoLink: true,
            smartIndentationFix: true,
            smoothLivePreview: true,
            splitAdjacentBlockquotes: true,
            strikethrough: true,
            tables: true,
            tasklists: true,
            underline: true,

            ...options,
        });
    }

    async loadFile(file: File) {
        if (file.type.startsWith('text/markdown')) {
            const markdown = await fs.promises.readFile(file.filepath, 'utf8');
            const html = this.convertor
                .makeHtml(markdown)
                .replace(
                    '</head>',
                    '<link rel="stylesheet" href="https://l.og.ax/p0jxr6r">\n</head>'
                );
            const buffer = Buffer.from(html);

            return Source.fromBuffer(buffer, {
                name: file.name,
                type: 'text/html; charset=utf-8',
            });
        }
    }
}
