import { AuthPlugin } from './auth';
import { LoopBoxProxyPlugin } from './loopBoxProxy';
import { ErrorRedirectPlugin } from './errorRedirect';
import { RequestTimePlugin } from './requestTime';

export default [
    AuthPlugin,
    LoopBoxProxyPlugin,
    ErrorRedirectPlugin,
    RequestTimePlugin
];
