import { CellContent } from "./cellcontent.model";
import { Column } from "./rest-backend/column.model";

export class CellInformation{
    get value() { return this.cellContent.originalValue }
    get errors() { return this.errorDescriptions.slice(); }
    get errorText() { return this.errorDescriptions.join('; '); }
    get containsErrors() { return this.errorDescriptions?.length > 0; }
    get booleanValue() {
        if (!this.canContainBoolean() || this.isEmpty) return undefined;
        switch (this.value.toLocaleLowerCase()) {
            case 'true':
            case 'yes':
            case 'ja':
            case 'wahr':
                return true;
            case 'false':
            case 'no':
            case 'nein':
            case 'falsch':
                return false;
            default:
                if (!isNaN(+this.value)) return !!+this.value;
                return undefined;
        }
    }
    get numberValue() {
        if (!this.canContainNumber() || this.isEmpty) return undefined;
        return isNaN(+this.value) ? undefined : +this.value;
    }
    get dateValue() {
        if(!this.canContainDate() || this.isEmpty) return undefined;
        const val = Date.parse(this.value);
        if (!val || isNaN(val)) return undefined;
        return new Date(val);
    }
    get stringValue() {
        return this.canContainString() ? this.value ?? undefined : undefined;
    }
    get isBoolean() { return this.booleanValue !== undefined; }
    get isDate() { return this.dateValue !== undefined; }
    get isNumber() { return this.numberValue !== undefined; }
    get isString() { return this.stringValue !== undefined; }
    get isEmpty() { return this.value === '' || this.value === undefined || this.value === null; }

    get typedValue() {
        if (this.isDate) return this.dateValue;
        if (this.isBoolean) return this.booleanValue;
        if (this.isNumber) return this.numberValue;
        return this.stringValue;
    }

    get name() { return this.columnDefinition.name; }
    get row() { return this.cellContent.row; }
    get column() { return this.cellContent.column; }
    get ordinalPosition() { return this.columnDefinition.ordinalPosition; }

    private errorDescriptions: string[] = [];

    constructor(private cellContent: CellContent, private columnDefinition: Column) {
        if (!cellContent) throw new Error('Missing cell content');
        if (!columnDefinition) throw new Error('Missing column definition for ' + JSON.stringify(cellContent));
        if (this.canContainNumber() && !this.isNumber) {
            this.errorDescriptions.push('Number expected');
        }
        if (this.canContainDate() && !this.isDate) {
            this.errorDescriptions.push('Date expected');
        }
        if (this.canContainBoolean() && !this.isBoolean) {
            this.errorDescriptions.push('Boolean expected');
        }
        if (!this.columnDefinition.isNullable && this.isEmpty) {
            this.errorDescriptions.push('Nulls not allowed');
        }
    };

    private canContainBoolean = () => this.checkType('boolean');
    private canContainDate = () => this.checkType('date');
    private canContainNumber = () => this.checkType('number');
    private canContainString = () => this.checkType('string');

    private checkType = (type: 'boolean' | 'date' | 'number' | 'string') => this.columnDefinition.typeInfo.allowedTypes.includes(type);
}