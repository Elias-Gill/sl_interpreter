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
    Identifier,
    PrefixExpression,
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

        // Assert that decl.value is an InfixExpression with left and right as NumberNodes
        expectExpressionNode(decl.value!, {
            type: "Infix",
            operator: "+",
            left: { type: "Number", value: "5" },
            right: { type: "Number", value: "5" },
        });
    });

    it("should parse a simple expression with line jumps in between", () => {
        const sourceCode = `var
                            x = 5 + 
                                5`;

        const ast = parseAndGetAst(sourceCode);
        expect(ast.length).toBe(1);

        const stmt = expectVariablesStatement(ast[0]!, 1);
        const decl = stmt.declarations[0] as VarDeclaration;
        expectVarDeclaration(decl, "x");

        expectExpressionNode(decl.value!, {
            type: "Infix",
            operator: "+",
            left: { type: "Number", value: "5" },
            right: { type: "Number", value: "5" },
        });
    });

    it("should parse a complex arithmetic expression with precedence and parentheses", () => {
        const sourceCode = `var 
                               x = 2 + 3 * 4 - 8 / 2 ^ (1 + 1)`;

        const ast = parseAndGetAst(sourceCode);
        expect(ast.length).toBe(1);

        const stmt = expectVariablesStatement(ast[0]!, 1);
        const decl = stmt.declarations[0] as VarDeclaration;
        expectVarDeclaration(decl, "x");

        expectExpressionNode(decl.value!, {
            type: "Infix",
            operator: "-",
            left: {
                type: "Infix",
                operator: "+",
                left: { type: "Number", value: "2" },
                right: {
                    type: "Infix",
                    operator: "*",
                    left: { type: "Number", value: "3" },
                    right: { type: "Number", value: "4" },
                },
            },
            right: {
                type: "Infix",
                operator: "/",
                left: { type: "Number", value: "8" },
                right: {
                    type: "Infix",
                    operator: "^",
                    left: { type: "Number", value: "2" },
                    right: {
                        type: "Infix",
                        operator: "+",
                        left: { type: "Number", value: "1" },
                        right: { type: "Number", value: "1" },
                    },
                },
            },
        });
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

// Generic expression checker, dispatches to specific assert function
export function expectExpressionNode(
    expr: ExpressionNode | null,
    expected: ExpectedExpression,
): void {
    expect(expr).not.toBeNull();
    if (expected.type === "Number") {
        expectNumberNode(expr!, expected.value);
    } else if (expected.type === "Identifier") {
        expectIdentifierNode(expr!, expected.value);
    } else if (expected.type === "Infix") {
        expectInfixExpression(expr!, expected.operator, expected.left, expected.right);
    } else if (expected.type === "Prefix") {
        expectPrefixExpression(expr!, expected.operator, expected.right);
    } else if (expected.type === "Type") {
        expectTypeExpression(expr!, expected.value);
    } else {
        throw new Error("Unknown expected expression type");
    }
}

// -----------------------------------------------
// Specific assertion helpers for node types
// -----------------------------------------------

// Assert VarDeclaration with expected identifier name
export function expectVarDeclaration(decl: VarDeclaration, expectedName: string): void {
    expect(decl).toBeInstanceOf(VarDeclaration);
    expect(decl.identifier.value).toBe(expectedName);
    expect(decl.value).not.toBeNull();
}

function expectNumberNode(expr: ExpressionNode | null, value: string): void {
    expect(expr).not.toBeNull();
    expect(expr).toBeInstanceOf(NumberNode);
    const num = expr as NumberNode;
    expect(num.value).toBe(value);
}

// Assert VariablesStatement with expected number of declarations
export function expectVariablesStatement(
    node: StatementNode,
    expectedCount: number,
): VariablesStatement {
    expect(node).toBeInstanceOf(VariablesStatement);
    const stmt = node as VariablesStatement;
    expect(stmt.declarations.length).toBe(expectedCount);
    return stmt;
}

export function expectIdentifierNode(expr: ExpressionNode, value: string): void {
    expect(expr).toBeInstanceOf(Identifier);
    const id = expr as Identifier;
    expect(id.value).toBe(value);
}

export function expectTypeExpression(expr: ExpressionNode, value: string): void {
    expect(expr).toBeInstanceOf(TypeExpression);
    const typeExpr = expr as TypeExpression;
    expect(typeExpr.value).toBe(value);
}

export function expectPrefixExpression(
    expr: ExpressionNode,
    operator: string,
    rightExpected: ExpectedExpression,
): void {
    expect(expr).toBeInstanceOf(PrefixExpression);
    const prefix = expr as PrefixExpression;
    expect(prefix.operator).toBe(operator);
    expectExpressionNode(prefix.right, rightExpected);
}

export function expectInfixExpression(
    expr: ExpressionNode,
    operator: string,
    leftExpected: ExpectedExpression,
    rightExpected: ExpectedExpression,
): void {
    expect(expr).toBeInstanceOf(InfixExpression);
    const infix = expr as InfixExpression;
    expect(infix.operator).toBe(operator);
    expectExpressionNode(infix.left, leftExpected);
    expectExpressionNode(infix.right!, rightExpected);
}

// Define a type to represent expected expressions for easy composition

export type ExpectedExpression =
    | { type: "Number"; value: string }
    | { type: "Identifier"; value: string }
    | { type: "Type"; value: string }
    | { type: "Prefix"; operator: string; right: ExpectedExpression }
    | { type: "Infix"; operator: string; left: ExpectedExpression; right: ExpectedExpression };
