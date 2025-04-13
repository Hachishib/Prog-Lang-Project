// JavaScript equivalent of the Java Compiler class with added parser functionality
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter a line of code: ", (x) => {
  rl.close();

  let operators = new Array(x.length);
  let constants = new Array(x.length);
  let punctuators = new Array(x.length);
  let keywords = new Array(x.length);
  let identifiers = new Array(x.length);
  let literals = new Array(x.length);
  let tokens = []; // Added for parser

  let opMarker = 0,
    consMarker = 0,
    puncMarker = 0,
    keyMarker = 0,
    idMarker = 0,
    litMarker = 0;
  let p = 0;
  let q = false;

  for (let i = 0; i < x.length; i++) {
    let ch = x.charAt(i);
    if (ch === '"') {
      q = !q;
      if (!q) {
        const lit = x.substring(p, i + 1);
        literals[litMarker++] = lit;
        tokens.push({ type: "literal", value: lit });
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
          tokens.push({ type: "keyword", value: token });
        } else if (isConstant(token)) {
          constants[consMarker++] = token;
          tokens.push({ type: "constant", value: token });
        } else {
          identifiers[idMarker++] = token;
          tokens.push({ type: "identifier", value: token });
        }
      }

      if (isPunctuation(x, i)) {
        punctuators[puncMarker++] = String(ch);
        tokens.push({ type: "punctuator", value: ch });
        p = i + 1;
      } else if (i < x.length - 1) {
        let op2 = x.substring(i, i + 2);
        if (isOperator(op2)) {
          operators[opMarker++] = op2;
          tokens.push({ type: "operator", value: op2 });
          i++;
        } else {
          operators[opMarker++] = String(ch);
          tokens.push({ type: "operator", value: ch });
        }
        p = i + 1;
      } else {
        operators[opMarker++] = String(ch);
        tokens.push({ type: "operator", value: ch });
        p = i + 1;
      }
    }
  }

  if (!isCorrect(x)) {
    console.log("ERROR!");
  } else {
    console.log(
      "_____________________________________________________________"
    );
    display("Keywords\t", keywords, keyMarker);
    display("Identifiers\t", identifiers, idMarker);
    display("Operators\t", operators, opMarker);
    display("Constants\t", constants, consMarker);
    display("Punctuators\t", punctuators, puncMarker);
    display("Literals\t", literals, litMarker);
    console.log(
      "_____________________________________________________________"
    );

    const filteredTokens = tokens.filter(
      // here din nabago
      (token) =>
        token.value.trim() !== "" &&
        !(
          token.type === "punctuator" &&
          ["!", "?", "[", "]"].includes(token.value)
        )
    );
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
    "boolean",
    "break",
    "case",
    "char",
    "class",
    "default",
    "do",
    "else",
    "float",
    "for",
    "if",
    "import",
    "int",
    "new",
    "private",
    "public",
    "return",
    "static",
    "switch",
    "void",
    "while",
    "String",
    "length",
    "continue",
    "else if",
    "else",
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
    "+",
    "-",
    "*",
    "/",
    "%",
    "=",
    "<",
    ">",
    "!",
    "++",
    "--",
    "+=",
    "-=",
    "*=",
    "/=",
    ">=",
    "<=",
    "==",
    "!=",
    "||",
    "&&",
  ];
  return operators.includes(op);
}

function isOperatorChar(ch) {
  return "+-*/=%<>!&|".includes(ch);
}

function isPunctuation(code, index) {
  let ch = code.charAt(index);
  const punctuators = ";,!?[]{}()";

  if (punctuators.includes(ch)) return true;

  if (ch === ".") {
    if (index > 0 && index < code.length - 1) {
      return !(
        isDigit(code.charAt(index - 1)) && isDigit(code.charAt(index + 1))
      );
    }
    return true;
  }

  return false;
}

function isCorrect(code) {
  let brackets = 0,
    parentheses = 0;
  let inside = false;
  let last = "\0";

  for (let i = 0; i < code.length; i++) {
    let ch = code.charAt(i);

    if (!isWhitespace(ch)) last = ch;

    if (ch === '"') inside = !inside;

    if (!inside) {
      if (ch === "{") brackets++;
      if (ch === "}") brackets--;
      if (ch === "(") parentheses++;
      if (ch === ")") parentheses--;

      if (brackets < 0 || parentheses < 0) return false;
    }
  }

  return (
    (last === "}" || last === ";") &&
    brackets === 0 &&
    parentheses === 0 &&
    !inside
  );
}

function isWhitespace(ch) {
  return /\s/.test(ch);
}

