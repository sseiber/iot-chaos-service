import { service, inject } from 'spryly';
import { Server } from '@hapi/hapi';
// import { LoopBoxService } from './loopbox';

class DeferredPromise {
    public then: any;
    public catch: any;
    public resolve: any;
    public reject: any;
    private promiseInternal: any;

    constructor() {
        this.promiseInternal = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
        this.then = this.promiseInternal.then.bind(this.promiseInternal);
        this.catch = this.promiseInternal.catch.bind(this.promiseInternal);
    }

    public get promise() {
        return this.promiseInternal;
    }
}

@service('loopBoxProxy')
export class LoopBoxProxyService {
    @inject('$server')
    private server: Server;

    // @inject('loopbox')
    // private loopbox: LoopBoxService;

    private callbackMap: Map<string, any>;
    private registeredLoopBoxServices: Map<string, any>;

    public async init(): Promise<void> {
        this.server.log(['LoopBoxProxyService', 'info'], 'initialize loopbox proxy service');

        this.callbackMap = new Map<string, any>();
        this.registeredLoopBoxServices = new Map<string, any>();
    }

    public async clientConnection(socket: any): Promise<void> {
        this.server.log(['LoopBoxProxyService', 'info'], `Client connection received, socketId: ${socket.id}`);
    }

    public clientDisconnection(socket: any): void {
        this.server.log(['LoopBoxProxyService', 'info'], `Client disconnected, socketId: ${socket.id}`);
    }

    public async clientMessageResponse(socket: any, data: any): Promise<any> {
        const messageType = data?.type;

        if (!messageType) {
            throw new Error(`Invalid data passed as message body: ${data}`);
        }

        if (messageType === 'proxyResponse') {
            const responseData = this.callbackMap.get(data?.payload?.proxyRequestId);

            if (!responseData) {
                return { message: 'Error no queued request found in server callback' };
            }

            clearTimeout(responseData.proxyResponseTimeoutId);

            this.callbackMap.delete(responseData.proxyRequestId);

            // respond back to the originating internet client
            responseData.proxyPromise.resolve(data.raw ? data?.payload : data?.payload?.intent);

            return { message: `Success, processed queued requestId: ${data?.payload?.proxyRequestId}` };
        }

        if (messageType === 'registerLoopBoxId') {
            const loopBoxId = data?.payload.loopBoxId;

            if (!loopBoxId) {
                return { message: 'LoopBox registeration message missing loopBoxId' };
            }

            try {
                const setupToken = data?.payload?.setupToken;
                if (!setupToken) {
                    return { message: 'LoopBox registeration message missing setupToken' };
                }

                // await this.loopbox.setLoopBoxClaimToken(setupToken, loopBoxId);

                this.registeredLoopBoxServices.set(loopBoxId, { socket });
                this.server.log(['clientMessageResponse', 'info'], `New LoopBox registered loopBoxId: ${loopBoxId}`);

                return { message: `Success, received loopBoxId registration from: ${loopBoxId}` };
            }
            catch (error) {
                return { message: error.message };
            }
        }

        // if (messageType === 'updateLoopBoxRegistration') {
        //     const loopBoxId = data?.payload?.loopBoxId;
        //     const systemName = data?.payload?.systemName;

        //     if (!loopBoxId || !systemName) {
        //         return { message: 'LoopBox updateLoopBoxRegistration message missing loopBoxId or systemName param' };
        //     }

        //     try {
        //         await this.loopbox.updateLoopBoxRegistration(loopBoxId, systemName);

        //         return { message: `Success updated registration for LoopBox id: ${loopBoxId}` };
        //     }
        //     catch (error) {
        //         return { message: error.message };
        //     }
        // }

        throw new Error(`Unknown client message type: ${data.type}`);
    }

    public async proxyRequest(proxyRequest: any): Promise<any> {
        const proxyRequestData = proxyRequest;
        const loopBoxId = proxyRequest.loopBoxId;

        if (!this.registeredLoopBoxServices.has(loopBoxId)) {
            throw new Error(`LoopBox id: ${loopBoxId} is not registered with the LoopBox service`);
        }

        const proxyPromise = new DeferredPromise();

        const proxyResponseTimeoutId = setTimeout(() => {
            const originalResponseData = this.callbackMap.get(proxyRequestData.requestId);
            this.callbackMap.delete(proxyRequestData.requestId);

            const errorMessage = `Proxy request with id: ${proxyRequestData.requestId} timed out`;
            this.server.log(['LoopBoxProxyService', 'info'], errorMessage);

            if (originalResponseData.proxyPromise) {
                originalResponseData.proxyPromise.reject(new Error(errorMessage));
            }
        }, 10000);

        const responseData = {
            requestId: proxyRequestData.requestId,
            proxyResponseTimeoutId,
            proxyPromise
        };
        this.callbackMap.set(proxyRequestData.requestId, responseData);

        const socket = this.registeredLoopBoxServices.get(loopBoxId).socket;

        // call the proxy client (over websocket)
        try {
            await socket.send(proxyRequestData);

            this.server.log(['LoopBoxProxyService', 'info'], `Awaiting proxy response - path: ${proxyRequestData.path}`);

            return responseData.proxyPromise;
        }
        catch (error) {
            this.server.log(['LoopBoxProxyService', 'error'], `Failed to forward request to client: ${loopBoxId}`);

            this.callbackMap.delete(proxyRequestData.requestId);
            clearTimeout(proxyResponseTimeoutId);

            throw new Error(`Failed to forward request to client: ${loopBoxId}`);
        }
    }
}
