import { RoutePlugin, route } from 'spryly';
import { Request, ResponseObject, ResponseToolkit } from '@hapi/hapi';

export class HealthRoutes extends RoutePlugin {
    @route({
        method: 'GET',
        path: '/health',
        options: {
            tags: ['health'],
            description: 'Health status',
            auth: false
        }
    })
    public async health(_request: Request, h: ResponseToolkit): Promise<ResponseObject> {
        return h.response('healthy').code(200);
    }
}
