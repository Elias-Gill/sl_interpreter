import { describe, it, expect } from "vitest";
import { Lexer } from "../lexer/lexer.ts";
import { Parser } from "./parser.ts";
import {
    VarDeclaration,
    NumberNode,
    VariablesStatement,
    InfixExpression,
    StatementNode,
    ExpressionNode,
    astToString,
    TypeExpression,
} from "./ast.ts";
import { type ParsingError, ErrorType } from "./errors.ts";

describe("Simple variable declarations", () => {
    it("parses a simple variable definition", () => {
        const sourceCode = `
                    var
                        x = 5
                    `;
        const ast = parseAndGetAst(sourceCode);
        expect(ast.length).toBe(1);
        const stmt = expectVariablesStatement(ast[0]!, 1);
        const decl = stmt.declarations[0] as VarDeclaration;
        expectVarDeclaration(decl, "x");
        expectNumberNode(decl.value!, "5");
    });

    it("parses a variable definition with a simple type annotation", () => {
        const sourceCode = `
                    var
                        x: numerico = 5
                    `;
        const ast = parseAndGetAst(sourceCode);
        expect(ast.length).toBe(1);
        const stmt = expectVariablesStatement(ast[0]!, 1);
        const decl = stmt.declarations[0] as VarDeclaration;
        expectVarDeclaration(decl, "x");
        expectNumberNode(decl.value!, "5");

        expect(decl.type).not.toBeNull();
        expect(decl.type).toBeInstanceOf(TypeExpression);
        expect(decl.type!.tokenLiteral()).toBe("numerico");
    });

    it("parses multiple variables in one var block", () => {
        const sourceCode = `
                    var
                        var1 = 1
                        var2 = 2
                    `;
        const ast = parseAndGetAst(sourceCode);

        expect(ast.length).toBe(1);
        const stmt = expectVariablesStatement(ast[0]!, 2);

        const decl1 = stmt.declarations[0] as VarDeclaration;
        expectVarDeclaration(decl1, "var1");
        expectNumberNode(decl1.value!, "1");

        const decl2 = stmt.declarations[1] as VarDeclaration;
        expectVarDeclaration(decl2, "var2");
        expectNumberNode(decl2.value!, "2");
    });

    it("parses two separate var blocks", () => {
        const sourceCode = `
                        var 
                            var1 = 1
                        var 
                            var2 = 2`;

        const ast = parseAndGetAst(sourceCode);
        expect(ast.length).toBe(2);

        const stmt1 = expectVariablesStatement(ast[0]!, 1);
        const decl1 = stmt1.declarations[0] as VarDeclaration;
        expectVarDeclaration(decl1, "var1");
        expectNumberNode(decl1.value!, "1");

        const stmt2 = expectVariablesStatement(ast[1]!, 1);
        const decl2 = stmt2.declarations[0] as VarDeclaration;
        expectVarDeclaration(decl2, "var2");
        expectNumberNode(decl2.value!, "2");
    });

    // -------------- Parsing errors -----------------

    it("should error (NEWLINE expected) on line 1", () => {
        const sourceCode = `var var1 = 1`;
        const errors = parseAndGetAstWithErrors(sourceCode);
        expect(errors.length).toBe(1);
        expect(errors[0]?.type).toBe(ErrorType.ExpectedNewLine);
        expect(errors[0]?.token.lineNumber).toBe(1);
    });

    it("should error (ExpectedTypeAnnotation) after colon (':')", () => {
        const sourceCode = `
                        var
                            x: 123 = 5
                        `;
        const errors = parseAndGetAstWithErrors(sourceCode);
        expect(errors.length).toBe(1);
        expect(errors[0]!.row).toBe(3);
        expect(errors[0]!.type).toBe(ErrorType.ExpectedTypeAnnotation);
    });
});

describe("Simple mathematical operations", () => {
    it("should parse a variable definition with an addition expression", () => {
        const sourceCode = `var
                                x = 5 + 5`;

        const ast = parseAndGetAst(sourceCode);
        expect(ast.length).toBe(1);

        const stmt = expectVariablesStatement(ast[0]!, 1);

        const decl = stmt.declarations[0] as VarDeclaration;
        expectVarDeclaration(decl, "x");
        expectInfixExpression(decl.value!, "+", "5", "5");
    });

    it("it should parse a simple expression with line jumps in between", () => {
        const sourceCode = `var
                            x = 5 + 
                                    5`;

        const ast = parseAndGetAst(sourceCode);
        expect(ast.length).toBe(1);

        const stmt = expectVariablesStatement(ast[0]!, 1);

        const decl = stmt.declarations[0] as VarDeclaration;
        expectVarDeclaration(decl, "x");
        expectInfixExpression(decl.value!, "+", "5", "5");
    });
});

// ========================================================
// =                   UTILITIES                          =
// ========================================================

function parseAndGetAst(sourceCode: string): StatementNode[] {
    const lexer = new Lexer(sourceCode);
    const parser = new Parser(lexer);

    const hasErrors = parser.parseProgram();

    // Appears only if the test fails
    console.error(parser.getErrors());
    expect(hasErrors).toBe(false);

    const ast = parser.getAst();
    expect(ast).not.toBeNull();

    // Appears only if the test fails
    console.error(astToString(ast));

    return ast!;
}

function parseAndGetAstWithErrors(sourceCode: string): ParsingError[] {
    const lexer = new Lexer(sourceCode);
    const parser = new Parser(lexer);

    const hasErrors = parser.parseProgram();
    const ast = parser.getAst();
    const errors = parser.getErrors();

    // Appears only if the test fails
    console.error(astToString(ast));
    console.error(errors);

    expect(hasErrors).toBe(true);
    expect(errors).not.toBeNull();

    return errors!;
}

function expectVariablesStatement(
    node: StatementNode,
    declarationsCount: number,
): VariablesStatement {
    expect(node).toBeInstanceOf(VariablesStatement);
    const stmt = node as VariablesStatement;
    expect(stmt.declarations.length).toBe(declarationsCount);
    return stmt;
}

function expectVarDeclaration(decl: VarDeclaration, identifier: string): void {
    expect(decl.identifier.value).toBe(identifier);
    expect(decl.value).not.toBeNull();
}

function expectNumberNode(expr: ExpressionNode | null, value: string): void {
    expect(expr).not.toBeNull();
    expect(expr).toBeInstanceOf(NumberNode);
    const num = expr as NumberNode;
    expect(num.value).toBe(value);
}

function expectInfixExpression(
    expr: ExpressionNode,
    operator: string,
    leftValue: string,
    rightValue: string,
): void {
    expect(expr).toBeInstanceOf(InfixExpression);
    const infix = expr as InfixExpression;
    expect(infix.operator).toBe(operator);
    expectNumberNode(infix.left, leftValue);
    expectNumberNode(infix.right, rightValue);
}
