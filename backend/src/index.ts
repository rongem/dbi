// import { checkDatabase } from './models/db';

import { app } from './app';
import { checkDatabase } from './models/db';

checkDatabase().then((result) => {
    if (result === true) {
        app.listen(8000);
    }
});
