import { Row } from "./row.model";

export interface ErrorList {
    row: number;
    msg: string;
    rowContent?: Row
}