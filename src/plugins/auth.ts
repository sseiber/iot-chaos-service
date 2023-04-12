import { HapiPlugin, inject } from 'spryly';
import { Server, Request, ResponseToolkit } from '@hapi/hapi';
import { ConfigService } from '../services/config';
import { AuthService } from '../services/auth';
import * as Bell from '@hapi/bell';
import * as HapiAuthCookie from '@hapi/cookie';
import * as HapiAuthJwt from 'hapi-auth-jwt2';
import {
    internal as boomInternal
} from '@hapi/boom';
import { bind } from '../utils';

const ModuleName = 'AuthPlugin';

export class AuthPlugin implements HapiPlugin {
    @inject('config')
    private config: ConfigService;

    @inject('auth')
    private auth: AuthService;

    private server: Server;

    public async register(server: Server): Promise<void> {
        this.server = server;

        try {
            await server.register([
                Bell,
                HapiAuthCookie,
                HapiAuthJwt
            ]);

            server.auth.strategy(
                'iotc-signin',
                'bell',
                this.getAzureStrategyProviderConfig(this.config.get('authChaosClientTenantId'), 'bell-azure')
            );

            server.auth.strategy('iotc-session', 'cookie', {
                cookie: {
                    name: 'iotc-sid',
                    password: this.config.get('sessionChaosClientCookiePassword'),
                    path: '/',
                    isSecure: this.config.get('authForceHttps') === 'true'
                },
                requestDecoratorName: 'iotcSessionAuth',
                redirectTo: '/',
                appendNext: true
            });

            server.auth.strategy('iotc-jwt', 'jwt', {
                key: this.auth.serviceSecret,
                validate: this.validateServiceAccessTokenRequest,
                verifyOptions: {
                    issuer: this.auth.serviceIssuer
                }
            });
        }
        catch (ex) {
            this.server.log([ModuleName, 'error'], 'Failed to register auth strategies');
        }
    }

    private getAzureStrategyProviderConfig(tenantId: string, cookieName: string) {
        return {
            provider: {
                name: 'azure',
                protocol: 'oauth2',
                useParamsAuth: true,
                auth: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
                token: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
                scope: [
                    'openid',
                    'offline_access',       // Enable app to get refresh_tokens
                    'profile',              // Get basic info such as name, preferred username and objectId
                    'user.read'             // Read basic user info through /me endpoint
                ],
                profile: this.getMicrosoftGraphProfileInfo
            },
            password: this.config.get('authChaosClientCookiePassword'),
            clientId: this.config.get('authChaosClientClientId'),
            clientSecret: this.config.get('authChaosClientClientSecret'),
            forceHttps: this.config.get('authForceHttps'),
            location: (request: any) => {
                return this.setBaseRedirectUrl(request, this.config.get('authChaosClientSigninRedirectUrl'));
            },
            cookie: cookieName,
            isSecure: this.config.get('authForceHttps') === 'true'
        };
    }

    @bind
    private async getMicrosoftGraphProfileInfo(credentials: any, _params: any, get: any) {
        try {
            // credentials: { provider, query, token, refreshToken, expiresIn }

            const profile = await get('https://graph.microsoft.com/v1.0/me');

            credentials.profile = {
                role: this.auth.serviceAdmins.includes(profile.id) ? 'admin' : 'api-client',
                id: profile.id,
                displayName: profile.displayName,
                email: profile.userPrincipalName || profile.mail,
                raw: profile
            };
        }
        catch (ex) {
            throw boomInternal(`Failed to obtain Microsoft Graph user profile`, ex);
        }
    }

    @bind
    private async validateServiceAccessTokenRequest(decoded: any, _request: Request, _h: ResponseToolkit) {
        if (!decoded.id || !decoded.scope || !Array.isArray(decoded.scope)) {
            return {
                isValid: false
            };
        }

        return {
            isValid: true,
            credentials: {
                scope: decoded.scope
            }
        };
    }

    private setBaseRedirectUrl(request: Request, signinUrl: string) {
        const redirectProtocol = this.auth.getRedirectProtocol(request);
        const redirectHost = this.auth.getRedirectHost(request);
        if (redirectHost && redirectProtocol) {
            return `${redirectProtocol}://${redirectHost}${signinUrl}`;
        }

        return '';
    }
}
