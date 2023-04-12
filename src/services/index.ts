
import { AuthService } from './auth';
import { ConfigService } from './config';
import { LoopBoxProxyService } from './loopBoxProxy';
import { ProcessorService } from './processor';
import { NliProcessorService } from './nliProcessor';
import { DomainProcessorService } from './domainProcessor';
import { LoopBoxService } from './loopbox';
import { LoopBoxCosmosDbService } from './loopBoxCosmosDb';

export default [
    AuthService,
    ConfigService,
    LoopBoxProxyService,
    ProcessorService,
    NliProcessorService,
    DomainProcessorService,
    LoopBoxService,
    LoopBoxCosmosDbService
];
