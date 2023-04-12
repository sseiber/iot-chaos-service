import { Server } from '@hapi/hapi';
import { Database } from '@azure/cosmos';
import { CosmosDBContainer } from './cosmosDbContainer';

export interface ILoopBoxUser {
    id: string;
    provider: string;
    displayName: string;
    email: string;
    loopBoxSystems: string[];
}

export class LoopBoxUser extends CosmosDBContainer {
    constructor(cosmosDb: Database, containerDef: any, server: Server) {
        super(cosmosDb, containerDef, server);
    }
}
