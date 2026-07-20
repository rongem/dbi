// import { checkDatabase } from './models/db';

import { app } from './app.js';
import { validateRuntimeConfig } from './config/validate-runtime-config.js';
import { checkDatabase } from './models/db.js';

validateRuntimeConfig();

checkDatabase().then((result) => {
    if (result === true) {
        app.listen(8000);
    }
});
