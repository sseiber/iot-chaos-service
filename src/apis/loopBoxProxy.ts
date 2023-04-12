import { inject, RoutePlugin, route } from 'spryly';
import { Request, ResponseObject, ResponseToolkit } from '@hapi/hapi';
import { ConfigService } from '../services/config';
import { LoopBoxProxyService } from '../services/loopBoxProxy';
import { v4 as uuidV4 } from 'uuid';
import * as cheerio from 'cheerio';

export class LoopBoxProxyRoutes extends RoutePlugin {
    @inject('config')
    private config: ConfigService;

    @inject('loopBoxProxy')
    private loopBoxProxy: LoopBoxProxyService;

    @route({
        method: 'GET',
        path: '/loopbox/{loopBoxId}/{path*}',
        options: {
            auth: {
                strategies: ['iotc-session'],
                scope: ['user-{params.loopBoxId}']
            },
            tags: ['loopboxproxy'],
            description: 'Loopbox proxy ui'
        }
    })
    public async getProxyLoopBox(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
        return this.proxy(request, h);
    }

    @route({
        method: ['POST', 'PUT', 'DELETE'],
        path: '/loopbox/{loopBoxId}/{path*}',
        options: {
            auth: {
                strategies: ['iotc-session'],
                scope: ['user-{params.loopBoxId}']
            },
            payload: {
                parse: false
            },
            tags: ['loopboxproxy'],
            description: 'Loopbox proxy ui'
        }
    })
    public async postProxyLoopBox(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
        return this.proxy(request, h);
    }

    private async proxy(request: Request, h: ResponseToolkit) {
        const options: any = {
            method: request.method.toUpperCase(),
            path: `/${(request.params.path || '')}`,
            loopBoxId: request.params.loopBoxId,
            requestId: uuidV4(),
            headers: request.headers,
            raw: true
        };

        // Special case, remove encoding and host headers
        delete options.headers['accept-encoding'];
        delete options.headers.host;

        if (request.payload) {
            options.payload = (request.payload as Buffer).toString('base64');
        }

        try {
            const result = await this.loopBoxProxy.proxyRequest(options);

            this.rewrite(request, result);

            const replyBody = Buffer.isBuffer(result.body) ? result.body : Buffer.from(result.body, 'base64');
            const response = h.response(replyBody);

            if (result.headers) {
                Object.keys(result.headers).forEach((header) => {
                    response.header(header, result.headers[header]);
                });
            }

            if (result.statusCode) {
                response.code(result.statusCode);
            }

            return response;
        }
        catch (error) {
            return h.response(error.message).code(500);
        }
    }

    private rewrite(request: Request, result: any) {
        // TODO: Think about gzip
        if (!result || !result.headers || !result.headers['content-type']) {
            return result;
        }

        if (result.headers['content-type'].indexOf('text/html') !== 0) {
            return result;
        }

        const updatedResult = result;
        const $ = cheerio.load(Buffer.from(result.body, 'base64'));

        $('script').attr('src', (_idx: any, value: string) => {
            const url = this.rewriteUrl(request, value);

            return url;
        });

        // Inject some global variables - see functions below
        // This allows the local SPA to run either remote, or local and the
        // host will be appropriate to the context.

        $(this.generateScriptGlobals(request)).prependTo('body');

        $(this.generateBaseUrl(request)).prependTo('head');
        updatedResult.body = Buffer.from($.html(), 'utf8');

        return updatedResult;
    }

    private rewriteUrl(request: Request, path: string) {
        if (!path || path.indexOf('/') !== 0) {
            return path;
        }

        // const proto = (request.headers['x-forwarded-proto'] || request.server.info.protocol);
        const proto = this.config.get('authForceHttps') === 'true' ? 'https' : 'http';
        const host = (request.headers['x-forwarded-host'] || request.info.host);
        const url = `${proto}://${host}/loopbox/${request.params.loopBoxId}${path}`;

        return url;
    }

    private generateBaseUrl(request: Request) {
        return `<base href="${this.rewriteUrl(request, '/')}">`;
    }

    private generateScriptGlobals(request: Request) {
        const loopBoxGlobal =
            `<script>` +
            `    window.LOOPBOX = {` +
            `        baseUrl: '/loopbox/${request.params.loopBoxId}',` +
            `        id: '${request.params.loopBoxId}',` +
            `        remote_proxy: true` +
            `    };` +
            `</script>`;

        return loopBoxGlobal;
    }
}
