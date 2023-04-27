import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import express = require('express');
import ntlm = require('express-ntlm');

import { error404 } from './controllers/error.controller';
// import { getAuthentication } from './controllers/authentication.controller';
import { HttpError } from './models/rest-api/httpError.model';
import { EnvironmentController } from './controllers/environment.controller';
// import { checkDatabase } from './models/db';
// import restRouter from './routes/rest.routes';

const app = express();
let exp: any;

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

// app.use('/rest', express.json({limit: '50mb'}), getAuthentication, restRouter);

app.use('/', error404);

app.use((error: ErrorRequestHandler, req: Request, res: Response, next: NextFunction) => {
    const status = error instanceof HttpError ? error.httpStatusCode : 500;
    const message = error instanceof HttpError ? error.message : error.toString();
    const data = error instanceof HttpError && error.data ? error.data : undefined;
    res.status(status).json({message, data});
});

// checkDatabase().then((result) => {
//     if (result === true) {
//         const server = app.listen(8000);
//         exp = server;
//     }
// });

export default () => exp;

const a: any = {z: 1, y: 2, b: 'xxx', x: 3};
const b: any = {a: 1, b: 'zwei', c: '3', d: Date.now().toLocaleString(), e: false, f: {}, g: new Date('2022-01-01')};

Object.keys(a).sort().forEach(key => console.log(key, typeof a[key]));
Object.keys(b).forEach(key => console.log(key, typeof b[key]));
console.log(b.g, typeof b.g, b.g.constructor);

