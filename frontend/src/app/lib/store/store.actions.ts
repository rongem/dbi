import { createAction, props } from '@ngrx/store';
import { User } from '../models/rest-backend/user.model';
import { Table } from '../models/rest-backend/table.model';
import { Column } from '../models/rest-backend/column.model';
import { CellContent } from '../models/cellcontent.model';
import { RowContainer } from '../models/rest-backend/row-container.model';
import { ErrorList } from '../models/rest-backend/errorlist.model';

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

export const selectTable = createAction('[Tables] Select single table',
    props<Table>()
);

export const columnsLoaded = createAction('[Columns] Finished loading columns',
    props<{columns: Column[]}>()
);

export const setCellContents = createAction('[CellContent] Set new content for cells',
    props<{contents: CellContent[]}>()
);

export const testRowsInBackend = createAction('[Rows] Test rows in backend',
    props<{content: RowContainer}>()
);

export const importRowsInBackend = createAction('[Rows] Import rows in backend',
    props<{content: RowContainer}>()
);

export const setRowErrors = createAction('[Rows] Set list of row errors',
    props<{errors: ErrorList[]}>()
);

export const backendTestSuccessful = createAction('[Rows] Test of rows in backend was successful');
