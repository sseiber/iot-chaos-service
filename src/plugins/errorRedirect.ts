import { HapiPlugin, inject } from 'spryly';
import { Server, Request, ResponseToolkit } from '@hapi/hapi';
import { ConfigService } from '../services/config';
import { bind } from '../utils';

export class ErrorRedirectPlugin implements HapiPlugin {
    @inject('config')
    private config: ConfigService;

    public async register(server: Server, _options: any): Promise<void> {
        server.log(['ErrorRedirectPlugin', 'info'], 'register');

        try {
            server.ext('onPreResponse', this.preResponse);
        }
        catch (ex) {
            server.log(['ErrorRedirectPlugin', 'error'], `Error while registering input adapters: ${ex.message}`);
        }
    }

    @bind
    private async preResponse(request: Request, h: ResponseToolkit) {
        if ((request?.response as any)?.output?.statusCode === 500 && request?.url?.pathname === this.config.get('authChaosClientSigninRedirectUrl')) {
            return h.redirect('/user');
        }

        return h.continue;
    }
}
