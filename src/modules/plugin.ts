import type { DataSource, Directory, File } from './filesystem';

export abstract class Plugin {
    async loadFile(file: File): Promise<DataSource | void> {
        return await file.source;
    }

    async loadDirectory(directory: Directory): Promise<DataSource | void> {
        return await directory.source;
    }

    async updateFile(file: File) {
        return this.loadFile(file);
    }
}
