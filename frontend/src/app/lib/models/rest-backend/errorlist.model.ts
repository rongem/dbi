import { Row } from "./row.model";

export interface ErrorList {
    row: number;
    errorMessage: string;
    rowContent?: Row
}