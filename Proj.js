// JavaScript equivalent of the Java Compiler class with added parser functionality
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter a line of code: ', (x) => {
  rl.close();

  let operators = new Array(x.length);
  let constants = new Array(x.length);
  let punctuators = new Array(x.length);
  let keywords = new Array(x.length);
  let identifiers = new Array(x.length);
  let literals = new Array(x.length);
  let tokens = []; // Added for parser

  let opMarker = 0, consMarker = 0, puncMarker = 0, keyMarker = 0, idMarker = 0, litMarker = 0;
  let p = 0;
  let q = false;

  for (let i = 0; i < x.length; i++) {
    let ch = x.charAt(i);
    if (ch === '"') {
      q = !q;
      if (!q) {
        const lit = x.substring(p, i + 1);
        literals[litMarker++] = lit;
        tokens.push({ type: 'literal', value: lit }); // Add to tokens for parser
        p = i + 1;
      } else {
        p = i;
      }
      continue;
    }

    if (!q && (isWhitespace(ch) || isPunctuation(x, i) || isOperatorChar(ch))) {
      if (p !== i) {
        let token = x.substring(p, i);
        if (isKeyword(token)) {
          keywords[keyMarker++] = token;
          tokens.push({ type: 'keyword', value: token }); // Add to tokens for parser
        } else if (isConstant(token)) {
          constants[consMarker++] = token;
          tokens.push({ type: 'constant', value: token }); // Add to tokens for parser
        } else {
          identifiers[idMarker++] = token;
          tokens.push({ type: 'identifier', value: token }); // Add to tokens for parser
        }
      }

      if (isPunctuation(x, i)) {
        punctuators[puncMarker++] = String(ch);
        tokens.push({ type: 'punctuator', value: ch }); // Add to tokens for parser
        p = i + 1;
      } else if (i < x.length - 1) {
        let op2 = x.substring(i, i + 2);
        if (isOperator(op2)) {
          operators[opMarker++] = op2;
          tokens.push({ type: 'operator', value: op2 }); // Add to tokens for parser
          i++;
        } else {
          operators[opMarker++] = String(ch);
          tokens.push({ type: 'operator', value: ch }); // Add to tokens for parser
        }
        p = i + 1;
      } else {
        operators[opMarker++] = String(ch);
        tokens.push({ type: 'operator', value: ch }); // Add to tokens for parser
        p = i + 1;
      }
    }
  }

  if (!isCorrect(x)) {
    console.log("ERROR!");
  } else {
    console.log("_______________________________________________________________");
    display("Keywords\t", keywords, keyMarker);
    display("Identifiers\t", identifiers, idMarker);
    display("Operators\t", operators, opMarker);
    display("Constants\t", constants, consMarker);
    display("Punctuators\t", punctuators, puncMarker);
    display("Literals\t", literals, litMarker);
    console.log("_______________________________________________________________");

    // Add parser functionality
    const filteredTokens = tokens.filter(token => token.value.trim() !== '' && token.type !== 'punctuator' && token.value !== ';');
    const parser = new Parser(filteredTokens);
    const ast = parser.parse();
    console.log("Abstract Syntax Tree (AST):", JSON.stringify(ast, null, 2));
  }
});

function display(name, arr, mark) {
  process.stdout.write(name + ": ");
  for (let i = 0; i < mark; i++) {
    if (arr[i] === null) continue;
    let repeated = 0;
    for (let j = 0; j < i; j++) {
      if (arr[i] === arr[j]) {
        repeated = 1;
        break;
      }
    }
    if (repeated === 0) {
      process.stdout.write(arr[i] + "  ");
    }
  }
  console.log();
}

function isKeyword(key) {
  const keywords = [
    "boolean", "break", "case", "char", "class", "default", "do", "else", "float",
    "for", "if", "import", "int", "new", "private", "public", "return", "static",
    "switch", "void", "while", "String", "length", "continue"
  ];
  for (let keyword of keywords) {
    if (key === keyword) {
      return true;
    }
  }
  return false;
}

function isConstant(cons) {
  return isInteger(cons) || isFloat(cons);
}

function isInteger(str) {
  if (str.length === 0) return false;
  for (let ch of str) {
    if (!isDigit(ch)) {
      return false;
    }
  }
  return true;
}

function isFloat(str) {
  let point = 0;
  if (str.length === 0) return false;

  for (let ch of str) {
    if (ch === '.') {
      if (point === 1) return false;
      point = 1;
    } else if (!isDigit(ch)) {
      return false;
    }
  }
  return point === 1;
}

function isOperator(op) {
  const operators = [
    "+", "-", "*", "/", "%", "=", "<", ">", "!", 
    "++", "--", "+=", "-=", "*=", "/=", 
    ">=", "<=", "==", "!=", "||", "&&"
  ];
  for (let operator of operators) {
    if (op === operator) {
      return true;
    }
  }
  return false;
}

function isOperatorChar(ch) {
  return "+-*/=%<>!&|".indexOf(ch) !== -1;
}

function isPunctuation(code, index) {
  let ch = code.charAt(index);

  const punctuators = ";,!?[]{}()";

  if (punctuators.indexOf(ch) !== -1) {
    return true;
  }

  if (ch === '.') {
    if (index > 0 && index < code.length - 1) {
      if (isDigit(code.charAt(index - 1)) && isDigit(code.charAt(index + 1))) {
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
  let last = '\0';

  for (let i = 0; i < code.length; i++) {
    let ch = code.charAt(i);

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

// Helper functions to replace Java's Character methods
function isWhitespace(ch) {
  return /\s/.test(ch);
}

function isDigit(ch) {
  return /^\d$/.test(ch);
}

// Parser class from the second code
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