import { Row } from "./row.model";

export interface RowContainer {
    schema: string;
    table: string;
    rows: Row[];
}
