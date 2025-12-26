// prettier-ignore
type TokenType =
  // Palabras reservadas
  | "VAR" | "VARIABLES" | "CONST" | "CONSTANTES" | "TIPOS" | "TIPO" | "SUBRUTINA"
  | "RETORNA" | "REF" | "INICIO" | "FIN" | "PROGRAMA" | "SI" | "SINO" | "MIENTRAS"
  | "REPETIR" | "PASO" | "EVAL" | "CASO" | "LOGICO" | "NUMERICO" | "CADENA"
  | "REGISTRO" | "VECTOR" | "MATRIZ" | "AND" | "OR" | "NOT"
  // no usadas, error
  | "LIB" | "LIBEXT" | "ARCHIVO"
  // Símbolos
  | "SEMICOLON" | "DQUOTE" | "SQUOTE" | "SLASH" | "ASTERISK" | "LBRACE"
  | "RBRACE" | "LPAREN" | "RPAREN" | "COLON" | "ASSIGN" | "GT"
  | "LT" | "PLUS" | "MINUS" | "POW" | "NEWLINE" | "RBRACKET" | "LBRACKET"
  // Otros
  | "NUMBER" | "IDENTIFIER" | "EOF" | "ILLEGAL";
// prettier-ignore-end

interface Token {
    type: TokenType;
    literal: string;
    pos: number;
}

const keywords: Record<string, TokenType> = {
    var: "VAR",
    variables: "VARIABLES",
    const: "CONST",
    constantes: "CONSTANTES",
    tipos: "TIPOS",
    tipo: "TIPO",

    subrutina: "SUBRUTINA",
    retorna: "RETORNA",
    ref: "REF",

    inicio: "INICIO",
    fin: "FIN",
    programa: "PROGRAMA",
    si: "SI",
    sino: "SINO",
    mientras: "MIENTRAS",
    repetir: "REPETIR",
    paso: "PASO",
    eval: "EVAL",
    caso: "CASO",

    logico: "LOGICO",
    numerico: "NUMERICO",
    cadena: "CADENA",
    registro: "REGISTRO",
    vector: "VECTOR",
    matriz: "MATRIZ",

    and: "AND",
    or: "OR",
    not: "NOT",

    lib: "LIB",
    libext: "LIBEXT",
    archivo: "ARCHIVO",
};

class Lexer {
    private input: string;
    private position: number = 0; // posición actual en input (char leído)
    private readPosition: number = 0; // posición siguiente a leer
    private ch: string = ""; // char actual

    constructor(input: string) {
        this.input = input;
        this.readChar();
    }

    // ======================================
    // =          Private Methods           =
    // ======================================

    // Mirar un caracter por delante del caracter actual.
    private peekChar() {
        if (this.readPosition >= this.input.length) {
            return "";
        } else {
            // @ts-ignore
            return this.input[this.readPosition];
        }
    }

    private readChar() {
        if (this.readPosition >= this.input.length) {
            this.ch = "";
        } else {
            // @ts-ignore
            this.ch = this.input[this.readPosition];
        }
        this.position = this.readPosition;
        this.readPosition++;
    }

    private isLetter(ch: string): boolean {
        return /[a-zA-Z_]/.test(ch);
    }

    private isDigit(ch: string): boolean {
        return /[0-9]/.test(ch);
    }

    private skipWhitespace() {
        while (this.ch === " " || this.ch === "\t" || this.ch === "\r") {
            this.readChar();
        }
    }

    private readIdentifier(): string {
        const start = this.position;
        while (this.isLetter(this.ch) || this.isDigit(this.ch)) {
            this.readChar();
        }
        return this.input.slice(start, this.position);
    }

    private readNumber(): string {
        const start = this.position;
        while (this.isDigit(this.ch)) {
            this.readChar();
        }
        return this.input.slice(start, this.position);
    }

    private newToken(type: TokenType, ch: string): Token {
        return {
            type,
            literal: ch,
            pos: this.position,
        };
    }

    // ======================================
    // =        Public API                  =
    // ======================================

    public nextToken(): Token | null {
        this.skipWhitespace();

        let tok: Token;

        // Primero revisar que no estemos frente a un comentario, en cuyo caso
        // simplemente ignoramos toda la linea
        if (this.ch == "/" && this.peekChar() == "/") {
            this.readChar();
            // @ts-ignore (typescript trata de hacer comparaciones que no tienen
            // sentido)
            while (this.ch != "\n" && this.ch != "") {
                // Saltarse todo hasta el primer salto de linea o el final del archivo
                this.readChar();
            }
            this.readChar(); // Skip '\n'
            this.skipWhitespace();
        }

        switch (this.ch) {
            case ";":
                tok = this.newToken("SEMICOLON", this.ch);
                break;
            case '"':
                tok = this.newToken("DQUOTE", this.ch);
                break;
            case "'":
                tok = this.newToken("SQUOTE", this.ch);
                break;
            case "/":
                tok = this.newToken("SLASH", this.ch);
                break;
            case "*":
                tok = this.newToken("ASTERISK", this.ch);
                break;
            case "{":
                tok = this.newToken("LBRACE", this.ch);
                break;
            case "}":
                tok = this.newToken("RBRACE", this.ch);
                break;
            case "[":
                tok = this.newToken("LBRACKET", this.ch);
                break;
            case "]":
                tok = this.newToken("RBRACKET", this.ch);
                break;
            case "(":
                tok = this.newToken("LPAREN", this.ch);
                break;
            case ")":
                tok = this.newToken("RPAREN", this.ch);
                break;
            case ":":
                tok = this.newToken("COLON", this.ch);
                break;
            case "=":
                tok = this.newToken("ASSIGN", this.ch);
                break;
            case ">":
                tok = this.newToken("GT", this.ch);
                break;
            case "<":
                tok = this.newToken("LT", this.ch);
                break;
            case "+":
                tok = this.newToken("PLUS", this.ch);
                break;
            case "-":
                tok = this.newToken("MINUS", this.ch);
                break;
            case "^":
                tok = this.newToken("POW", this.ch);
                break;
            case "":
                tok = { type: "EOF", literal: "", pos: this.position };
                break;
            case "\n":
                tok = this.newToken("NEWLINE", this.ch);
                break;
            default:
                if (this.isLetter(this.ch)) {
                    const literal = this.readIdentifier();
                    const type = keywords[literal.toLowerCase()] || "IDENTIFIER";

                    if (type === "LIB" || type === "LIBEXT" || type === "ARCHIVO") {
                        throw new Error(`Token '${literal}' is reserved but not allowed.`);
                    }

                    return { type, literal, pos: this.position };
                } else if (this.isDigit(this.ch)) {
                    const literal = this.readNumber();
                    return { type: "NUMBER", literal, pos: this.position };
                } else {
                    tok = this.newToken("ILLEGAL", this.ch);
                }
        }

        this.readChar();
        return tok;
    }

    public lookAhead(): Token | null {
        return this.nextToken();
    }
}

export type { Token, TokenType };
export { Lexer };
