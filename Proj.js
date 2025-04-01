const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("Enter a line of code: ", (code) => {
    const operators = [];
    const constants = [];
    const punctuators = [];
    const keywords = [];
    const identifiers = [];
    const literals = [];
    const tokens = [];

    let p = 0;
    let q = false;

    for (let i = 0; i < code.length; i++) {
        const ch = code[i];
        
        if (ch === '"') {
            q = !q;
            if (!q) {
                const lit = code.substring(p, i + 1);
                literals.push(lit);
                tokens.push({ type: 'literal', value: lit });
                p = i + 1;
            } else {
                p = i;
            }
            continue;
        }

        if (!q && (isWhitespace(ch) || isPunctuation(code, i) || isOperatorChar(ch))) {
            if (p !== i) {
                const token = code.substring(p, i).trim();
                if (token !== "") {
                    if (isKeyword(token)) {
                        keywords.push(token);
                        tokens.push({ type: 'keyword', value: token });
                    } else if (isConstant(token)) {
                        constants.push(token);
                        tokens.push({ type: 'constant', value: token });
                    } else {
                        identifiers.push(token);
                        tokens.push({ type: 'identifier', value: token });
                    }
                }
            }
            
            if (isPunctuation(code, i)) {
                punctuators.push(ch);
                tokens.push({ type: 'punctuator', value: ch });
                p = i + 1;
            } else if (i < code.length - 1) {
                const op2 = code.substring(i, i + 2);
                if (isOperator(op2)) {
                    operators.push(op2);
                    tokens.push({ type: 'operator', value: op2 });
                    i++;
                } else {
                    operators.push(ch);
                    tokens.push({ type: 'operator', value: ch });
                }
                p = i + 1;
            } else {
                operators.push(ch);
                tokens.push({ type: 'operator', value: ch });
                p = i + 1;
            }
        }
    }

    if (!isCorrect(code)) {
        console.log("ERROR!");
    } else {
        console.log("_______________________________________________________________");
        display("Keywords", keywords);
        display("Identifiers", identifiers);
        display("Operators", operators);
        display("Constants", constants);
        display("Punctuators", punctuators);
        display("Literals", literals);
        console.log("_______________________________________________________________");

        const filteredTokens = tokens.filter(token => token.value.trim() !== '' && token.type !== 'punctuator' && token.value !== ';');
        const parser = new Parser(filteredTokens);
        const ast = parser.parse();
        console.log("Abstract Syntax Tree (AST):", JSON.stringify(ast, null, 2));
    }

    rl.close();
});

function display(name, arr) {
    console.log(`${name}: ${[...new Set(arr)].join('  ')}`);
}

function isKeyword(key) {
    const keywords = [
        "boolean", "break", "case", "char", "class", "default", "do", "else", "float",
        "for", "if", "import", "int", "new", "private", "public", "return", "static",
        "switch", "void", "while", "String", "length", "continue"
    ];
    return keywords.includes(key);
}

function isConstant(cons) {
    return isInteger(cons) || isFloat(cons);
}

function isInteger(str) {
    return /^\d+$/.test(str);
}

function isFloat(str) {
    return /^\d+\.\d+$/.test(str);
}

function isOperator(op) {
    const operators = [
        "+", "-", "*", "/", "%", "=", "<", ">", "!",
        "++", "--", "+=", "-=", "*=", "/=", ">=", "<=", "==", "!=", "||", "&&"
    ];
    return operators.includes(op);
}

function isOperatorChar(ch) {
    return "+-*/=%<>!&|".includes(ch);
}

function isPunctuation(code, index) {
    const ch = code[index];
    const punctuators = ";,!?[]{}()";

    if (punctuators.includes(ch)) {
        return true;
    }

    if (ch === '.') {
        if (index > 0 && index < code.length - 1) {
            if (isDigit(code[index - 1]) && isDigit(code[index + 1])) {
                return false;
            }
        }
        return true;
    }

    return false;
}

function isCorrect(code) {
    let brackets = 0, parentheses = 0;
    let inside = false;
    let last = '';

    for (let i = 0; i < code.length; i++) {
        const ch = code[i];

        if (!isWhitespace(ch)) {
            last = ch;
        }

        if (ch === '"') {
            inside = !inside;
        }

        if (!inside) {
            if (ch === '{') brackets++;
            if (ch === '}') brackets--;
            if (ch === '(') parentheses++;
            if (ch === ')') parentheses--;

            if (brackets < 0 || parentheses < 0) {
                return false;
            }
        }
    }

    return (last === '}' || last === ';') && brackets === 0 && parentheses === 0 && !inside;
}

