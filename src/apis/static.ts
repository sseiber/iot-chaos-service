import { RoutePlugin, route } from 'spryly';
import { Request, ResponseObject, ResponseToolkit } from '@hapi/hapi';
import {
    dirname as pathDirname,
    resolve as pathResolve
} from 'path';

const rootDirectory = pathResolve(pathDirname(require.main.filename), '..');

export class StaticRoutes extends RoutePlugin {
    @route({
        method: 'GET',
        path: '/favicon.ico',
        options: {
            tags: ['static'],
            description: 'The static favicon'
        }
    })
    public async getFavicon(_request: Request, h: ResponseToolkit): Promise<ResponseObject> {
        return h.file(pathResolve(rootDirectory, 'static', 'favicons', 'favicon.ico'));
    }

    @route({
        method: 'GET',
        path: '/favicons/{path*}',
        options: {
            tags: ['static'],
            description: 'The static assets',
            handler: {
                directory: {
                    path: pathResolve(rootDirectory, 'static', 'favicons'),
                    index: false
                }
            }
        }
    })
    public async getStatic(_request: Request, _h: ResponseToolkit): Promise<void> {
        return;
    }

    // @route({
    //     method: 'GET',
    //     path: '/.well-known/microsoft-identity-association.json',
    //     options: {
    //         tags: ['well-known'],
    //         description: 'Domain verification'
    //     }
    // })
    // public async getWellKnown(request: Request, h: ResponseToolkit) {
    //     return h.file(pathResolve(rootDirectory, '.well-known', 'microsoft-identity-association.json')).header('content-type', 'application/json').header('content-length', '129');
    // }

    @route({
        method: 'GET',
        path: '/.well-known/microsoft-identity-association.json',
        options: {
            tags: ['wellknown'],
            description: 'Domain verification',
            handler: {
                file: pathResolve(rootDirectory, '.well-known', 'microsoft-identity-association.json')
            }
        }
    })
    public async getWellKnown(_request: Request, _h: ResponseToolkit): Promise<void> {
        return;
    }
}
