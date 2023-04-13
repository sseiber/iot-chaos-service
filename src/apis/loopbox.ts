import { inject, RoutePlugin, route } from 'spryly';
import { Server, Request, ResponseToolkit, ResponseObject } from '@hapi/hapi';
import { AuthService } from '../services/auth';
import { LoopBoxService } from '../services/loopbox';
import * as Boom from '@hapi/boom';
import { IChaosExperiment } from '../types/chaosTypes';

export class LoopBoxRoutes extends RoutePlugin {
    @inject('$server')
    private server: Server;

    @inject('auth')
    private auth: AuthService;

    @inject('loopbox')
    private loopbox: LoopBoxService;

    @route({
        method: 'GET',
        path: '/api/v1/loopbox/config/{userId}',
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
            description: 'Get user experiments'
        }
    })
    public async getExperimentsForUser(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
        this.server.log(['LoopBoxRoutes', 'info'], 'getExperimentsForUser');

        const experiments = await this.loopbox.getExperimentsForUser(request.params.userId);

        return h.response(experiments).code(201);
    }

    @route({
        method: 'POST',
        path: '/api/v1/loopbox/config/{userId}',
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
            description: ' Configure user experiments'
        }
    })
    public async configureExperimentsForUser(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
        this.server.log(['LoopBoxRoutes', 'info'], 'postCreateConfig');

        const userId = request.params.userId;
        const experiments = request?.payload as IChaosExperiment[];

        try {
            const scope = await this.loopbox.configureExperimentsForUser(userId, experiments);

            this.auth.setSessionScope(request, userId, scope);

            return h.response().code(201);
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
