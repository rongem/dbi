// import { checkDatabase } from './models/db';

import { app } from './app.js';
import { checkDatabase } from './models/db.js';

checkDatabase().then((result) => {
    if (result === true) {
        app.listen(8000);
    }
});
