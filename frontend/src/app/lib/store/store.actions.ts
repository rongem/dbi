import { createAction, props } from '@ngrx/store';
import { User } from '../models/rest-backend/user.model';
import { Table } from '../models/rest-backend/table.model';

export const setUser = createAction('[User] Set user',
    props<User>()
);

export const retrieveUser = createAction('[User] Retrieve user from Backend');

export const loadTables = createAction('[Tables] Load');

export const tablesLoaded = createAction('[Tables] Finished loading tables',
    props<{tables: Table[]}>()
);

