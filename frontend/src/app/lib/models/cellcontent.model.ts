import { Column } from './rest-backend/column.model';

export class CellContent {
    
    constructor(public originalValue: string, public row: number, public column: number) {}
    // private errorDescriptions: string[] = [];
    // if (columnDefinition.typeInfo.allowedTypes.includes('number')) {
    //     if (isNaN(+originalValue)) {
    //         this.errorDescriptions.push('Zahl erwartet');
    //     }
    // }
    // if (columnDefinition.typeInfo.allowedTypes.includes('date')) {
    //     if (isNaN(Date.parse(originalValue))) {
    //         this.errorDescriptions.push('Datum erwartet');
    //     }
    // }
    // containsErrors = () => this.errorDescriptions?.length > 0;
    // getErrors = () => this.errorDescriptions.slice();
}
