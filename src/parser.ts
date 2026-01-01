import type { Lexer, Token, TokenType } from "./lexer.js";
import {
    ExpressionNode,
    Identifier,
    InfixExpression,
    NumberNode,
    StatementNode,
    VarDeclaration,
    VariablesStatement,
} from "./ast.ts";

type InfixFn = (exp: ExpressionNode) => ExpressionNode;
type PrefixFn = () => ExpressionNode;

class Error {
    public message: string;
    public token: Token;

    constructor(err: string, token: Token) {
        this.message = err;
        this.token = token;
    }
}

// WARNING: the order matters here (a lot) !!
// prettier-ignore
enum Precedence {
    MIN = 0,        // LOWEST
    EQUALS,         // ==, !=
    GREATLESS,      // <, >
    ADITION,        // +, -
    DIVISION,       // *, /
    PREFIX,         // -X, !X
    PARENTESIS,     // foo(bar), (expresión)
    MAX,
}
// prettier-ignore-end

class Parser {
    private lexer: Lexer;

    // parsing results
    private ast: Array<StatementNode>;
    private errors: Array<Error>;

    private prefixTable: Map<TokenType, PrefixFn>;
    private infixTable: Map<TokenType, InfixFn>;

    private currentToken: Token;
    private nextToken: Token;

    constructor(lexer: Lexer) {
        this.prefixTable = new Map();
        this.infixTable = new Map();

        this.lexer = lexer;
        this.errors = new Array<Error>();
        this.ast = new Array<StatementNode>();

        // Prepare parser state by loading the first two tokens
        this.currentToken = lexer.nextToken();
        this.nextToken = lexer.nextToken();

        // Register prefix functions
        this.registerPrefix("IDENTIFIER", this.parseIdentifier.bind(this));
        this.registerPrefix("NUMBER", this.parseNumber.bind(this));

        // Register infix funcions
        this.registerInfix("PLUS", this.parseInfixExpression.bind(this));
        this.registerInfix("MINUS", this.parseInfixExpression.bind(this));
        this.registerInfix("SLASH", this.parseInfixExpression.bind(this));
        this.registerInfix("ASTERISK", this.parseInfixExpression.bind(this));
        this.registerInfix("POW", this.parseInfixExpression.bind(this));
    }

    // ======================================
    // =            Public API              =
    // ======================================

    // Returns whether the parsing process had errors or not. The state of the
    // parser (ast, errors, etc) are accessed through dedicated methods.
    public parseProgram(): boolean {
        while (!this.nextTokenIs("EOF") && this.currentToken != null) {
            var stmt = this.parseStatement();
            if (stmt != null) {
                this.ast.push(stmt);
            }
            this.advanceToken();
        }
        return false;
    }

    public getErrors(): Array<Error> | null {
        return this.errors;
    }

    public getAst(): Array<StatementNode> | null {
        return this.ast;
    }

    // ======================================
    // =          Private method            =
    // ======================================

    private parseStatement(): StatementNode | null {
        switch (this.currentToken!.type) {
            // We simply ignore newlines
            case "NEWLINE":
                return null;
            case "VARIABLES":
            case "VAR":
                return this.parseVariablesDeclaration();
            case "CONSTANTES":
            case "CONST":
                // TODO:
                return null;
            case "RETORNA":
                // TODO:
                return null;
            case "SUBRUTINA":
                // TODO:
                return null;
            case "TIPOS":
            case "TIPO":
                // TODO:
                return null;
            case "INICIO":
                // TODO:
                return null;

            // SL does NOT support standalone expressions; everything must be part
            // of a subprogram, some declaration like var, or the main function.
            default:
                this.errors.push(
                    new Error(
                        `Unexpected expression: ${this.currentToken!.literal} [${this.currentToken!.type}]`,
                        this.currentToken!,
                    ),
                );
                // As an error recovery strategy we skip over expression until we found the
                // next statement
                while (!this.isStatement(this.currentToken!.type)) {
                    this.advanceToken();
                }
                return null;
        }
    }

    private parseVariablesDeclaration(): StatementNode | null {
        // Skip over "var" keyword
        this.advanceToken();

        // HAS to be a new line character
        if (!this.currentTokenIs("NEWLINE")) {
            this.errors.push(new Error("Expected New Line", this.currentToken!));
        }

        // Skip over consecutive newlines
        while (this.currentTokenIs("NEWLINE")) {
            this.advanceToken();
        }

        var stmt = new VariablesStatement(this.currentToken!);

        var variables = new Array<StatementNode>();
        while (this.currentTokenIs("IDENTIFIER")) {
            var declaration = this.parseVariableStatement();
            if (declaration == null) {
                this.errors.push(new Error("Expected variable declaration", this.currentToken!));
                return null;
            }
            variables.push(declaration);
        }

        stmt.declarations = variables;

        return stmt;
    }

