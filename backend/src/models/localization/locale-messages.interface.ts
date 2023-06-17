export interface LocaleMessages {
    environmentDbNameMissingError: string;
    environmentDbUserMissingError: string;
    environmentDbPasswordMissingError: string;
    environmentDbServerMissingError: string;
    environmentAuthModeError: string;
    environmentDbPortError: string;
    missingAuthenticationError: string;
    illegalAuthenticationError: string;
    unknownUrlError: string;
    illegalColumnsInRequestError: string;
    noRowsInsertedError: string;
    importError: string;
    databaseConnectionError: string;
    connectedToMessage: string;
    missingTableError: (name: string) => string;
    userWithoutWritePrivilegesError: string;
    validationError: string;
    schemaNotPresentError: string;
    schemaIsEmptyError: string;
    schemaNotAStringError: string;
    schemaContainsIllegalCharactersError: string;
    tableNotPresentError: string;
    tableEmptyError: string;
    tableNotAStringError: string;
    tableContainsIllegalCharactersError: string;
    tableNotFoundError: string;
    rowsIsNotAnArrayError: string;
    rowNumberExceedsBoundariesError: string;
    requiredColumnMissingError: (name: string) => string;
    columnIsNotPartOfTheTableError: (name: string) => string;
    typeIsNotAllowedForColumError: (type: string, columnName: string) => string;
}
