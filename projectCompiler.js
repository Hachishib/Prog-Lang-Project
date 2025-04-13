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
        tokens.push({ type: "literal", value: lit }); // Add to tokens for parser
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
          tokens.push({ type: "keyword", value: token }); // Add to tokens for parser
        } else if (isConstant(token)) {
          constants[consMarker++] = token;
          tokens.push({ type: "constant", value: token }); // Add to tokens for parser
        } else {
          identifiers[idMarker++] = token;
          tokens.push({ type: "identifier", value: token }); // Add to tokens for parser
        }
      }

      if (isPunctuation(x, i)) {
        punctuators[puncMarker++] = String(ch);
        tokens.push({ type: "punctuator", value: ch }); // Add to tokens for parser
        p = i + 1;
      } else if (i < x.length - 1) {
        let op2 = x.substring(i, i + 2);
        if (isOperator(op2)) {
          operators[opMarker++] = op2;
          tokens.push({ type: "operator", value: op2 }); // Add to tokens for parser
          i++;
        } else {
          operators[opMarker++] = String(ch);
          tokens.push({ type: "operator", value: ch }); // Add to tokens for parser
        }
        p = i + 1;
      } else {
        operators[opMarker++] = String(ch);
        tokens.push({ type: "operator", value: ch }); // Add to tokens for parser
        p = i + 1;
      }
    }
  }

  if (!isCorrect(x)) {
    console.log("ERROR!");
  } else {
    console.log(
        "_______________________________________________________________"
    );
    display("Keywords\t", keywords, keyMarker);
    display("Identifiers\t", identifiers, idMarker);
    display("Operators\t", operators, opMarker);
    display("Constants\t", constants, consMarker);
    display("Punctuators\t", punctuators, puncMarker);
    display("Literals\t", literals, litMarker);
    console.log(
        "_______________________________________________________________"
    );

    // Add parser functionality
    const filteredTokens = tokens.filter(
        // remove punctuators like semicolons from loop since they cause issues
        (token) => token.value.trim() !== "" && token.value !== ";"
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
    if (ch === ".") {
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

  if (ch === ".") {
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
  let brackets = 0,
      parentheses = 0;
  let inside = false;
  let last = "\0";

  for (let i = 0; i < code.length; i++) {
    let ch = code.charAt(i);

    if (!isWhitespace(ch)) {
      last = ch;
    }

    if (ch === '"') {
      inside = !inside;
    }

    if (!inside) {
      if (ch === "{") brackets++;
      if (ch === "}") brackets--;
      if (ch === "(") parentheses++;
      if (ch === ")") parentheses--;

      if (brackets < 0 || parentheses < 0) {
        return false;
      }
    }
  }

  return (
      (last === "}" || last === ";") &&
      brackets === 0 &&
      parentheses === 0 &&
      !inside
  );
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
    this.tokens = Array.isArray(tokens)
        ? tokens.filter((token) => token.value.trim() !== "")
        : [];
    this.symbolTable = {};
    this.errors = [];
  }

  parse() {
    const ast = [];

    while (this.tokens.length > 0) {
      // Change arrangement lang and inalis na yung isForLoop methods and such and dito na check agad
      if (this.tokens[0].value === "do") {
        const doWhileLoop = this.parseLoop("do");
        if (doWhileLoop.error) {
          this.errors.push(doWhileLoop.error);
        } else {
          ast.push(doWhileLoop);
        }
      }
      else if (this.tokens[0].value === "while") {
        const whileLoop = this.parseLoop("while");
        if (whileLoop.error) {
          this.errors.push(whileLoop.error);
        } else {
          ast.push(whileLoop);
        }
      }
      else if (this.tokens[0].value === "for") {
        const forLoop = this.parseLoop("for");
        if (forLoop.error) {
          this.errors.push(forLoop.error);
        } else {
          ast.push(forLoop);
        }
      }
      // ayan
      else if (this.tokens.length >= 3 && this.isAssignment(this.tokens)) {
        const assignment = this.parseAssignment();
        if (assignment.error) {
          this.errors.push(assignment.error);
        } else {
          ast.push(assignment);
        }
      }
      else if (this.tokens.length > 0) { //
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

    return { ast, errors: this.errors };
  }

  parseLoop(typeOfLoop) {
    if (typeOfLoop === "do") {
      this.tokens.shift(); // Remove 'do'
      //parse body
      const body = this.parseBody();
      if (body.error) {
        return { error: body.error };
      }

      // Check if the next token is 'while'
      if (this.tokens.length < 3 || this.tokens[0].value !== "while") {
        return { error: "Expected 'while' after do block" };
      }

      this.tokens.shift(); // Remove 'while'

      if (this.tokens[0].value !== "(") {
        return { error: "Expected '(' after 'while'" };
      }

      this.tokens.shift(); // Remove '('
      //parse condition
      let condition;
      if (this.tokens.length > 0 && this.tokens[0].value !== ")") {
        condition = this.parseExpression();
      } else {
        condition = { type: "EmptyStatement" };
      }

      // Check ')'
      if (this.tokens.length === 0 || this.tokens[0].value !== ")") {
        return { error: "Expected ')' after condition in do-while loop" };
      }

      this.tokens.shift(); // Remove ')'

      if (this.tokens.length > 0 && this.tokens[0].value === ";") { //no error message
        this.tokens.shift();
      }

      return {
        type: "DoWhileLoop",
        condition,
        body,
      };
    } else if (typeOfLoop === "for") {
      this.tokens.shift(); // Remove 'for'

      if (this.tokens.length === 0 || this.tokens[0].value !== "(") { //new: for "("
        return { error: "Expected '(' after 'for'" };
      }

      this.tokens.shift(); //'('

      // Parse initialization (handle both 'let', 'var', 'const', and assignments)
      let init;
      if (this.tokens.length >= 3 && this.isAssignment(this.tokens)) {
        init = this.parseAssignment();
      } else if (this.tokens.length >= 3 &&
          (this.tokens[0].value === "let" ||
              this.tokens[0].value === "var" ||
              this.tokens[0].value === "const" ||
              this.tokens[0].type === "keyword")) {
        init = this.parseDeclaration();
      } else {
        init = { type: "EmptyStatement" };
      }

      // Parse condition
      let condition;
      if (this.tokens.length > 0 && this.tokens[0].value !== ";") {
        condition = this.parseExpression();
      } else {
        condition = { type: "EmptyStatement" };
      }


      if (this.tokens.length > 0 && this.tokens[0].value === ";") {
        this.tokens.shift();
      }

      // Parse increment = hirap
      let iteration;
      if (this.tokens.length > 0 && this.tokens[0].value !== ")") {
        // for postfix
        if (
            this.tokens.length >= 2 &&
            this.tokens[0].type === "identifier" &&
            ["++", "--"].includes(this.tokens[1].value)
        ) {
          iteration = this.parseIteration();
        }
        //for prefix
        else if (
            this.tokens.length >= 2 &&
            ["++", "--"].includes(this.tokens[0].value) &&
            this.tokens[1].type === "identifier"
        ) {
          iteration = this.parseIteration();
        }
        else if (this.tokens.length >= 3 &&
            this.tokens[0].type === "identifier" &&
            this.tokens[1].type === "operator" &&
            (this.tokens[1].value === "+=" || this.tokens[1].value === "-=")) {
          iteration = this.parseCompoundAssignment();
        } else {
          iteration = this.parseExpression();
        }
      } else {
        iteration = { type: "EmptyStatement" };
      }


      if (this.tokens.length === 0 || this.tokens[0].value !== ")") {
        return { error: "Expected ')' after for loop parts" };
      }
      this.tokens.shift(); // Remove ')'

      // Parse body
      const body = this.parseBody();
      if (body.error) {
        return { error: body.error };
      }

      return {
        type: "ForLoop",
        init,
        condition,
        iteration,
        body
      };
    } else if (typeOfLoop === "while") {
      this.tokens.shift(); // Remove 'while'

      if (this.tokens.length === 0 || this.tokens[0].value !== "(") {
        return { error: "Expected '(' after 'while'" };
      }

      this.tokens.shift(); // Remove '('

      // Parse condition
      let condition;
      if (this.tokens.length > 0 && this.tokens[0].value !== ")") {
        condition = this.parseExpression();
      } else {
        condition = { type: "EmptyStatement" };
      }


      if (this.tokens.length === 0 || this.tokens[0].value !== ")") {
        return { error: "Expected ')' after condition in while loop" };
      }

      this.tokens.shift(); // Remove ')'

      // Parse body
      const body = this.parseBody();
      if (body.error) {
        return { error: body.error };
      }

      return {
        type: "WhileLoop",
        condition,
        body,
      };
    }
    return { error: `Invalid loop type '${typeOfLoop}'` };
  }

  // Handle variable assignment like 'int a = 10'
  parseAssignment() {
    const keyword = this.tokens.shift(); // e.g., 'int'
    const identifier = this.tokens.shift(); // e.g., 'a'
    const op = this.tokens.shift(); // e.g., '='

    if (op.type !== "operator" || op.value !== "=") {
      return { error: `Invalid assignment syntax near '${op.value}'` };
    }

    const value = this.tokens.shift();

    // Check if the variable is already declared
    if (this.symbolTable[identifier.value]) {
      return {
        error: `Error: Variable '${identifier.value}' is already declared.`,
      };
    }

    // Check type correctness
    if (!this.isValidAssignment(value, keyword.value)) {
      return {
        error: `Error: Type mismatch. Cannot assign ${value.value} to '${keyword.value} ${identifier.value}'`,
      };
    }

    // Add to symbol table if valid
    this.symbolTable[identifier.value] = { type: keyword.value };

    return {
      type: "Assignment",
      keyword: keyword.value,
      identifier: identifier.value,
      value: this.parseLiteralOrExpression(value),
    };
  }

  // bago: Parse compound assignment (+=, -=)
  parseCompoundAssignment() {
    if (this.tokens.length < 3) {
      return { error: "Invalid compound assignment syntax" };
    }

    const identifier = this.tokens.shift(); // e.g., 'i'
    const operator = this.tokens.shift(); // e.g., '+='
    const value = this.tokens.shift(); // e.g., '1'

    return {
      type: "CompoundAssignment",
      identifier: this.parseLiteralOrExpression(identifier),
      operator,
      value: this.parseLiteralOrExpression(value)
    };
  }

  // Validate type of assigned value
  isValidAssignment(value, expectedType) {
    if (expectedType === "int" && isInteger(value.value)) {
      return true;
    }
    if (expectedType === "float" && isFloat(value.value)) {
      return true;
    }
    if (expectedType === "String" && value.type === "literal") {
      return true;
    }
    return false;
  }

  parseLiteralOrExpression(token) {
    if (!token) { //error check
      return { error: "Missing token in expression" };
    }

    if (token.type === "constant" || token.type === "literal") {
      return {
        type: "Literal",
        value: token.value,
      };
    } else if (token.type === "identifier") {
      //if (!this.symbolTable[token.value]) {
      //this.errors.push(`Error: Undeclared variable '${token.value}'`);
      //return {error: `Undeclared variable '${token.value}'`};
      //}
      //ganto muna kasi di pede int i < 6 sa condition ng do while at while kaya pag complete
      //na may initialization outside lang loop pede

      return {
        type: "Variable",
        value: token.value,
      };
    }
    return { error: `Unexpected token '${token.value}'` };
  }

  // Check if the current tokens match an assignment pattern
  isAssignment(tokens) {
    return (
        tokens.length >= 3 &&
        (tokens[0].type === "keyword" || tokens[0].type === "identifier") &&
        tokens[1].type === "identifier" &&
        tokens[2].type === "operator" &&
        tokens[2].value === "="
    );
  }

  parseDeclaration() {
    // BAgo for For loop for line
    const type = this.tokens.shift().value; // 'int'
    const name = this.tokens.shift().value; // 'i'

    if (this.tokens[0]?.value !== "=") {
      return { error: "Expected '=' in variable declaration" };
    }
    this.tokens.shift(); // Remove '='

    const value = this.parseExpression();

    if (this.tokens[0]?.value === ";") {
      this.tokens.shift(); // Optional: remove ';' if outside a for-loop
    }

    // Add to symbol table
    this.symbolTable[name] = { type: "variable", value };

    return {
      type: "VariableDeclaration",
      dataType: type,
      name,
      value,
    };
  }

  // binago: nilagyan ng check if increment/decrement
  parseIteration() {
    const [token1, token2] = this.tokens;

    // i++ or i--
    if (
        token1?.type === "identifier" &&
        token2?.type === "operator" &&
        (token2.value === "++" || token2.value === "--")
    ) {
      this.tokens.shift(); // identifier
      this.tokens.shift(); // ++ or --
      if (token2.value === "++") {
        return {
          type: "Increment",
          operator: token2.value,
          argument: {
            type: "Variable",
            value: token1.value
          },
          form: "postfix"
        };
      } else {
        return {
          type: "Decrement",
          operator: token2.value,
          argument: {
            type: "Variable",
            value: token1.value
          },
          form: "postfix"
        };
      }
    }

    // ++i or --i
    if (
        token1?.type === "operator" &&
        (token1.value === "++" || token1.value === "--") &&
        token2?.type === "identifier"
    ) {
      this.tokens.shift(); // ++ or --
      this.tokens.shift(); // identifier
      if (token1.value === "++") {
        return {
          type: "Increment",
          operator: token1.value,
          argument: {
            type: "Variable",
            value: token2.value
          },
          form: "prefix"
        };
      } else {
        return {
          type: "Decrement",
          operator: token1.value,
          argument: {
            type: "Variable",
            value: token2.value
          },
          form: "prefix"
        };
      }
    }

    this.errors.push(`Unexpected token '${token1?.value}' in increment`);
    return {
      error: `Unexpected token '${token1?.value}'`
    };
  }


  // Parse expressions (e.g., a + b or a + 5)
  parseExpression() {
    // Dito nabago
    if (this.tokens.length === 0) {
      return { error: "Unexpected end of tokens in expression" }; // Here Nabago Cheeck lang kung yung tokebn is Expressio is complete :)
    }

    // Check for ++ or -- first
    if (this.tokens.length >= 2 &&
        this.tokens[0].type === "identifier" &&
        (this.tokens[1].value === "++" || this.tokens[1].value === "--")) {
      return this.parseIteration();
    }

    // New: compound assignments like i += 2
    if (this.tokens.length >= 3 &&
        this.tokens[0].type === "identifier" &&
        this.tokens[1].type === "operator" &&
        (this.tokens[1].value === "+=" || this.tokens[1].value === "-=")) {
      return this.parseCompoundAssignment();
    }

    const leftToken = this.tokens.shift();
    const left = this.parseLiteralOrExpression(leftToken);
    if (left.error) {
      return left;
    }


    if (this.tokens.length >= 1 && this.tokens[0].type === "operator") {
      const opToken = this.tokens.shift();

      if (this.tokens.length === 0) {
        return {
          error: `Missing right operand after operator '${opToken.value}'`,
        };
      }

      const rightToken = this.tokens.shift();
      const right = this.parseLiteralOrExpression(rightToken);
      if (right.error) {
        return right;
      }

      return {
        type: "Expression",
        left,
        operator: opToken.value,
        right,
      };
    } else {
      return left;
    }
  }

  //bago
  parseBody() {
    if (this.tokens.length === 0) {
      return { error: "Unexpected end of tokens while parsing body" };
    }

    // Handle single statements without braces like sa if
    if (this.tokens[0].value !== "{") {
      const statement = this.parseStatement();
      if (statement.error) {
        return { error: statement.error };
      }
      return [statement];
    }

    this.tokens.shift(); // Remove '{'

    const body = [];

    // Handle empty body case
    if (this.tokens.length > 0 && this.tokens[0].value === "}") {
      this.tokens.shift(); // Remove '}'
      return body; // Return empty array for empty body
    }

    while (this.tokens.length > 0 && this.tokens[0].value !== "}") {
      const statement = this.parseStatement();
      if (statement.error) {
        return { error: statement.error };
      }
      body.push(statement);
    }

    if (this.tokens.length === 0) {
      return { error: "Missing closing brace '}'" };
    }

    this.tokens.shift(); // Remove '}'
    return body;
  }

  parseStatement() {
    // For error handling pwede remove , pero mag kakaroon ng error pag mali :)
    if (this.tokens.length === 0) { //error check
      return { error: "Unexpected end of tokens while parsing statement" };
    }

    const token = this.tokens[0];

    if (token.type === "Keyword") {
      if (token.value === "for") return this.parseLoop("for");
      if (token.value === "while") return this.parseLoop("while");
      if (token.value === "do") return this.parseLoop("do");
    }
    // myay dagdag dito pero ayun sabi nga ni jp sa taas pede remove pero
    if (
        token.type === "Identifier" &&
        this.tokens.length >= 2 &&
        this.tokens[1].value === "="
    ) {
      return this.parseAssignment();
    }

    if (
        token.type === "Identifier" &&
        this.tokens.length >= 2 &&
        (this.tokens[1].value === "++" || this.tokens[1].value === "--")
    ) {
      return this.parseIteration();
    }

    if (
        token.type === "Identifier" &&
        this.tokens.length >= 3 &&
        (this.tokens[1].value === "+=" || this.tokens[1].value === "-=")
    ) {
      return this.parseCompoundAssignment();
    }

    return this.parseExpression();
  }
}