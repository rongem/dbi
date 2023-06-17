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
        const value = this.getLocaleSpecificNumbervalue();
        return isNaN(+value) ? undefined : +value;
    }
    get dateValue() {
        if(!this.canContainDate() || this.isEmpty) return undefined;
        let value: number | undefined = Date.parse(this.value);
        // German date format
        if (this.hasBrowserGermanLanguageSet && this.value.includes('.')) {
            value = this.parseDate(this.value, 'dd.mm.yyyy');
            if (!!value && this.value.match(/ \d{1,2}:\d{2}(:\d{2})?/g)){
                value += Date.parse(this.value.split(' ')[1]) ?? 0;
                console.log(value);
            }
        }
        
        if (!value || isNaN(value)) return undefined;
        return new Date(value);
    }
    get stringValue() {
        return this.canContainString() ? this.value ?? undefined : undefined;
    }
    get isBoolean() { return this.booleanValue !== undefined; }
    get isDate() { return this.dateValue !== undefined; }
    get isNumber() { return this.numberValue !== undefined; }
    get isString() { return this.stringValue !== undefined; }
    get isEmpty() { return this.value === '' || this.value === undefined || this.value === null; }
    get canBeEmpty() { return this.columnDefinition.isNullable || this.columnDefinition.hasDefaultValue; }

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
        if (!cellContent) throw new Error($localize `Missing cell content`);
        if (!columnDefinition) throw new Error($localize `Missing column definition for ` + JSON.stringify(cellContent));
        if (this.isEmpty) {
            if (!this.canBeEmpty) {
                this.errorDescriptions.push($localize `Nulls and empty values are not allowed.`);
            }
        } else {
            if (this.canContainNumber() && !this.isNumber) {
                this.errorDescriptions.push($localize `Number expected`);
            }
            if (this.canContainDate() && !this.isDate) {
                this.errorDescriptions.push($localize `Date expected`);
            }
            if (this.canContainBoolean() && !this.isBoolean) {
                this.errorDescriptions.push($localize `Boolean expected`);
            }
            if (this.canContainString() && !this.stringValue) {
                this.errorDescriptions.push($localize `String expected`);
            }
        }
    };

    private canContainBoolean = () => this.checkType('boolean');
    private canContainDate = () => this.checkType('date');
    private canContainNumber = () => this.checkType('number');
    private canContainString = () => this.checkType('string');

    private checkType = (type: 'boolean' | 'date' | 'number' | 'string') => this.columnDefinition.typeInfo.allowedTypes.includes(type);

    private readonly hasBrowserGermanLanguageSet = /^de\b/.test(navigator.language);

    private getLocaleSpecificNumbervalue() {
        let value = this.value;
        // German number format
        if (this.hasBrowserGermanLanguageSet) {
            value = this.value.replace('.', '').replace(',', '.');
        }
        value = this.removeCurrencySigns(value);
        return value;
    }

    private removeCurrencySigns(value: string) {
        const currencySigns = ['€', '$', '¥', '元', '₱'];
        value = value.trim();
        for (let currency of currencySigns) {
            if (value.startsWith(currency)) {
                value = value.substring(1).trim();
            }
            if (value.endsWith(currency)) {
                value = value.substring(0, value.length - 1).trim();
            }
        }
        return value;
    }

    private parseDate(input: string, format: string = 'yyyy-mm-dd') {
        const parts = input.match(/(\d+)/g);
        if (!parts || parts.length < 3) {
            return undefined;
        }
        let i = 0;
        let fmt: {[key: string]: number} = {};
        const formatParts = format.match(/(yyyy|dd|mm)/g);
        if (!formatParts || formatParts.length !== 3) {
            return undefined;
        }
        // extract date-part indexes from the format
        for (let part of formatParts) {
            fmt[part] = i++;
        }
        return new Date(+parts[fmt['yyyy']], +parts[fmt['mm']]-1, +parts[fmt['dd']]).valueOf();
      }
}