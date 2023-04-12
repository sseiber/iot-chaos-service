import { ComposeManifest } from 'spryly';
import { pjson } from './utils';

const pkg = pjson();

const DefaultPort = 8084;
const PORT = process.env.PORT || process.env.port || process.env.PORT0 || process.env.port0 || DefaultPort;

export function manifest(_config?: any): ComposeManifest {
    return {
        server: {
            port: PORT,
            app: {
                version: pkg.version,
                slogan: 'IoT chaos service'
            }
        },
        services: [
            './services'
        ],
        plugins: [
            ...[
                {
                    plugin: '@hapi/inert'
                }
            ],
            ...[
                {
                    plugin: './plugins'
                }
            ],
            ...[
                {
                    plugin: './apis'
                }
            ]
        ]
    };
}
