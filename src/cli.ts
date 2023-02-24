#!/usr/bin/env node

import argv from '@prokopschield/argv';

import { Highlighter } from './modules/highlighter';
import { main } from './modules/main';
import { Markdown } from './modules/markdown';
import { Plugin } from './modules/plugin';

argv.alias('name', 'n');
argv.alias('directory', 'dir', 'd', 'file', 'f', 'path', 'p');
argv.alias('highlighter', 'highlight', 'hl');
argv.alias('markdown', 'md');

const { name, directory } = argv.expectMutate(['name', 'directory'], {
    directory: '.',
});

if (!name) {
    throw new Error('Usage: nodesite-static NAME [DIRECTORY] [--hl] [--md]');
}

const plugins: Plugin[] = [];

if (argv.get('highlighter')) {
    plugins.push(new Highlighter());
}

if (argv.get('markdown')) {
    plugins.push(new Markdown({}));
}

main(name, directory, plugins);
