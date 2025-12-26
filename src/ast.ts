import type { Token } from "./lexer.ts";

type NodeType = "STATEMENT" | "EXPRESSION";

export interface Node {
    // returns the token literal of the current token
    tokenLiteral(): string;

    // returns a string representation of the statements in the ast
    toString(depth: number): string;

    nodeType(): NodeType;
}

export abstract class Expression {
    nodeType(): NodeType {
        return "EXPRESSION";
    }
}

export abstract class Statement {
    nodeType(): NodeType {
        return "STATEMENT";
    }
}

// ======================================
// =             STATEMENTS             =
// ======================================

export class VarDeclaration extends Statement implements Node {
    token: Token;
    value: string;

    constructor(token: Token) {
        super();
        this.token = token;
        this.value = token.literal;
    }

    public toString(depth: number): string {
        // TODO: implement
        return "";
    }

    public tokenLiteral(): string {
        return this.token.literal;
    }
}

// ======================================
// =            EXPRESSIONS             =
// ======================================

class PrefixExpression extends Expression {
    public right!: Expression;
    public token!: Token;
    public operator!: string;
}

class InfixExpression extends Expression {
    public left!: Expression;
    public right!: Expression;
    public token!: Token;
    public operator!: string;
}

export class Identifier extends Expression implements Node {
    token: Token;
    value: string;

    constructor(token: Token) {
        super();
        this.token = token;
        this.value = token.literal;
    }

    public toString(depth: number): string {
        // TODO: implement
        return "";
    }

    public tokenLiteral(): string {
        return this.token.literal;
    }
}
