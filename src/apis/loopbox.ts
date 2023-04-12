import { inject, RoutePlugin, route } from 'spryly';
import { Server, Request, ResponseToolkit, ResponseObject } from '@hapi/hapi';
import { AuthService } from '../services/auth';
import { LoopBoxService } from '../services/loopbox';
import * as Boom from '@hapi/boom';

export class LoopBoxRoutes extends RoutePlugin {
    @inject('$server')
    private server: Server;

    @inject('auth')
    private auth: AuthService;

    @inject('loopbox')
    private loopbox: LoopBoxService;

    @route({
        method: 'GET',
        path: '/api/v1/loopbox/user/{userId}',
        options: {
            auth: {
                strategy: 'iotc-session',
                mode: 'required',
                scope: ['api-client']
            },
            plugins: {
                'hapi-auth-cookie': {
                    redirectTo: false
                }
            },
            tags: ['identity'],
            description: 'Get logged in user identity'
        }
    })
    public async getLoopBoxesForUser(request: Request, _h: ResponseToolkit): Promise<ResponseObject> {
        this.server.log(['LoopBoxRoutes', 'info'], 'getLoopBoxesForUser');

        return this.loopbox.getLoopBoxesForUser(request.params.userId);
    }

    @route({
        method: 'POST',
        path: '/api/v1/loopbox/config',
        options: {
            // auth: {
            //     strategy: 'iotc-session',
            //     scope: ['api-client']
            // },
            tags: ['identity'],
            description: 'Create user configuration'
        }
    })
    public async postCreateConfig(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
        this.server.log(['LoopBoxRoutes', 'info'], 'postCreateConfig');

        const claimToken = request.params.claimToken;
        const userId = (request?.payload as any)?.userId;

        try {
            const { loopBox, scope } = await this.loopbox.claimLoopBoxWithToken(claimToken, userId);

            this.auth.setSessionScope(request, userId, scope);

            return h.response(loopBox).code(201);
        }
        catch (error) {
            throw Boom.badRequest(error.message);
        }
    }

    @route({
        method: 'GET',
        path: '/api/v1/loopbox/version',
        options: {
            auth: {
                strategy: 'iotc-session',
                scope: ['api-client']
            },
            plugins: {
                'hapi-auth-cookie': {
                    redirectTo: false
                }
            },
            tags: ['identity'],
            description: 'Get system build version'
        }
    })
    public async getLoopBoxServerVersion(_request: Request, h: ResponseToolkit): Promise<ResponseObject> {
        this.server.log(['LoopBoxRoutes', 'info'], 'getLoopBoxServerVersion');

        return h.response({
            version: (this.server.settings.app as any).version
        });
    }
}
