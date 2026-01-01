import { describe, it, expect } from "vitest";
import { Lexer } from "./../lexer.ts";
import { Parser } from "./../parser.ts";
import { VarDeclaration, NumberNode, VariablesStatement } from "./../ast.ts";

describe("Parser simple tests", () => {
    it("parses a simple variable definition", () => {
        const sourceCode = `
var
  x = 5
`;

        const lexer = new Lexer(sourceCode);
        const parser = new Parser(lexer);

        const hasErrors = parser.parseProgram();
        expect(hasErrors).toBe(false);

        const ast = parser.getAst();

        expect(ast).not.toBeNull();
        expect(ast!.length).toBe(1);

        const varDecl = ast![0];
        expect(varDecl).not.toBeUndefined();
        expect(varDecl).not.toBeNull();
        expect(varDecl).toBeInstanceOf(VariablesStatement);

        var aux1 = varDecl as VariablesStatement;
        expect(aux1.declarations.length).toBe(1);

        var aux2 = aux1.declarations[0] as VarDeclaration;

        expect(aux2.identifier.value).toBe("x");
        expect(aux2.value).not.toBeNull();

        var aux3 = aux2.value as NumberNode;
        expect(aux3.value).toBe("5");
    });
});
