import { service, inject } from 'spryly';
import { Server } from '@hapi/hapi';
import { LoopBoxCosmosDbService } from './loopBoxCosmosDb';
import { v4 as uuidV4 } from 'uuid';
import { IChaosExperiment } from '../types/chaosTypes';
import { IDbChaosUser } from '../models/chaosUser';
import { IDbExperiment } from '../models/experiment';

@service('loopbox')
export class LoopBoxService {
    @inject('$server')
    private server: Server;

    @inject('loopBoxCosmosDb')
    private loopBoxCosmosDb: LoopBoxCosmosDbService;

    public async init(): Promise<void> {
        this.server.log(['LoopBoxService', 'info'], 'initialize');
    }

    // public async setLoopBoxClaimToken(loopBoxClaimToken: string, systemId: string): Promise<any> {
    //     const resolvedClaimToken = (loopBoxClaimToken || '').toUpperCase();

    //     const querySpec = {
    //         query: 'SELECT * FROM loopBoxes l WHERE l.claimToken = @claimToken',
    //         parameters: [{
    //             name: '@claimToken',
    //             value: resolvedClaimToken
    //         }]
    //     };

    //     const loopBox = await this.loopBoxCosmosDb.chaosExperiments.getDocumentWithQuery(querySpec);
    //     if (!loopBox) {
    //         await this.loopBoxCosmosDb.claimTokens.replaceDocument({
    //             id: systemId,
    //             tokenId: loopBoxClaimToken
    //         });
    //     }

    //     return loopBox;
    // }

    public async updateChaosExperiment(id: string, updatedExperiment: IChaosExperiment): Promise<any> {
        const experiment = await this.loopBoxCosmosDb.chaosExperiments.getDocumentById(id);
        if (!experiment) {
            throw new Error(`Error updating Chaos experiment: no experiment found with id: ${id}`);
        }

        const newExperiment = {
            ...updatedExperiment
        };

        return this.loopBoxCosmosDb.chaosExperiments.replaceDocument(newExperiment);
    }

    public async getExperimentsForUser(userId: string): Promise<IDbExperiment[]> {
        const user = await this.getChaosUserById(userId);
        if (!user) {
            this.server.log(['IdentityService', 'info'], `No user found with userid: ${userId}`);

            throw new Error(`No user found with userid: ${userId}`);
        }

        const chaosExperiments: IDbExperiment[] = [];

        for (const experimentId of user.experiments) {
            const chaosExperiment = await this.loopBoxCosmosDb.chaosExperiments.getDocumentById(experimentId);
            if (chaosExperiment) {
                chaosExperiments.push({
                    id: chaosExperiment.id,
                    active: chaosExperiment.active,
                    name: chaosExperiment.name,
                    description: chaosExperiment.description
                });
            }
        }

        return chaosExperiments;
    }

    public async configureExperimentsForUser(userId: string, experiments: IChaosExperiment[]): Promise<any> {
        this.server.log(['IdentityService', 'info'], 'configureExperimentsForUser');

        const experimentIds: string[] = [];

        for (const experiment of experiments) {
            experimentIds.push(experiment.id);

            const querySpec = {
                query: 'SELECT * FROM chaosExperiments l WHERE l.id = @experimentId',
                parameters: [{
                    name: '@experimentId',
                    value: experiment.id
                }]
            };

            const chaosExperimentDoc = await this.loopBoxCosmosDb.chaosExperiments.getDocumentWithQuery(querySpec);
            if (!chaosExperimentDoc) {
                throw new Error(`No Chaos experiment with id: ${experiment.id} exists`);
            }

            await this.loopBoxCosmosDb.chaosExperiments.replaceDocument(experiment);
        }

        const user = await this.getChaosUserById(userId);
        if (!user) {
            this.server.log(['IdentityService', 'info'], `No user found with userid: ${userId}`);

            throw new Error(`No user found with userid: ${userId}`);
        }

        user.experiments = experimentIds;

        await this.loopBoxCosmosDb.chaosUsers.replaceDocument(user);

        const scope = user.experiments.map((experimentId: string) => `user-${experimentId}`);

        return scope;
    }

    public async getChaosUserById(userId: string): Promise<IDbChaosUser> {
        const chaosUser = await this.loopBoxCosmosDb.chaosUsers.getDocumentById(userId);
        if (!chaosUser) {
            throw new Error(`No Chaos user with id: ${userId} exists`);
        }

        return {
            id: chaosUser.id,
            provider: chaosUser.authProvider,
            displayName: chaosUser.displayName,
            email: chaosUser.email,
            experiments: [
                ...chaosUser.experiments
            ]
        };
    }

    public async getChaosUserByAuthProviderId(authProviderId: string): Promise<any> {
        const querySpec = {
            query: 'SELECT * FROM chaosUsers u WHERE u.authProviderId = @authProviderId',
            parameters: [{
                name: '@authProviderId',
                value: authProviderId
            }]
        };

        return this.loopBoxCosmosDb.chaosUsers.getDocumentWithQuery(querySpec);
    }

    public async createChaosUser(credentials: any): Promise<any> {
        const profile = credentials?.profile as any;

        return this.loopBoxCosmosDb.chaosUsers.createDocument({
            id: uuidV4(),
            authProviderId: profile.id,
            authProvider: credentials.provider || 'unknown',
            displayName: profile.displayName,
            email: profile.email,
            experiments: []
        });
    }
}
