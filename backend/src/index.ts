// import { checkDatabase } from './models/db';

import { app } from './app.js';
import { readRuntimeConfig } from './config/runtime-config.js';
import { validateRuntimeConfig } from './config/validate-runtime-config.js';
import { checkDatabase } from './models/db.js';

const env = readRuntimeConfig();
validateRuntimeConfig(env);

checkDatabase().then((result) => {
    if (result === true) {
        app.listen(+env.appPort);
    }
});
