import { Request, Response, NextFunction } from 'express';
import express from 'express';
import ntlm from 'express-ntlm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { readRuntimeConfig } from './config/runtime-config.js';
import { error404 } from './controllers/error.controller.js';
import { HttpError } from './models/rest-api/httpError.model.js';
import { getAuthentication } from './controllers/auth.controller.js';
import tablesRouter from './routes/tables.routes.js';
import tableRouter from './routes/table.routes.js';
import userRouter from './routes/user.routes.js';


const app = express();

const env = readRuntimeConfig();

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

const filename = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url);
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(filename);
const basePath = path.join(dirname, '../views');
let localePath = 'en';
if (fs.existsSync(basePath + env.locale)) localePath = env.locale;
const angularPath = basePath + localePath;

app.use(express.static(basePath));
app.get('/', (req, res) => res.sendFile(angularPath + '/index.html'));
app.use('/', error404);

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    try {
        const isHttpError = error instanceof HttpError;
        const status = isHttpError ? error.httpStatusCode : 500;
        const message = isHttpError ? error.message : error?.toString?.() ?? String(error);
        const data = isHttpError && error.data ? error.data : undefined;
        res.status(status).json({message, data});
    } catch (handlerErr: any) {
        const message = typeof error === 'string' ? error : JSON.stringify(error, Object.getOwnPropertyNames(error));
        res.status(500).json({message: message || 'Unknown error', data: {handlerError: String(handlerErr)}});
    }
});

export { app };
