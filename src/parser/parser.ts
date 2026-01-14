import type { Lexer, Token, TokenType } from "../lexer/lexer.js";
import {
    ExpressionNode,
    Identifier,
    InfixExpression,
    NumberNode,
    StatementNode,
    VarDeclaration,
    VariablesStatement,
} from "./ast.ts";
import { newParsingError, type ParsingError } from "./errors.ts";
import { ErrorType } from "./errors.ts";

type InfixFn = (exp: ExpressionNode) => ExpressionNode;
type PrefixFn = () => ExpressionNode;

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

export class Parser {
    private lexer: Lexer;

    // parsing results
    private ast: Array<StatementNode>;
    private errors: Array<ParsingError>;

    private prefixTable: Map<TokenType, PrefixFn>;
    private infixTable: Map<TokenType, InfixFn>;

    private currentToken: Token;
    private nextToken: Token;

    constructor(lexer: Lexer) {
        this.prefixTable = new Map();
        this.infixTable = new Map();

        this.lexer = lexer;
        this.errors = new Array<ParsingError>();
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

        return this.errors.length != 0;
    }

    public getErrors(): Array<ParsingError> | null {
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
                this.pushErrorAndRecover(
                    newParsingError(
                        ErrorType.UnexpectedExpression,
                        `Unexpected expression: ${this.currentToken!.literal} [${this.currentToken!.type}]`,
                        this.currentToken!,
                    ),
                );
                return null;
        }
    }

    private parseVariablesDeclaration(): StatementNode | null {
        // There has to be a new line character after the "VAR" keyword
        if (!this.nextTokenIs("NEWLINE")) {
            this.pushErrorAndRecover(
                newParsingError(ErrorType.ExpectedNewLine, "Expected New Line", this.currentToken!),
            );
        }

        this.advanceToken(); // skip over "VAR"
        this.consumeNewLines();
        this.advanceToken(); // skip over the last new line char

        var stmt = new VariablesStatement(this.currentToken!);

        var variables = new Array<StatementNode>();
        while (this.currentTokenIs("IDENTIFIER")) {
            var declaration = this.parseVariableStatement();
            if (declaration == null) {
                this.pushErrorAndRecover(
                    newParsingError(
                        ErrorType.ExpectedVarDeclaration,
                        "Expected variable declaration",
                        this.currentToken!,
                    ),
                );
                return null;
            }
            variables.push(declaration);

            this.consumeNewLines();

            if (this.nextTokenIs("IDENTIFIER")) {
                this.advanceToken();
            }
        }

        stmt.declarations = variables;

        return stmt;
    }

    private parseVariableStatement(): StatementNode | null {
        var stmt = new VarDeclaration(this.currentToken!);

        // skip over identifier
        this.advanceToken();

        // check equals sign and skip over
        if (!this.currentTokenIs("ASSIGN")) {
            this.pushErrorAndRecover(
                newParsingError(
                    ErrorType.ExpectedEqualSign,
                    `Expected '=' after identifier, got ${this.currentToken!.literal}`,
                    this.currentToken!,
                ),
            );
            return null;
        }
        this.advanceToken();

        // TODO: parse Type specification (no recuerdo si es que realmente hacia falta)

        // FIX: constant SHOULD have an expression on its definition unlike vars that can be
        // not constant.
        stmt.value = this.parseExpression(Precedence.MIN);

        return stmt;
    }

    private parseExpression(curPrecedence: Precedence): ExpressionNode | null {
        // FIX: expresiones deben de poder soportar saltos de linea, ejemplo:
        // (x = 5 + \n 5). Pero algo como (x = 5 \n + 5) ya no es valido, ojo
        var prefix = this.prefixTable.get(this.currentToken!.type);
        if (prefix == undefined) {
            this.pushErrorAndRecover(
                newParsingError(
                    ErrorType.NoPrefixFound,
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

    // ======================================
    // =                Utils               =
    // ======================================

    private pushErrorAndRecover(error: ParsingError) {
        this.errors.push(error);
        this.skipUntilNextStatement();
    }

    // Error handling recovery strategy: skip expressions parsing until we found the next statement.
    // This method lefts the next statement as the "next" token, so it can be in a valid state
    // when the parseProgram tries to continue.
    private skipUntilNextStatement() {
        while (this.currentToken != null && !this.isStatement(this.nextToken.type)) {
            this.advanceToken();
        }
    }

    private advanceToken() {
        this.currentToken = this.nextToken;
        this.nextToken = this.lexer.nextToken();
    }

    private currentTokenIs(type: TokenType): boolean {
        return this.currentToken?.type == type;
    }

    private nextTokenIs(type: TokenType): boolean {
        return this.nextToken?.type == type;
    }

    // Consume consecutive new line tokens until the NEXT token is not a NEWLINE.
    //
    // In practice, this means that the function always leaves the current token
    // as a NEWLINE (the last one in the sequence) if there was at least one.
    //
    // It is up to the calling function to decide whether to skip over that
    // remaining NEWLINE token or not.
    private consumeNewLines() {
        while (this.nextTokenIs("NEWLINE")) {
            this.advanceToken();
        }
    }

    private isStatement(token: TokenType) {
        switch (token) {
            case "EOF":
            case "VARIABLES":
            case "VAR":
            case "CONSTANTES":
            case "CONST":
            case "RETORNA":
            case "SUBRUTINA":
            case "TIPOS":
            case "TIPO":
            case "INICIO":
                return true;
            default:
                return false;
        }
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
