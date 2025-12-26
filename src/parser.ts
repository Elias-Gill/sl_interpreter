import type { Lexer, Token, TokenType } from "./lexer.js";
import { Expression, Identifier, Statement } from "./ast.ts";

type InfixFn = (exp: Expression) => Expression;
type PrefixFn = () => Expression;

class Error {
    public error: string;
    public token: Token;

    constructor(err: string, token: Token) {
        this.error = err;
        this.token = token;
    }
}

class Parser {
    private lexer: Lexer;

    // parsing results
    private ast: Array<Statement>;
    private errors: Array<Error>;

    private prefixTable: Map<TokenType, PrefixFn>;
    private infixTable: Map<TokenType, InfixFn>;

    private currentToken!: Token | null;
    private nextToken!: Token | null;

    constructor(lexer: Lexer) {
        this.prefixTable = new Map();
        this.infixTable = new Map();

        this.lexer = lexer;
        this.errors = new Array<Error>();
        this.ast = new Array<Statement>();

        // Prepare parser state by loading the first two tokens
        this.advanceToken();
        this.advanceToken();

        // Register prefix and infix functions
        this.registerPrefix("IDENTIFIER", this.parseIdentifier);
    }

    // ======================================
    // =            Public API              =
    // ======================================

    // Returns whether the parsing process had errors or not. The state of the
    // parser (ast, errors, etc) are accessed through dedicated methods.
    public parseProgram(): boolean {
        while (!this.currTokenIs("EOF") && this.currentToken != null) {
            var stmt = this.parseStatement();
            if (stmt != null) {
                this.ast.push(stmt);
            }
            this.advanceToken();
        }
        return false;
    }

    private currTokenIs(type: TokenType): boolean {
        return this.currentToken?.type == type;
    }

    public getErrors(): Array<Error> | null {
        return this.errors;
    }

    // ======================================
    // =          Private method            =
    // ======================================

    private parseExpression(): Expression | null {
        return null;
    }

    private parseStatement(): Statement | null {
        switch (this.currentToken!.type) {
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

            // SL NO soporta expresiones sueltas, todo debe ser parte
            // de un subprograma, alguna declaracion como var, o de la main function.
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

    parseVariablesDeclaration(): Statement | null {
        
    }

    private parseIdentifier(): Expression {
        var token = this.currentToken;
        return new Identifier(token!);
    }

    // ======================================
    // =                Utils               =
    // ======================================

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
}

export { Parser };
