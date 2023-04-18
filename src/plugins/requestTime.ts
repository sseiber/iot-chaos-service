import { HapiPlugin } from 'spryly';
import { Server, Request, ResponseToolkit } from '@hapi/hapi';
import {
    Boom
} from '@hapi/boom';

const ModuleName = 'RequestTimePlugin';

export class RequestTimePlugin implements HapiPlugin {
    public async register(server: Server, _options: any): Promise<void> {
        server.log([ModuleName, 'info'], 'register');

        try {
            server.ext('onRequest', (request: Request, h: ResponseToolkit) => {
                request.headers['x-req-start'] = process.hrtime.bigint();

                return h.continue;
            });
            server.ext('onPreResponse', (request: Request, h: ResponseToolkit) => {
                const start = request.headers['x-req-start'];
                const end = process.hrtime.bigint();

                if (request.response && !(request.response instanceof Boom)) {
                    request.response
                        .header('x-req-start', `${start}`)
                        .header('x-res-end', `${end}`)
                        .header('x-response-time', `${Number(BigInt.asIntN(64, end - start)) / 1000000000}`);
                }

                return h.continue;
            });
        }
        catch (ex) {
            server.log([ModuleName, 'error'], `Error while registering input adapters: ${ex.message}`);
        }
    }
}
