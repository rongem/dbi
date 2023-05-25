import { CellContent } from "./cellcontent.model";
import { Column } from "./rest-backend/column.model";

export class CellInformation{
    private errorDescriptions: string[] = [];
    get value() { return this.cellContent.originalValue }
    get errors() { return this.errorDescriptions.slice(); }
    get containsErrors() { return this.errorDescriptions?.length > 0; }
    constructor(private cellContent: CellContent, private columnDefinition: Column) {
        if (this.columnDefinition.typeInfo.allowedTypes.includes('number')) {
            if (isNaN(+this.cellContent.originalValue)) {
                this.errorDescriptions.push('Number expected');
            }
        }
        if (columnDefinition.typeInfo.allowedTypes.includes('date')) {
            if (isNaN(Date.parse(this.cellContent.originalValue))) {
                this.errorDescriptions.push('Date expected');
            }
        }
        if (columnDefinition.typeInfo.allowedTypes.includes('boolean')) {
            if (isNaN(+this.cellContent.originalValue) && !['true', 'false', 'yes', 'no', 'wahr', 'falsch', 'ja', 'nein'].includes(this.cellContent.originalValue.toLocaleLowerCase())) {
                this.errorDescriptions.push('Boolean expected');
            }
        }
        if (!columnDefinition.isNullable && this.cellContent.originalValue === '') {
            this.errorDescriptions.push('Nulls not allowed');
        }
    };

}