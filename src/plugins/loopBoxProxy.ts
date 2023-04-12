import { HapiPlugin, inject } from 'spryly';
import { Server } from '@hapi/hapi';
import * as Nes from '@hapi/nes';
import { LoopBoxProxyService } from '../services/loopBoxProxy';

export class LoopBoxProxyPlugin implements HapiPlugin {
    @inject('loopBoxProxy')
    private loopBoxProxy: LoopBoxProxyService;

    public async register(server: Server): Promise<void> {
        await server.register({
            plugin: Nes,
            options: {
                onConnection: this.loopBoxProxy.clientConnection.bind(this.loopBoxProxy),
                onDisconnection: this.loopBoxProxy.clientDisconnection.bind(this.loopBoxProxy),
                onMessage: this.loopBoxProxy.clientMessageResponse.bind(this.loopBoxProxy),
                auth: false,
                heartbeat: {
                    interval: 10000,
                    timeout: 5000
                }
            }
        });
    }
}
