import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import express = require('express');
import ntlm = require('express-ntlm');

import { error404 } from './controllers/error.controller';
import { HttpError } from './models/rest-api/httpError.model';
import { EnvironmentController } from './controllers/environment.controller';
// import restRouter from './routes/rest.routes';

const app = express();

const env = EnvironmentController.instance;

if (env.authMode === 'ntlm') {
    const ntlmOptions: ntlm.Options = {
        // debug: function() {
        //     const args = Array.prototype.slice.apply(arguments);
        //     console.log('debug-ntlm', args);
        // },
    };
    if (!!env.ldapDomain) {
        ntlmOptions.domain = env.ldapDomain;
    }
    if (!!env.ldapServer) {
        ntlmOptions.domaincontroller = env.ldapServer;
    }
    app.use(ntlm(ntlmOptions));
}

app.use('/', error404);

app.use((error: ErrorRequestHandler, req: Request, res: Response, next: NextFunction) => {
    const status = error instanceof HttpError ? error.httpStatusCode : 500;
    const message = error instanceof HttpError ? error.message : error.toString();
    const data = error instanceof HttpError && error.data ? error.data : undefined;
    res.status(status).json({message, data});
});

export { app };
