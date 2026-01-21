// prettier-ignore
type TokenType =
  // Palabras reservadas
  | "VAR" | "VARIABLES" | "CONST" | "CONSTANTES" | "TIPOS" | "TIPO" | "SUBRUTINA"
  | "RETORNA" | "REF" | "INICIO" | "FIN" | "PROGRAMA" | "SI" | "SINO" | "MIENTRAS"
  | "REPETIR" | "PASO" | "SALIR" | "EVAL" | "CASO" | "LOGICO" | "NUMERICO" | "CADENA"
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

class Token {
    type: TokenType;
    literal: string;

    lineNumber: number;
    column: number;

    constructor(type: TokenType, literal: string, row: number, column: number) {
        this.type = type;
        this.literal = literal;
        this.lineNumber = row;
        this.column = column;
    }

    public string(): string {
        if (this.literal == "\n") {
            return "\\n";
        }
        return this.literal;
    }
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
    salir: "SALIR",
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
    private readPosition: number = 0;
    private currentChar: string = "";

    // Used for error messages
    private column: number = 1;
    private currentLine: number = 1;

    constructor(input: string) {
        this.input = input;
        this.readChar();
    }

    // ======================================
    // =          Private Methods           =
    // ======================================

    private skipComments() {
        // Primero revisar que no estemos frente a un comentario, en cuyo caso
        // simplemente ignoramos toda la linea
        if (this.currentChar == "/" && this.peekChar() == "/") {
            this.readChar();
            // @ts-ignore (typescript trata de hacer comparaciones que no tienen
            // sentido)
            while (this.currentChar != "\n" && this.currentChar != "") {
                // Saltarse todo hasta el primer salto de linea o el final del archivo
                this.readChar();
            }
            this.readChar(); // Skip '\n'
            this.skipWhitespace();
        }
    }

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
            this.currentChar = "";
        } else {
            // @ts-ignore
            this.currentChar = this.input[this.readPosition];
        }
        this.column = this.readPosition;
        this.readPosition++;
    }

    private isLetter(ch: string): boolean {
        return /[a-zA-Z_]/.test(ch);
    }

    private isDigit(ch: string): boolean {
        return /[0-9]/.test(ch);
    }

    private skipWhitespace() {
        while (this.currentChar === " " || this.currentChar === "\t" || this.currentChar === "\r") {
            this.readChar();
        }
    }

    private readIdentifier(): string {
        const start = this.column;
        while (this.isLetter(this.currentChar) || this.isDigit(this.currentChar)) {
            this.readChar();
        }
        return this.input.slice(start, this.column);
    }

    private readNumber(): string {
        const start = this.column;
        while (this.isDigit(this.currentChar)) {
            this.readChar();
        }
        return this.input.slice(start, this.column);
    }

    private newToken(type: TokenType, ch: string): Token {
        const tokenStart = this.column - ch.length;
        return new Token(type, ch, this.currentLine, tokenStart);
    }

    // ======================================
    // =        Public API                  =
    // ======================================

    public nextToken(): Token {
        this.skipWhitespace();

        let tok: Token;

        this.skipComments();

        switch (this.currentChar) {
            case ";":
                tok = this.newToken("SEMICOLON", this.currentChar);
                break;
            case '"':
                tok = this.newToken("DQUOTE", this.currentChar);
                break;
            case "'":
                tok = this.newToken("SQUOTE", this.currentChar);
                break;
            case "/":
                tok = this.newToken("SLASH", this.currentChar);
                break;
            case "*":
                tok = this.newToken("ASTERISK", this.currentChar);
                break;
            case "{":
                tok = this.newToken("LBRACE", this.currentChar);
                break;
            case "}":
                tok = this.newToken("RBRACE", this.currentChar);
                break;
            case "[":
                tok = this.newToken("LBRACKET", this.currentChar);
                break;
            case "]":
                tok = this.newToken("RBRACKET", this.currentChar);
                break;
            case "(":
                tok = this.newToken("LPAREN", this.currentChar);
                break;
            case ")":
                tok = this.newToken("RPAREN", this.currentChar);
                break;
            case ":":
                tok = this.newToken("COLON", this.currentChar);
                break;
            case "=":
                tok = this.newToken("ASSIGN", this.currentChar);
                break;
            case ">":
                tok = this.newToken("GT", this.currentChar);
                break;
            case "<":
                tok = this.newToken("LT", this.currentChar);
                break;
            case "+":
                tok = this.newToken("PLUS", this.currentChar);
                break;
            case "-":
                tok = this.newToken("MINUS", this.currentChar);
                break;
            case "^":
                tok = this.newToken("POW", this.currentChar);
                break;
            case "":
                tok = this.newToken("EOF", "");
                break;
            case "\n":
                tok = this.newToken("NEWLINE", this.currentChar);
                this.currentLine++;
                this.column = 0;
                break;
            default:
                if (this.isLetter(this.currentChar)) {
                    const literal = this.readIdentifier();
                    const type = keywords[literal.toLowerCase()] || "IDENTIFIER";

                    if (type === "LIB" || type === "LIBEXT" || type === "ARCHIVO") {
                        throw new Error(`Token '${literal}' is reserved but not allowed.`);
                    }
                    return this.newToken(type, literal);
                } else if (this.isDigit(this.currentChar)) {
                    const literal = this.readNumber();
                    return this.newToken("NUMBER", literal);
                } else {
                    return this.newToken("ILLEGAL", this.currentChar);
                }
        }

        this.readChar();
        return tok;
    }
}

export type { Token, TokenType };
export { Lexer };
