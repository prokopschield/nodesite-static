import { NodeSiteRequest } from 'nodesite.eu';

import { Directory } from './filesystem';
import { Plugin } from './plugin';
import { resolve } from './resolver';

export function getListener(
    directory: Directory,
    plugins: Plugin[],
    logger: (_line: string) => any = console.log
) {
    return async (request: NodeSiteRequest) => {
        const { pathname } = new URL(request.uri, 'a://b');

        try {
            logger(`${request.method} ${pathname}`);

            const file = directory.traverse(pathname);
            const source = await resolve(file, plugins);

            return {
                head: {
                    'Content-Type': source.props.type,
                    'Content-Length': source.length,
                },
                stream: source.raw,
            };
        } catch {
            logger(`404 ${pathname}`);

            return {
                statusCode: 404,
            };
        }
    };
}
