import { Row } from "./row.model";

export interface ImportError {
    row: number;
    msg: string;
    rowContent?: Row
}