import { CellContent } from "./cellcontent.model";
import { Column } from "./rest-backend/column.model";
import { ColumnLogicalType } from "./rest-backend/column-constraints.model";

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
    get binaryValue() {
        return this.canContainBinary() ? this.value ?? undefined : undefined;
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
        if (this.stringValue !== undefined) return this.stringValue;
        if (this.binaryValue !== undefined) return this.binaryValue;
        return this.value ?? undefined;
    }

    get name() { return this.columnDefinition.name; }
    get row() { return this.cellContent.row; }
    get column() { return this.cellContent.column; }
    get ordinalPosition() { return this.columnDefinition.ordinalPosition; }

    private errorDescriptions: string[] = [];

/**
 * Creates a typed cell view for a spreadsheet value and validates it against the column definition, including logical types and backend-provided constraints.
 * The constructor normalizes empty values, checks expected data types, and records the user-facing validation messages used in the UI.
 */
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
            this.validateConstraints();
        }
    };

    private canContainBoolean = () => this.checkType('boolean');
    private canContainDate = () => this.checkType('date');
    private canContainNumber = () => this.checkType('number');
    private canContainString = () => this.checkType('string');
    private canContainBinary = () => this.checkType('binary');

    private checkType = (type: ColumnLogicalType) => this.allowedTypes.includes(type);

    private get allowedTypes(): ColumnLogicalType[] {
        const logicalTypes = this.columnDefinition.constraints?.logicalTypes;
        if (logicalTypes && logicalTypes.length > 0) {
            return logicalTypes;
        }
        return this.columnDefinition.typeInfo.allowedTypes;
    }

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

/**
 * Applies backend-defined constraints such as enum membership, string length, binary size, and numeric ranges to the current cell value.
 */
    private validateConstraints() {
        const constraints = this.columnDefinition.constraints;
        if (!constraints) {
            return;
        }

        if (constraints.enumValues && constraints.enumValues.length > 0) {
            const typedValue = this.typedValue;
            if (!constraints.enumValues.includes(typedValue as string | number | boolean)) {
                this.errorDescriptions.push($localize `Value is not part of the allowed enum values`);
            }
        }

        this.validateStringConstraints();
        this.validateBinaryConstraints();
        this.validateNumberConstraints();
    }

/**
 * Checks string-specific limits like minimum and maximum length before a cell is marked as valid.
 */
    private validateStringConstraints() {
        const constraints = this.columnDefinition.constraints?.string;
        if (!constraints || typeof this.value !== 'string') {
            return;
        }

        if (constraints.minLength !== undefined && this.value.length < constraints.minLength) {
            this.errorDescriptions.push($localize `Value is shorter than allowed`);
        }
        if (constraints.maxLength !== undefined && this.value.length > constraints.maxLength) {
            this.errorDescriptions.push($localize `Value is longer than allowed`);
        }
    }

/**
 * Ensures that binary-like string values do not exceed the backend-defined maximum byte length.
 */
    private validateBinaryConstraints() {
        const maxBytes = this.columnDefinition.constraints?.binary?.maxBytes;
        if (maxBytes === undefined || typeof this.value !== 'string') {
            return;
        }

        const bytes = new TextEncoder().encode(this.value).length;
        if (bytes > maxBytes) {
            this.errorDescriptions.push($localize `Value exceeds allowed byte size`);
        }
    }

/**
 * Validates numeric boundaries such as minimum, maximum, and integer-only settings using the normalized locale-aware number value.
 */
    private validateNumberConstraints() {
        const constraints = this.columnDefinition.constraints?.number;
        const value = this.numberValue;
        if (!constraints || value === undefined) {
            return;
        }

        if (constraints.minimum !== undefined && value < constraints.minimum) {
            this.errorDescriptions.push($localize `Value is below the minimum`);
        }
        if (constraints.maximum !== undefined && value > constraints.maximum) {
            this.errorDescriptions.push($localize `Value exceeds the maximum`);
        }
        if (constraints.integer === true && !Number.isInteger(value)) {
            this.errorDescriptions.push($localize `Integer value expected`);
        }
    }

/**
 * Parses a date string using a locale-oriented format template and converts it into a JavaScript Date instance.
 */
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