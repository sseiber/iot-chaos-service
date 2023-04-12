import { service, inject } from 'spryly';
import { NliProcessorService } from './nliProcessor';
import { DomainProcessorService } from './domainProcessor';
import {
    INliProcessorRequest,
    INliProcessorResponse,
    IDomainProcessorRequest,
    IDomainProcessorResponse
} from 'loopbox-types';

@service('processor')
export class ProcessorService {
    @inject('nliProcessor')
    private nliProcessor: NliProcessorService;

    @inject('domainProcessor')
    private domainProcessor: DomainProcessorService;

    public async processInput(nliProcessorRequest: INliProcessorRequest): Promise<INliProcessorResponse> {
        return this.nliProcessor.processInput(nliProcessorRequest);
    }

    public async refineInput(domainProcessorRequest: IDomainProcessorRequest): Promise<IDomainProcessorResponse> {
        return this.domainProcessor.refineIntent(domainProcessorRequest);
    }
}
