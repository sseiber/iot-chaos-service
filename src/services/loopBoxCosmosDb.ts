import { service, inject } from 'spryly';
import { Server } from '@hapi/hapi';
import { ConfigService } from './config';
import { CosmosDBContainer } from '../models/cosmosDbContainer';
import { CosmosClient, Database } from '@azure/cosmos';
import { DbExperiment } from '../models/experiment';
import { DbChaosUser } from '../models/chaosUser';

interface IContainerDefs {
    [key: string]: any;
}

const loopBoxContainerDefs: IContainerDefs = {
    chaosExperiments: DbExperiment,
    chaosUsers: DbChaosUser
};

@service('loopBoxCosmosDb')
export class LoopBoxCosmosDbService {
    @inject('$server')
    private server: Server;

    @inject('config')
    private config: ConfigService;

    private client: CosmosClient;
    private loopBoxCosmosDb: Database;
    private loopBoxCosmosDbContainers: { [key: string]: CosmosDBContainer };

    public get chaosUsers(): CosmosDBContainer {
        return this.loopBoxCosmosDbContainers.chaosUsers;
    }

    public get chaosExperiments(): CosmosDBContainer {
        return this.loopBoxCosmosDbContainers.chaosExperiments;
    }

    public async init(): Promise<void> {
        this.server.log(['LoopBoxCosmosDb', 'info'], 'initialize');

        try {
            this.client = new CosmosClient({
                endpoint: this.config.get('docDbEndpoint'),
                key: this.config.get('docDbPrimaryKey')
            });

            const partitionKey = { kind: 'Hash', paths: ['/id'] };

            const { database } = await this.client.databases.createIfNotExists({ id: this.config.get('docDbDatabase') });
            this.loopBoxCosmosDb = database;

            for (const containerId in loopBoxContainerDefs) {
                if (!Object.prototype.hasOwnProperty.call(loopBoxContainerDefs, containerId)) {
                    continue;
                }

                const { container } = await this.loopBoxCosmosDb.containers.createIfNotExists({ id: containerId, partitionKey }, { offerThroughput: 400 });
                const { resource: containerDef } = await container.read();

                const loopBoxCosmosDbContainer = new loopBoxContainerDefs[containerId](database, containerDef, this.server);

                this.loopBoxCosmosDbContainers = {
                    ...this.loopBoxCosmosDbContainers,
                    [containerId]: loopBoxCosmosDbContainer
                };
            }
        }
        catch (ex) {
            this.server.log(['LoopBoxCosmosDb', 'error'], `Error initializing LoopBox Cosmos Db: ${ex.message}`);
        }
    }
}
