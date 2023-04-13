import { Server } from '@hapi/hapi';
import { Database } from '@azure/cosmos';
import { CosmosDBContainer } from './cosmosDbContainer';

export interface IDbChaosUser {
    id: string;
    provider: string;
    displayName: string;
    email: string;
    experiments: string[];
}

export class DbChaosUser extends CosmosDBContainer {
    constructor(cosmosDb: Database, containerDef: any, server: Server) {
        super(cosmosDb, containerDef, server);
    }
}
