import { Row } from "./row.model";

export interface ErrorList {
    line: number;
    errorMessage: string;
    rowContent?: Row
}