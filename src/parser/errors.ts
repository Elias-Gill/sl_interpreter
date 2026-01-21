// ========================================================
// =                PARSING ERRORS                        =
// ========================================================

import type { Token } from "../lexer/lexer.ts";

export enum ErrorType {
    UnexpectedExpression = "UnexpectedExpression",
    ExpectedNewLine = "ExpectedNewLine",
    ExpectedVarDeclaration = "ExpectedVarDeclaration",
    ExpectedEqualSign = "ExpectedEqualSign",
    NoPrefixFound = "NoPrefixFound",
    ExpectedTypeAnnotation = "ExpectedTypeAnnotation",
}

export interface ParsingError {
    type: ErrorType;
    token: Token;
    row: number;
    column: number;
    message: string;
}

export function newParsingError(type: ErrorType, message: string, token: Token): ParsingError {
    return {
        type: type,
        token: token,
        row: token.lineNumber,
        column: token.column,
        message: message,
    };
}
