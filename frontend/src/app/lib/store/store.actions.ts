import { createAction, props } from '@ngrx/store';
import { User } from '../models/rest-backend/user.model';
import { Table } from '../models/rest-backend/table.model';

export const retrieveUser = createAction('[User] Retrieve user from Backend');

export const setUser = createAction('[User] Set user',
    props<User>()
);

export const setWorkingState = createAction('[App] Set working state of app',
    props<{ working: boolean }>()
);

export const setError = createAction('[Error] Set error',
    props<{ error?: string }>()
);

export const loadTables = createAction('[Tables] Load');

export const tablesLoaded = createAction('[Tables] Finished loading tables',
    props<{tables: Table[]}>()
);
