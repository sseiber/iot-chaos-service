import { inject, RoutePlugin, route } from 'spryly';
import { Server, Request, ResponseToolkit, ResponseObject } from '@hapi/hapi';
import { LoopBoxProxyService } from '../services/loopBoxProxy';
import {
    badRequest as boomBadRequest,
    unauthorized as boomUnauthorized
} from '@hapi/boom';
import { v4 as uuidV4 } from 'uuid';
import * as jwt from 'jsonwebtoken';

export class InputRoutes extends RoutePlugin {
    @inject('$server')
    private server: Server;

    @inject('loopBoxProxy')
    private loopBoxProxy: LoopBoxProxyService;

    @route({
        method: 'POST',
        path: '/api/v1/input/hook/{hookType}/loopbox/{loopBoxId}',
        options: {
            tags: ['hook'],
            description: 'Process input (arbitary webhook)',
            auth: false
        }
    })
    public async postHookWithLoopBoxId(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
        return this.handleInput('hook', request, h);
    }

    @route({
        method: 'POST',
        path: '/api/v1/input/hook/{hookType}',
        options: {
            tags: ['hook'],
            description: 'Process input (arbitary webhook, token based delegation)',
            auth: false
        }
    })
    public async postHookWithToken(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
        return this.handleInput('hook', request, h);
    }

    @route({
        method: 'POST',
        path: '/api/v1/input/loopbox/{loopBoxId}',
        options: {
            tags: ['input'],
            description: 'Process input (REST style)',
            auth: false
        }
    })
    public async postInputWithLoopBoxId(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
        return this.handleInput('rest', request, h);
    }

    @route({
        method: 'POST',
        path: '/api/v1/input',
        options: {
            tags: ['input'],
            description: 'Process input (REST style, token based delegation)',
            auth: false
        }
    })
    public async postInputWithToken(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
        return this.handleInput('rest', request, h);
    }

    private async handleInput(type: any, request: Request, h: ResponseToolkit) {
        this.server.log(['InputRoutes', 'info'], `handleInput type: ${type}`);

        if (!request.payload) {
            throw boomBadRequest('Missing body');
        }

        // Build the outgoing request to the loopbox
        const proxyRequestData: any = {
            method: 'POST',
            path: '/api/v1/input',
            requestId: (request?.payload as any)?.requestId || uuidV4(),
            payload: request.payload,
            loopBoxId: request.params.loopBoxId,
            auth: {}
        };

        if (type === 'hook') {
            proxyRequestData.scheme = request.params.hookType;
            proxyRequestData.path += `/hook/${request.params.hookType}`;

            // Set the loopbox auth to either the auth param or authorization header
            proxyRequestData.auth.loopbox = request?.query?.auth || request.headers?.authorization;

            // Add additional authorization from other sources, if specified
            if (request.headers.authorization && proxyRequestData.auth.loopbox !== request.headers.authorization) {
                proxyRequestData.auth.authorization = request.headers.authorization;
            }
        }
        else if (type === 'rest') {
            // For rest we only accept the Authorization header, if this does not exist, consider
            // this to be unauthenticated
            proxyRequestData.auth.loopbox = request.headers.authorization;
        }
        else {
            this.server.log(['InputRoutes', 'info'], `handleInput unknown input type: ${type}`);
            throw boomBadRequest('Unknown input type');
        }

        if (!proxyRequestData.auth.loopbox) {
            this.server.log(['InputRoutes', 'info'], `handleInput no auth token defined`);
            throw boomUnauthorized('Missing token');
        }

        // If there is no loopbox id, we need to extract it from the token, it will be set as the issuer
        // NOTE: We are not validating the JWT, just extracting the issuer, verification will be done
        // on the downstream loopbox

        if (!proxyRequestData.loopBoxId) {
            let decodedToken: any;
            try {
                decodedToken = jwt.decode(proxyRequestData.auth.loopbox, { json: true });
            }
            catch (error) {
                decodedToken = '';
            }

            if (!decodedToken || !decodedToken.iss) {
                throw boomUnauthorized('Invalid token');
            }

            proxyRequestData.loopBoxId = decodedToken.iss;
        }

        request.log(['info'], `LoopBox process request. type=${type}, requestId=${proxyRequestData.requestId}, target=${proxyRequestData.loopBoxId}`);

        try {
            const proxyResult = await this.loopBoxProxy.proxyRequest(proxyRequestData);

            return h.response(proxyResult).code(201);
        }
        catch (error) {
            throw boomBadRequest(error.message);
        }
    }
}