    private parseVariableStatement(): StatementNode | null {
        if (this.currentToken == null) {
            this.errors.push(
                new Error(
                    "Unexpected end of input while parsing variable declaration",
                    this.nextToken!,
                ),
            );
            return null;
        }

        var stmt = new VarDeclaration(this.currentToken!);

        // check equals sign and skip over
        this.advanceToken();
        if (!this.currentTokenIs("ASSIGN")) {
            this.errors.push(
                new Error(
                    `Expected '=' after identifier, got ${this.currentToken!.literal}`,
                    this.currentToken!,
                ),
            );
            this.skipUntilStatement();
            return null;
        }
        this.advanceToken();

        // TODO: parse Type specification

        stmt.value = this.parseExpression(Precedence.MIN);

        return stmt;
    }

    private parseExpression(curPrecedence: Precedence): ExpressionNode | null {
        var prefix = this.prefixTable.get(this.currentToken!.type);
        if (prefix == undefined) {
            this.errors.push(
                new Error(
                    `No prefix parser for token ${this.currentToken!.type}`,
                    this.currentToken!,
                ),
            );
            return null;
        }

        var exp = prefix();

        while (!this.nextTokenIs("SEMICOLON") && curPrecedence < getPrecedence(this.nextToken!)) {
            var infix = this.infixTable.get(this.nextToken!.type);
            if (infix == undefined) {
                console.log("No infix for: " + this.nextToken.type);
                return exp;
            }

            this.advanceToken();

            exp = infix(exp);
        }

        return exp;
    }

    private parseIdentifier(): ExpressionNode {
        return new Identifier(this.currentToken!);
    }

    private parseNumber(): ExpressionNode {
        return new NumberNode(this.currentToken!);
    }

    private parseInfixExpression(left: ExpressionNode): InfixExpression {
        this.printParserState();

        var token = this.currentToken!;
        var exp = new InfixExpression();

        var precedence = getPrecedence(token);

        exp.token = token!;
        exp.operator = token!.literal;
        exp.left = left;

        this.advanceToken();

        exp.right = this.parseExpression(precedence);

        return exp;
    }

    // Error handling recovery strategy: skip expressions parsing until we found the next statement
    private skipUntilStatement() {
        while (this.currentToken != null && !this.isStatement(this.currentToken.type)) {
            this.advanceToken();
        }
    }

    // ======================================
    // =                Utils               =
    // ======================================

    private currentTokenIs(type: TokenType): boolean {
        return this.currentToken?.type == type;
    }

    private nextTokenIs(type: TokenType): boolean {
        return this.nextToken?.type == type;
    }

    private isStatement(token: TokenType) {
        switch (token) {
            case "EOF":
                return true;
            case "VARIABLES":
            case "VAR":
                return true;
            case "CONSTANTES":
            case "CONST":
                return true;
            case "RETORNA":
                return true;
            case "SUBRUTINA":
                return true;
            case "TIPOS":
            case "TIPO":
                return true;
            case "INICIO":
                return true;
            default:
                return false;
        }
    }

    private advanceToken() {
        this.currentToken = this.nextToken;
        this.nextToken = this.lexer.nextToken();
    }

    private registerInfix(token: TokenType, fn: InfixFn) {
        this.infixTable.set(token, fn);
    }

    private registerPrefix(token: TokenType, fn: PrefixFn) {
        this.prefixTable.set(token, fn);
    }

    // ======================================
    // =              DEBUG                 =
    // ======================================

    private printParserState(): void {
        console.log("===== PARSER STATE =====");

        console.log("Current token:");
        if (this.currentToken) {
            console.log(`  type: ${this.currentToken.type}`);
            console.log(`  string: "${this.currentToken.string()}"`);
        } else {
            console.log("  <null>");
        }

        console.log("Next token:");
        if (this.nextToken) {
            console.log(`  type: ${this.nextToken.type}`);
            console.log(`  string: "${this.nextToken.string()}"`);
        } else {
            console.log("  <null>");
        }

        console.log("AST state:");
        console.log(`  statements count: ${this.ast.length}`);
        this.ast.forEach((stmt, idx) => {
            console.log(`  [${idx}] ${stmt.constructor.name} (nodeType=${stmt.nodeType()})`);
        });

        console.log("Parser errors:");
        if (this.errors.length === 0) {
            console.log("  <none>");
        } else {
            this.errors.forEach((err, idx) => {
                console.log(`  [${idx}] ${err.message}`);
            });
        }

        console.log("========================");
    }

    private printRegisteredParserFuncs() {
        console.log("===== REGISTERED FUNCS =====");
        console.log("Prefix funcs:");
        for (const key of this.prefixTable.keys()) {
            console.log(`  ${key}`);
        }

        console.log("Infix funcs:");
        for (const key of this.infixTable.keys()) {
            console.log(`  ${key}`);
        }
        console.log("========================");
    }
}

function getPrecedence(token: Token): number {
    switch (token.type) {
        // GREATLESS: <, >
        case "LT":
        case "GT":
            return Precedence.GREATLESS;
        // SUM: +, -
        case "PLUS":
        case "MINUS":
            return Precedence.ADITION;
        // PROD: *, /
        case "ASTERISK":
        case "SLASH":
            return Precedence.DIVISION;
        // CALL: function(), LPAREN
        case "LPAREN":
            return Precedence.PARENTESIS;
        // PREFIX operators
        case "NOT":
            return Precedence.PREFIX;
        default:
            return Precedence.MIN;
    }
}

export { Parser };
