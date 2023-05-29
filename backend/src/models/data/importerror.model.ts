import { Row } from "./row.model";

export interface ImportError {
    line: number;
    msg: string;
    rowContent?: Row
}