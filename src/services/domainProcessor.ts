import { service, inject } from 'spryly';
import { Server } from '@hapi/hapi';
import { ConfigService } from './config';
import * as Wreck from '@hapi/wreck';
import { IDomainProcessorRequest, IDomainProcessorResponse } from '../types/chaosTypes';

@service('domainProcessor')
export class DomainProcessorService {
    @inject('$server')
    private server: Server;

    @inject('config')
    private config: ConfigService;

    public async refineIntent(domainProcessorRequest: IDomainProcessorRequest): Promise<IDomainProcessorResponse> {
        const options = {
            payload: domainProcessorRequest,
            json: true
        };

        try {
            const { res, payload } = await Wreck.post(`${this.config.get('loopboxDomainProcessorEndpoint')}/api/v1/process/refine`, options);

            if (res.statusCode < 200 || res.statusCode > 299) {
                this.server.log(['DomainProcessor', 'error'], `Response status code = ${res.statusCode}`);

                throw (new Error((payload as any)?.message || (payload as any)?.error?.message || payload || 'An error occurred'));
            }

            return payload as IDomainProcessorResponse;
        }
        catch (ex) {
            this.server.log(['DomainProcessor', 'error'], `refineIntent: ${ex.message}`);
            throw ex;
        }
    }
}
