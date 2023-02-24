import { Directory, File } from './modules/filesystem';
import { Highlighter } from './modules/highlighter';
import { getListener } from './modules/listener';
import { main } from './modules/main';
import { Markdown } from './modules/markdown';
import { Plugin } from './modules/plugin';
import { resolve } from './modules/resolver';

export const plugins = { Highlighter, Markdown };

export default { Directory, File, getListener, main, Plugin, plugins, resolve };

export { Directory, File } from './modules/filesystem';
export { getListener } from './modules/listener';
export { main } from './modules/main';
export { Plugin } from './modules/plugin';
export { resolve } from './modules/resolver';
