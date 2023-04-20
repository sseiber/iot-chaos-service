import { AuthPlugin } from './auth';
import { LoopBoxProxyPlugin } from './loopBoxProxy';
import { ErrorRedirectPlugin } from './errorRedirect';

export default [
    AuthPlugin,
    LoopBoxProxyPlugin,
    ErrorRedirectPlugin
];
