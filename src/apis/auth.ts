import { inject, RoutePlugin, route } from 'spryly';
import { Server, Request, ResponseToolkit, ResponseObject } from '@hapi/hapi';
import { ConfigService } from '../services/config';
import { AuthService } from '../services/auth';
import {
    badRequest as boomBadRequest,
    unauthorized as boomUnauthorized
} from '@hapi/boom';
import { stringify as qsStringify } from 'qs';

const ModuleName = 'AuthRoutes';

export class AuthRoutes extends RoutePlugin {
    @inject('$server')
    private server: Server;

    @inject('config')
    private config: ConfigService;

    @inject('auth')
    private auth: AuthService;

    @route({
        method: ['POST', 'GET'],
        path: '/api/v1/auth/signin',
        options: {
            auth: 'iotc-signin',
            tags: ['auth'],
            description: 'Sign in with an authenticated session'
        }
    })
    public async postGetSignin(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
        this.server.log([ModuleName, 'info'], `postGetSignin`);

        const auth = request.auth;

        if (!auth || !auth.isAuthenticated) {
            const errorMessage = auth?.error?.message || 'unknown';
            this.server.log([ModuleName, 'error'], `providerSignin error: ${errorMessage}`);

            throw boomUnauthorized(`Sign in auth check failed: ${errorMessage}`);
        }

        if (!auth?.credentials) {
            this.server.log([ModuleName, 'error'], 'providerSignin error: auth check failed: missing credentials');

            throw boomUnauthorized('Sign in failed, please verify the credentials are correct...');
        }

        try {
            await this.auth.providerSignin(request);

            const queryParams = qsStringify({
                ...(auth as any)?.credentials?.query
            });

            // return h.redirect(`/user`);
            return h.redirect(`/user?${queryParams}`);
        }
        catch (ex) {
            this.server.log([ModuleName, 'error'], ex.message);

            throw boomUnauthorized('Sorry something went wrong. Please try again.');
        }
    }

    @route({
        method: 'GET',
        path: '/api/v1/auth/signout',
        options: {
            auth: {
                strategy: 'iotc-session',
                scope: ['api-client']
            },
            tags: ['auth'],
            description: 'Sign out the authenticated session'
        }
    })
    public async getSignout(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
        this.server.log([ModuleName, 'info'], 'getSignout');

        try {
            (request as any).iotcSessionAuth.clear();
        }
        catch (ex) {
            this.server.log([ModuleName, 'warning'], `Session cookie is already cleared: ${ex.message}`);
        }

        const redirectProtocol = this.auth.getRedirectProtocol(request);
        const redirectHost = this.auth.getRedirectHost(request);
        const signoutDoneRedirectUrl = `${redirectProtocol}://${redirectHost}${this.config.get('authSignoutDoneRedirectUrl')}`;
        const authSignoutUrl = this.config.get('authChaosClientSignoutUrl').replace('###TENANTID', this.config.get('authChaosClientTenantId'));

        return h.redirect(`${authSignoutUrl}${signoutDoneRedirectUrl}`);
    }

    @route({
        method: 'GET',
        path: '/api/v1/auth/signoutdone',
        options: {
            tags: ['auth'],
            description: 'Final redirect for session session'
        }
    })
    public async getSignoutDone(_request: Request, h: ResponseToolkit): Promise<ResponseObject> {
        return h.redirect('/');
    }

    @route({
        method: 'GET',
        path: '/api/v1/auth/user',
        options: {
            auth: {
                strategy: 'iotc-session',
                mode: 'try'
            },
            plugins: {
                'hapi-auth-cookie': {
                    redirectTo: false
                }
            },
            tags: ['auth'],
            description: 'Get logged in user profile'
        }
    })
    public async getUserProfile(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
        this.server.log([ModuleName, 'info'], 'getUserProfile');

        const profile: any = request?.auth?.credentials?.profile;
        if (!profile || !request.auth?.isAuthenticated) {
            throw boomUnauthorized();
        }

        return h.response({
            role: profile.role,
            userId: request.auth.credentials?.userId,
            displayName: profile?.displayName,
            email: profile?.email,
            authProvider: request.auth.credentials?.provider
        });
    }

    @route({
        method: ['POST', 'GET'],
        path: '/api/v1/auth/generate',
        options: {
            auth: {
                strategies: ['iotc-session'],
                scope: ['admin']
            },
            tags: ['auth'],
            description: 'Generate tokens'
        }
    })
    public async generateJwtToken(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
        this.server.log([ModuleName, 'info'], 'generateJwtToken');

        const payload: any = request.payload;

        if (!payload?.scope) {
            throw boomBadRequest('Missing scope field in payload');
        }

        const tokenInfo = await this.auth.generateToken(payload.scope);

        return h.response(tokenInfo).code(201);
    }
}
