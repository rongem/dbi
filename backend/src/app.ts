import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import express = require('express');
import ntlm = require('express-ntlm');
import fs = require('fs');

import { error404 } from './controllers/error.controller.js';
import { HttpError } from './models/rest-api/httpError.model.js';
import { EnvironmentController } from './controllers/environment.controller.js';
import { getAuthentication } from './controllers/auth.controller.js';
import tablesRouter from './routes/tables.routes.js';
import tableRouter from './routes/table.routes.js';
import userRouter from './routes/user.routes.js';


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

const basePath = __dirname + '/views/';
let localePath = 'en';
if (fs.existsSync(basePath + env.locale)) localePath = env.locale;
const angularPath = basePath + localePath;

app.use(express.static(basePath));
app.get('/', (req, res) => res.sendFile(angularPath + '/index.html'));
app.use('/', error404);

app.use((error: ErrorRequestHandler, req: Request, res: Response, next: NextFunction) => {
    const status = error instanceof HttpError ? error.httpStatusCode : 500;
    const message = error instanceof HttpError ? error.message : error.toString();
    const data = error instanceof HttpError && error.data ? error.data : undefined;
    res.status(status).json({message, data});
});

export { app };