function isDigit(ch) {
  return /^\d$/.test(ch);
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens.filter((token) => token.value.trim() !== "");
    this.symbolTable = {};
    this.errors = [];
  }

  parse() {
    // Medyo nabago dito yung else tinanggalan ng keyword
    const ast = [];
    while (this.tokens.length > 0) {
      if (this.isAssignment(this.tokens)) {
        const assignment = this.parseAssignment();
        assignment.error
          ? this.errors.push(assignment.error)
          : ast.push(assignment);
      } else if (this.tokens[0]?.value === "if") {
        const ifStatement = this.parseIfStatement();
        ifStatement?.error
          ? this.errors.push(ifStatement.error)
          : ast.push(ifStatement);
      } else {
        const expression = this.parseExpression();
        expression?.error
          ? this.errors.push(expression.error)
          : ast.push(expression);
      }
    }
    return { ast, errors: this.errors };
  }

  parseAssignment() {
    const keyword = this.tokens.shift();
    const identifier = this.tokens.shift();
    const op = this.tokens.shift();

    if (op?.value !== "=") {
      return { error: `Invalid assignment syntax near '${op?.value}'` };
    }

    const value = this.tokens.shift();
    if (this.symbolTable[identifier.value]) {
      return {
        error: `Error: Variable '${identifier.value}' already declared`,
      };
    }

    if (!this.isValidAssignment(value, keyword.value)) {
      return {
        error: `Type mismatch assigning ${value?.value} to ${keyword.value}`,
      };
    }

    this.symbolTable[identifier.value] = { type: keyword.value };
    return {
      type: "Assignment",
      keyword: keyword.value,
      identifier: identifier.value,
      value: this.parseLiteralOrExpression(value),
    };
  }

  isValidAssignment(value, expectedType) {
    if (expectedType === "int") return isInteger(value.value);
    if (expectedType === "float") return isFloat(value.value);
    if (expectedType === "String") return value.type === "literal";
    return false;
  }

  parseLiteralOrExpression(token) {
    if (token.type === "constant" || token.type === "literal") {
      return { type: "Literal", value: token.value };
    } else if (token.type === "identifier") {
      return { type: "Variable", value: token.value };
    }
    return { error: `Unexpected token '${token.value}'` };
  }

  isAssignment(tokens) {
    const typeKeywords = ["int", "float", "String", "boolean", "char"]; // A Variable add For assignment
    return (
      tokens.length >= 3 &&
      typeKeywords.includes(tokens[0].value) && // ONLY type keywords
      tokens[1].type === "identifier" &&
      tokens[2].type === "operator" &&
      tokens[2].value === "="
    );
  }

  parseExpression() {
    const left = this.tokens.shift();
    const op = this.tokens.shift();
    const right = this.tokens.shift();

    if (!op || op.type !== "operator") {
      return { error: `Unexpected token '${op?.value}', expected operator` };
    }

    const leftParsed = this.parseLiteralOrExpression(left);
    const rightParsed = this.parseLiteralOrExpression(right);

    if (leftParsed.error || rightParsed.error) {
      return {
        error: `Invalid expression: ${left.value} ${op.value} ${right.value}`,
      };
    }

    return {
      type: "Expression",
      left: leftParsed,
      operator: op.value,
      right: rightParsed,
    };
  }

  parseIfStatement() {
    // Nabago to inalisan na mga errors yeah
    if (this.tokens[0]?.value !== "if") return null;
    this.tokens.shift(); // Consume 'if'

    // Parse condition
    if (this.tokens[0]?.value !== "(") {
      this.errors.push("Expected '(' after 'if'");
      return null;
    }
    this.tokens.shift(); // Consume '('
    const condition = this.parseCondition();
    if (this.tokens[0]?.value !== ")") {
      this.errors.push("Expected ')' after condition");
      return null;
    }
    this.tokens.shift(); // Consume ')'

    // Parse then block
    const thenBranch = this.parseBlock();
    if (!thenBranch) return null;

    const ifNode = {
      type: "IfStatement",
      condition,
      thenBranch,
      elseIfBranches: [],
      elseBranch: null,
    };

    while (this.tokens[0]?.value === "else") {
      this.tokens.shift(); // Consume 'else'

      if (this.tokens[0]?.value === "if") {
        const elseIfNode = this.parseIfStatement();
        if (elseIfNode) {
          ifNode.elseIfBranches.push(elseIfNode);
        }
      } else {
        ifNode.elseBranch = this.parseBlock();
        break;
      }
    }

    return ifNode;
  }

  parseCondition() {
    // YDi ko ma mahanap yung ConditionedParsed  so gumawa nalnag ako from logic sa kabila to here
    const left = this.tokens.shift();
    const operatorToken = this.tokens.shift();

    // Validate operator is a comparison operator
    const validOperators = ["==", "!=", "<", ">", "<=", ">="];
    if (!validOperators.includes(operatorToken.value)) {
      this.errors.push(
        `Invalid operator '${operatorToken.value}' in condition`
      );
    }

    const right = this.tokens.shift();
    return {
      type: "Condition",
      left: this.parseLiteralOrExpression(left),
      operator: operatorToken.value,
      right: this.parseLiteralOrExpression(right),
    };
  }

  parseBlock() {
    // PAra to for Detecting kung merong bracket or  wala, pwede lagyan error handling
    if (this.tokens[0]?.value !== "{") return null;
    this.tokens.shift(); // Remove '{'

    const statements = [];
    while (this.tokens.length > 0 && this.tokens[0].value !== "}") {
      const statement = this.parseStatement();
      if (statement) statements.push(statement);
    }

    if (this.tokens.length === 0) {
      this.errors.push("Unclosed block: Missing '}'");
    } else {
      this.tokens.shift(); // Remove '}'
    }

    return statements;
  }

  parseStatement() {
    // Bagong Fucntion to for handling to ,

    if (this.tokens.length === 0) return null;
    if (this.isAssignment(this.tokens)) {
      return this.parseAssignment();
    }
    // Handle if-statements
    else if (this.tokens[0].value === "if") {
      return this.parseIfStatement();
    } else {
      const expr = this.parseExpression();
      // Ensure semicolon termination
      if (this.tokens[0]?.value === ";") {
        this.tokens.shift();
      } else {
        this.errors.push("Missing ';' after expression");
      }
      return expr;
    }
  }
}