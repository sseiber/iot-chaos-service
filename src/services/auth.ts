import { service, inject } from 'spryly';
import { Server, Request } from '@hapi/hapi';
import { ConfigService } from './config';
import { LoopBoxService } from './loopbox';
import { sign as jwtSign } from 'jsonwebtoken';
import { v4 as uuidV4 } from 'uuid';

const ModuleName = 'AuthService';

@service('auth')
export class AuthService {
    @inject('$server')
    private server: Server;

    @inject('config')
    private config: ConfigService;

    @inject('loopbox')
    private loopbox: LoopBoxService;

    private serviceAdminsInternal: string;
    private serviceSecretInternal: Buffer;
    private serviceIssuerInternal: string;
    private azureADClientIdInternal: string;
    private azureADIssuerInternal: string;

    public get serviceAdmins(): string {
        return this.serviceAdminsInternal;
    }

    public get serviceSecret(): Buffer {
        return this.serviceSecretInternal;
    }

    public get serviceIssuer(): string {
        return this.serviceIssuerInternal;
    }

    public get azureADClientId(): string {
        return this.azureADClientIdInternal;
    }

    public get azureADCIssuer(): string {
        return this.azureADIssuerInternal;
    }

    public async init(): Promise<void> {
        this.server.log([ModuleName, 'info'], 'initialize');

        this.serviceAdminsInternal = (this.config.get('serviceAdmins') || '').split(' ');

        this.serviceIssuerInternal = this.config.get('serverSystemId');
        if (!this.serviceIssuerInternal) {
            throw new Error('A service system id is required');
        }

        const secret = this.config.get('serverAuthSecret');
        if (!secret) {
            throw new Error('A service secret is required');
        }

        this.serviceSecretInternal = Buffer.from(secret, 'base64');

        this.azureADClientIdInternal = this.config.get('authChaosClientClientId');
    }

    public async providerSignin(request: Request, credentials: any): Promise<void> {
        this.server.log([ModuleName, 'info'], 'providerSignin');

        const profile = credentials?.profile;
        const authProvider = (request?.auth?.credentials as any)?.provider || 'unknown';

        let user = await this.loopbox.getLoopBoxUserByAuthProviderId(profile.id);
        if (!user) {
            user = await this.loopbox.createLoopBoxUser(profile, authProvider);
        }

        const scope = user.loopBoxSystems.map((loopBoxSystem: any) => `user-${loopBoxSystem.id}`);

        this.setSessionScope(request, user.id, scope);

        return user;
    }

    public setSessionScope(request: Request, userId: string, scope: string[]): void {
        const credentials = request?.auth?.credentials;

        scope.push('api-client');
        if (this.serviceAdmins.includes((credentials?.profile as any).id)) {
            scope.push('admin');
        }

        this.server.log([ModuleName, 'info'], `Profile: ${(credentials.profile as any).id || ''}`);

        (request as any).iotcSessionAuth.set({
            userId,
            provider: credentials?.provider || 'unknown',
            accessToken: credentials?.token || '',
            profile: {
                displayName: (credentials.profile as any).displayName || 'unknown',
                email: (credentials.profile as any).email || '',
                id: (credentials.profile as any).id || '',
                role: (credentials.profile as any).role || 'api-client'
            },
            scope
        });
    }

    public getRedirectProtocol(request: Request): string {
        const referer = request.headers?.referer;
        if (!referer) {
            return request.headers?.['x-forwarded-proto'] || '';
        }

        if (referer.startsWith('https')) {
            return 'https';
        }

        return 'http';
    }

    public getRedirectHost(request: Request): string {
        return request.headers?.['x-forwarded-host'] || request.headers?.host || '';
    }

    public async generateToken(scope: any): Promise<any> {
        const id = uuidV4();
        const arrayOfScope = Array.isArray(scope) ? scope : [scope];
        const payload = {
            id,
            // expiry: Date.now(), // TODO: implement expiry
            scope: arrayOfScope
        };

        const options = {
            issuer: this.serviceIssuerInternal
        };

        const token = await jwtSign(payload, this.serviceSecretInternal, options);

        return { token, id };
    }

    public async revokeToken(_id: string): Promise<void> {
        // TODO: implement
        return;
    }
}
