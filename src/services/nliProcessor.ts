import { service, inject } from 'spryly';
import { Server } from '@hapi/hapi';
import { ConfigService } from './config';
import * as Wreck from '@hapi/wreck';
import { INliProcessorRequest, INliProcessorResponse } from '../types/chaosTypes';

@service('nliProcessor')
export class NliProcessorService {
    @inject('$server')
    private server: Server;

    @inject('config')
    private config: ConfigService;

    public async processInput(nliProcessorRequest: INliProcessorRequest): Promise<INliProcessorResponse> {
        try {
            const options = {
                payload: nliProcessorRequest,
                json: true
            };

            const { res, payload } = await Wreck.post(`${this.config.get('loopboxNliProcessorEndpoint')}/api/v1/nli/input`, options);

            if (res.statusCode < 200 || res.statusCode > 299) {
                this.server.log(['DomainProcessor', 'error'], `Response status code = ${res.statusCode}`);

                throw (new Error((payload as any)?.message || (payload as any)?.error?.message || payload || 'An error occurred'));
            }

            return payload as INliProcessorResponse;
        }
        catch (ex) {
            this.server.log(['DomainProcessor', 'error'], `processInput: ${ex.message}`);
            throw ex;
        }
    }
}
