import { describe, it, expect } from "vitest";
import type { TokenType, Token } from "./../lexer";
import { Lexer } from "./../lexer";

function tokenToString(tok: Token): string {
    return `{ type: ${tok.type}, literal: "${tok.literal}" }`;
}

describe("Lexer basic tests", () => {
    it("should tokenize symbols", () => {
        const input = `; " ' / * { } [ ] ( ) : = > < + - ^ \n`;
        const expectedTypes: TokenType[] = [
            "SEMICOLON",
            "DQUOTE",
            "SQUOTE",
            "SLASH",
            "ASTERISK",
            "LBRACE",
            "RBRACE",
            "LBRACKET",
            "RBRACKET",
            "LPAREN",
            "RPAREN",
            "COLON",
            "ASSIGN",
            "GT",
            "LT",
            "PLUS",
            "MINUS",
            "POW",
            "NEWLINE",
            "EOF",
        ];

        const lexer = new Lexer(input);
        for (const expectedType of expectedTypes) {
            const tok = lexer.nextToken();
            expect(tok.type).toBe(expectedType);
        }
    });

    it("should tokenize identifiers and keywords", () => {
        const input = `var variables const constantes tipos tipo subrutina retorna ref inicio fin programa si sino mientras repetir paso eval caso logico numerico cadena registro vector matriz and or not`;
        const expectedTypes: TokenType[] = [
            "VAR",
            "VARIABLES",
            "CONST",
            "CONSTANTES",
            "TIPOS",
            "TIPO",
            "SUBRUTINA",
            "RETORNA",
            "REF",
            "INICIO",
            "FIN",
            "PROGRAMA",
            "SI",
            "SINO",
            "MIENTRAS",
            "REPETIR",
            "PASO",
            "EVAL",
            "CASO",
            "LOGICO",
            "NUMERICO",
            "CADENA",
            "REGISTRO",
            "VECTOR",
            "MATRIZ",
            "AND",
            "OR",
            "NOT",
            "EOF",
        ];

        const lexer = new Lexer(input);
        for (const expectedType of expectedTypes) {
            const tok = lexer.nextToken();
            expect(tok.type).toBe(expectedType);
        }
    });

    it("should throw error on disallowed keywords", () => {
        const input = `lib libext archivo`;
        const lexer = new Lexer(input);

        expect(() => lexer.nextToken()).toThrow(/reserved but not allowed/);
    });

    it("should tokenize numbers", () => {
        const input = `123 4567 0 89`;
        const lexer = new Lexer(input);

        for (let i = 0; i < 4; i++) {
            const tok = lexer.nextToken();
            expect(tok.type).toBe("NUMBER");
            expect(tok.literal).toMatch(/^\d+$/);
        }
    });

    it("should tokenize identifiers", () => {
        const input = `myVar _foo bar123`;
        const lexer = new Lexer(input);

        for (let i = 0; i < 3; i++) {
            const tok = lexer.nextToken();
            expect(tok.type).toBe("IDENTIFIER");
            expect(tok.literal).toMatch(/^[a-zA-Z_][a-zA-Z0-9_]*$/);
        }
    });

    it("should tokenize illegal characters", () => {
        const input = `@ $ €`;
        const lexer = new Lexer(input);

        for (let i = 0; i < 3; i++) {
            const tok = lexer.nextToken();
            expect(tok.type).toBe("ILLEGAL");
        }
    });

    it("should support lookAhead without advancing", () => {
        const input = `var x = 5;`;
        const lexer = new Lexer(input);

        const firstLook = lexer.lookAhead();
        expect(firstLook.type).toBe("VAR");

        const firstNext = lexer.nextToken();
        expect(firstNext).toEqual(firstLook);

        const secondLook = lexer.lookAhead();
        expect(secondLook.type).toBe("IDENTIFIER");

        const secondNext = lexer.nextToken();
        expect(secondNext).toEqual(secondLook);
    });

    it("should handle empty input and EOF", () => {
        const lexer = new Lexer("");
        const tok = lexer.nextToken();
        expect(tok.type).toBe("EOF");
    });

    it("should skip whitespaces", () => {
        const input = "   \t  \r    var   \t\r";
        const lexer = new Lexer(input);
        const tok = lexer.nextToken();
        expect(tok.type).toBe("VAR");
    });
});
