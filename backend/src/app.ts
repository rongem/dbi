import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import express = require('express');
import ntlm = require('express-ntlm');

import { error404 } from './controllers/error.controller';
import { HttpError } from './models/rest-api/httpError.model';
import { EnvironmentController } from './controllers/environment.controller';
import { getAuthentication } from './controllers/auth.controller';
import tablesRouter from './routes/tables.routes';
import tableRouter from './routes/table.routes';
import userRouter from './routes/user.routes';

const app = express();

const env = EnvironmentController.instance;

if (env.authMode === 'ntlm') {
    const ntlmOptions: ntlm.Options = {
        // debug: function() {
        //     const args = Array.prototype.slice.apply(arguments);
        //     console.log('debug-ntlm', args);
        // },
    };
    app.use(ntlm(ntlmOptions));
}

// express.json({limit: '50mb'}) -> after route to enhance upload size
app.use('/tables', getAuthentication, tablesRouter);
app.use('/table', express.json({limit: '50mb'}), getAuthentication, tableRouter);
app.use('/user', getAuthentication, userRouter);

const path = __dirname + '/views';
app.use(express.static(path));
app.get('/', (req, res) => res.sendFile(path + '/index.html'));
app.use('/', error404);

app.use((error: ErrorRequestHandler, req: Request, res: Response, next: NextFunction) => {
    const status = error instanceof HttpError ? error.httpStatusCode : 500;
    const message = error instanceof HttpError ? error.message : error.toString();
    const data = error instanceof HttpError && error.data ? error.data : undefined;
    res.status(status).json({message, data});
});

export { app };
