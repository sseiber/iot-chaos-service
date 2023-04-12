import { inject, RoutePlugin, route } from 'spryly';
import { Request, ResponseObject, ResponseToolkit } from '@hapi/hapi';
import { badRequest as boom_badRequest } from '@hapi/boom';
import { ProcessorService } from '../services/processor';
import {
    INliProcessorRequest,
    IDomainProcessorRequest
} from 'loopbox-types';

export class ProcessRoutes extends RoutePlugin {
    @inject('processor')
    private processor: ProcessorService;

    @route({
        method: 'POST',
        path: '/api/v1/process/nli',
        options: {
            tags: ['process'],
            description: 'Process the natural input to find the intent'
        }
    })
    public async postNli(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
        const nliProcessorRequest = request.payload as INliProcessorRequest;
        if (!nliProcessorRequest.loopBoxIntent) {
            throw boom_badRequest('Expected input in request payload');
        }

        if (!nliProcessorRequest.context) {
            throw boom_badRequest('Expected context in request payload');
        }

        try {
            const processedInput = await this.processor.processInput(nliProcessorRequest);
            return h.response(processedInput).code(201);
        }
        catch (error) {
            throw boom_badRequest(error.message);
        }
    }

    @route({
        method: 'POST',
        path: '/api/v1/process/refine',
        options: {
            tags: ['process'],
            description: 'Refine the intent based on domain'
        }
    })
    public async postRefine(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
        const domainProcessorRequest = request.payload as IDomainProcessorRequest;
        if (!domainProcessorRequest.loopBoxIntent) {
            throw boom_badRequest('Expected input in request playload');
        }

        if (!domainProcessorRequest.context) {
            throw boom_badRequest('Expected context in request payload');
        }

        try {
            const processedInput = await this.processor.refineInput(domainProcessorRequest);
            return h.response(processedInput).code(201);
        }
        catch (error) {
            throw boom_badRequest(error.message);
        }
    }
}
