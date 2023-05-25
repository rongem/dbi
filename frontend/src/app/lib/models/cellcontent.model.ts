import { Column } from './rest-backend/column.model';

export class CellContent {
    constructor(public originalValue: string, public row: number, public column: number) {}
}
