import type { Token } from "./lexer.ts";

type NodeType = "STATEMENT" | "EXPRESSION";

function indent(depth: number): string {
    return "  ".repeat(depth);
}

export interface Node {
    tokenLiteral(): string;
    string(depth: number): string;
    nodeType(): NodeType;
}

export abstract class ExpressionNode implements Node {
    tokenLiteral(): string {
        throw new Error("Method not implemented.");
    }
    string(depth: number): string {
        depth; // To supress anoying lsp message
        throw new Error("Method not implemented.");
    }
    nodeType(): NodeType {
        return "EXPRESSION";
    }
}

export abstract class StatementNode implements Node {
    tokenLiteral(): string {
        throw new Error("Method not implemented.");
    }
    string(depth: number): string {
        depth; // To supress anoying lsp message
        throw new Error("Method not implemented.");
    }
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

    public override string(depth: number): string {
        let out = `${indent(depth)}VarDeclaration\n`;
        out += `${indent(depth + 1)}Identifier:\n`;
        out += this.identifier.string(depth + 2);

        if (this.type) {
            out += `${indent(depth + 1)}Type:\n`;
            out += this.type.string(depth + 2);
        }

        if (this.value) {
            out += `${indent(depth + 1)}Value:\n`;
            out += this.value.string(depth + 2);
        }

        return out;
    }

    public override tokenLiteral(): string {
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

    public override string(depth: number): string {
        let out = `${indent(depth)}VariablesStatement\n`;
        for (const decl of this.declarations) {
            out += decl.string(depth + 1);
        }
        return out;
    }

    public override tokenLiteral(): string {
        return this.token.literal;
    }
}

// ======================================
// =            EXPRESSIONS             =
// ======================================

export class PrefixExpression extends ExpressionNode implements Node {
    public right!: ExpressionNode;
    public token!: Token;
    public operator!: string;

    public override string(depth: number): string {
        let out = `${indent(depth)}PrefixExpression (${this.operator})\n`;
        out += this.right.string(depth + 1);
        return out;
    }

    public override tokenLiteral(): string {
        return this.token.literal;
    }
}

export class InfixExpression extends ExpressionNode implements Node {
    public left!: ExpressionNode;
    public right!: ExpressionNode | null;
    public token!: Token;
    public operator!: string;

    public override string(depth: number): string {
        let out = `${indent(depth)}InfixExpression (${this.operator})\n`;
        out += `${indent(depth + 1)}Left:\n`;
        out += this.left.string(depth + 2);

        if (this.right) {
            out += `${indent(depth + 1)}Right:\n`;
            out += this.right.string(depth + 2);
        }

        return out;
    }

    public override tokenLiteral(): string {
        return this.token.literal;
    }
}

export class Identifier extends ExpressionNode implements Node {
    token: Token;
    value: string;

    constructor(token: Token) {
        super();
        this.token = token;
        this.value = token.literal;
    }

    public override string(depth: number): string {
        return `${indent(depth)}Identifier (${this.value})\n`;
    }

    public override tokenLiteral(): string {
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

    public override string(depth: number): string {
        return `${indent(depth)}Number (${this.value})\n`;
    }

    public override tokenLiteral(): string {
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

    public override string(depth: number): string {
        return `${indent(depth)}Type (${this.value})\n`;
    }

    public override tokenLiteral(): string {
        return this.token.literal;
    }
}
