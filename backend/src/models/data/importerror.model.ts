import { Row } from "./row.model.js";

export interface ImportError {
    row: number;
    msg: string;
    rowContent?: Row
}