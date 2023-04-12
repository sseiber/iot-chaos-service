import { Server } from '@hapi/hapi';
import { Database } from '@azure/cosmos';
import { CosmosDBContainer } from './cosmosDbContainer';

export interface ILoopBoxClaimToken {
    id: string;
    tokenId: string;
}

export class LoopBoxClaimToken extends CosmosDBContainer {
    constructor(cosmosDb: Database, containerDef: any, server: Server) {
        super(cosmosDb, containerDef, server);
    }
}
