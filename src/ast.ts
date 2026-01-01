import type { Token } from "./lexer.ts";

type NodeType = "STATEMENT" | "EXPRESSION";

export interface Node {
    // returns the token literal of the current token
    tokenLiteral(): string;

    // returns a string representation of the statements in the ast
    toString(depth: number): string;

    nodeType(): NodeType;
}

export abstract class ExpressionNode {
    nodeType(): NodeType {
        return "EXPRESSION";
    }
}

export abstract class StatementNode {
    nodeType(): NodeType {
        return "STATEMENT";
    }
}

// ======================================
// =             STATEMENTS             =
// ======================================

export class VarDeclaration extends StatementNode implements Node {
    identifier: Identifier;
    value!: ExpressionNode | null;
    type!: TypeExpression;
    token: Token;

    constructor(token: Token) {
        super();
        this.identifier = new Identifier(token);
        this.token = token;
    }

    public toString(depth: number): string {
        // TODO: implement
        return "";
    }

    public tokenLiteral(): string {
        return this.token.literal;
    }
}

export class VariablesStatement extends StatementNode implements Node {
    token: Token;
    value: string;
    declarations: Array<StatementNode>;

    constructor(token: Token) {
        super();
        this.token = token;
        this.value = token.literal;
        this.declarations = new Array();
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

export class PrefixExpression extends ExpressionNode {
    public right!: ExpressionNode;
    public token!: Token;
    public operator!: string;
}

export class InfixExpression extends ExpressionNode {
    public left!: ExpressionNode;
    public right!: ExpressionNode | null;
    public token!: Token;
    public operator!: string;
}

export class Identifier extends ExpressionNode implements Node {
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

export class NumberNode extends ExpressionNode implements Node {
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

export class TypeExpression extends ExpressionNode implements Node {
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