function isWhitespace(ch) {
    return /\s/.test(ch);
}

function isDigit(ch) {
    return /\d/.test(ch);
}

class Parser {
    constructor(tokens) {
        this.tokens = Array.isArray(tokens) ? tokens.filter(token => token.value.trim() !== '') : [];
        this.symbolTable = {};
        this.errors = [];
    }

    parse() {
        const ast = [];

        while (this.tokens.length > 0) {
            if (this.tokens.length >= 3 && this.isAssignment(this.tokens)) {
                const assignment = this.parseAssignment();
                if (assignment.error) {
                    this.errors.push(assignment.error);
                } else {
                    ast.push(assignment);
                }
            } else if (this.tokens.length >= 3) {
                const expression = this.parseExpression();
                if (expression.error) {
                    this.errors.push(expression.error);
                } else {
                    ast.push(expression);
                }
            } else {
                this.errors.push(`Unprocessed tokens remaining: ${this.tokens.map(t => t.value).join(' ')}`);
                break;
            }
        }

        // Return AST and errors if any
        return { ast, errors: this.errors };
    }

    // Handle variable assignment like 'int a = 10'
    parseAssignment() {
        const keyword = this.tokens.shift(); // e.g., 'int'
        const identifier = this.tokens.shift(); // e.g., 'a'
        const op = this.tokens.shift(); // e.g., '='

        if (op.type !== 'operator' || op.value !== '=') {
            return { error: `Invalid assignment syntax near '${op.value}'` };
        }

        const value = this.tokens.shift();

        // Check if the variable is already declared
        if (this.symbolTable[identifier.value]) {
            return { error: `Error: Variable '${identifier.value}' is already declared.` };
        }

        // Check type correctness
        if (!this.isValidAssignment(value, keyword.value)) {
            return { error: `Error: Type mismatch. Cannot assign ${value.value} to '${keyword.value} ${identifier.value}'` };
        }

        // Add to symbol table if valid
        this.symbolTable[identifier.value] = { type: keyword.value };

        return {
            type: 'Assignment',
            keyword: keyword.value,
            identifier: identifier.value,
            value: this.parseLiteralOrExpression(value)
        };
    }

    // Validate type of assigned value
    isValidAssignment(value, expectedType) {
        if (expectedType === 'int' && isInteger(value.value)) {
            return true;
        }
        if (expectedType === 'float' && isFloat(value.value)) {
            return true;
        }
        if (expectedType === 'String' && value.type === 'literal') {
            return true;
        }
        return false;
    }
    parseLiteralOrExpression(token) {
        if (token.type === 'constant' || token.type === 'literal') {
            return {
                type: 'Literal',
                value: token.value
            };
        } else if (token.type === 'identifier') {
            if (!this.symbolTable[token.value]) {
                this.errors.push(`Error: Undeclared variable '${token.value}'`);
                return { error: `Undeclared variable '${token.value}'` };
            }
            return {
                type: 'Variable',
                value: token.value
            };
        }
        return { error: `Unexpected token '${token.value}'` };
    }

    // Check if the current tokens match an assignment pattern
    isAssignment(tokens) {
        return (
            tokens.length >= 3 &&
            tokens[0].type === 'keyword' &&
            tokens[1].type === 'identifier' &&
            tokens[2].type === 'operator' &&
            tokens[2].value === '='
        );
    }

    // Parse expressions (e.g., a + b or a + 5)
    parseExpression() {
        const left = this.tokens.shift(); // Left operand
        const op = this.tokens.shift();   // Operator
        const right = this.tokens.shift(); // Right operand

        if (!op || op.type !== 'operator') {
            return { error: `Unexpected token '${op?.value}', expected an operator.` };
        }

        // Validate left and right operands
        const leftParsed = this.parseLiteralOrExpression(left);
        const rightParsed = this.parseLiteralOrExpression(right);

        if (leftParsed.error || rightParsed.error) {
            return { error: `Invalid expression '${left.value} ${op.value} ${right.value}'` };
        }

        return {
            type: 'Expression',
            left: leftParsed,
            operator: op.value,
            right: rightParsed
        };
    }
}



