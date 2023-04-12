import { Server } from '@hapi/hapi';
import { Database } from '@azure/cosmos';
import { CosmosDBContainer } from './cosmosDbContainer';

export interface ILoopBox {
    id: string;
    systemName: string;
    claimToken: string;
}

export class LoopBox extends CosmosDBContainer {
    constructor(cosmosDb: Database, containerDef: any, server: Server) {
        super(cosmosDb, containerDef, server);
    }
}
