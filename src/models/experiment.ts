import { Server } from '@hapi/hapi';
import { Database } from '@azure/cosmos';
import { CosmosDBContainer } from './cosmosDbContainer';

export interface IDbExperiment {
    id: string;
    active: boolean;
    name: string;
    description: string;
}

export class DbExperiment extends CosmosDBContainer {
    constructor(cosmosDb: Database, containerDef: any, server: Server) {
        super(cosmosDb, containerDef, server);
    }
}
