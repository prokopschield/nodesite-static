import { create } from 'nodesite.eu';

import { Directory } from './filesystem';
import { getListener } from './listener';
import { Plugin } from './plugin';

export function main(name: string, directory: string, plugins: Plugin[] = []) {
    const root = new Directory(directory, plugins);

    create(name, '/', getListener(root, plugins));
}
