import { service, inject } from 'spryly';
import { Server } from '@hapi/hapi';
import { LoopBoxCosmosDbService } from './loopBoxCosmosDb';
import { v4 as uuidV4 } from 'uuid';

@service('loopbox')
export class LoopBoxService {
    @inject('$server')
    private server: Server;

    @inject('loopBoxCosmosDb')
    private loopBoxCosmosDb: LoopBoxCosmosDbService;

    public async init(): Promise<void> {
        this.server.log(['LoopBoxService', 'info'], 'initialize');
    }

    public async setLoopBoxClaimToken(loopBoxClaimToken: string, systemId: string): Promise<any> {
        const resolvedClaimToken = (loopBoxClaimToken || '').toUpperCase();

        const querySpec = {
            query: 'SELECT * FROM loopBoxes l WHERE l.claimToken = @claimToken',
            parameters: [{
                name: '@claimToken',
                value: resolvedClaimToken
            }]
        };

        const loopBox = await this.loopBoxCosmosDb.loopBoxes.getDocumentWithQuery(querySpec);
        if (!loopBox) {
            await this.loopBoxCosmosDb.claimTokens.replaceDocument({
                id: systemId,
                tokenId: loopBoxClaimToken
            });
        }

        return loopBox;
    }

    public async updateLoopBoxRegistration(systemId: string, systemName: string): Promise<any> {
        const loopBox = await this.loopBoxCosmosDb.loopBoxes.getDocumentById(systemId);
        if (!loopBox) {
            throw new Error(`Error updating LoopBox registration: no LoopBox ${systemId}`);
        }

        loopBox.systemName = systemName;
        return this.loopBoxCosmosDb.loopBoxes.replaceDocument(loopBox);
    }

    public async getLoopBoxesForUser(userId: string): Promise<any> {
        const user = await this.getLoopBoxUserById(userId);
        if (!user) {
            this.server.log(['IdentityService', 'info'], `No user found with userid: ${userId}`);

            throw new Error(`No user found with userid: ${userId}`);
        }

        const loopBoxes = [];
        for (const loopBoxSystem of user.loopBoxSystems) {
            const loopBox = await this.loopBoxCosmosDb.loopBoxes.getDocumentById(loopBoxSystem.id);
            if (loopBox) {
                loopBoxes.push(loopBox);
            }
        }

        return loopBoxes;
    }

    public async claimLoopBoxWithToken(tokenId: string, userId: string): Promise<any> {
        this.server.log(['IdentityService', 'info'], 'claimLoopBoxWithToken');

        const resolvedTokenId = (tokenId || '').toUpperCase();

        const querySpec = {
            query: 'SELECT * FROM loopBoxClaimTokens l WHERE l.tokenId = @claimToken',
            parameters: [{
                name: '@claimToken',
                value: resolvedTokenId
            }]
        };

        const claimToken = await this.loopBoxCosmosDb.claimTokens.getDocumentWithQuery(querySpec);
        if (!claimToken) {
            throw new Error(`No LoopBox registration token: ${resolvedTokenId} exists`);
        }

        const loopBox = await this.loopBoxCosmosDb.loopBoxes.createDocument({
            id: claimToken.id,
            systemName: 'New LoopBox',
            claimToken: resolvedTokenId
        });

        await this.loopBoxCosmosDb.claimTokens.deleteDocument(claimToken.id);

        const user = await this.getLoopBoxUserById(userId);
        if (!user.loopBoxSystems.find((loopBoxSystem: any) => loopBoxSystem.id === loopBox.id)) {
            user.loopBoxSystems.push({
                id: loopBox.id,
                hookTokens: []
            });
        }

        await this.loopBoxCosmosDb.users.replaceDocument(user);

        const scope = user.loopBoxSystems.map((loopBoxSystem: any) => `user-${loopBoxSystem.id}`);

        return { loopBox, scope };
    }

    public async getLoopBoxUserById(userId: string): Promise<any> {
        return this.loopBoxCosmosDb.users.getDocumentById(userId);
    }

    public async getLoopBoxUserByAuthProviderId(userId: string): Promise<any> {
        const querySpec = {
            query: 'SELECT * FROM loopBoxUsers u WHERE u.authProviderId = @authProviderId',
            parameters: [{
                name: '@authProviderId',
                value: userId
            }]
        };

        return this.loopBoxCosmosDb.users.getDocumentWithQuery(querySpec);
    }

    public async createLoopBoxUser(profile: any, authProvider: string): Promise<any> {
        return this.loopBoxCosmosDb.users.createDocument({
            id: uuidV4(),
            authProviderId: profile.id,
            authProvider,
            displayName: profile.displayName,
            email: profile.email,
            loopBoxSystems: []
        });
    }
}
