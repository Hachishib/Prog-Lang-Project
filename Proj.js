const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const ErrorType = { SYNTAX: "syntax", SEMANTIC: "semantic" };
let lines = [];
console.log("Enter your code (type 'END' on a new line to finish):");
rl.on("line", (line) => {
  if (line.trim() === "END") {
    rl.close();
    const fullCode = lines.join("\n");
    analyzeAndParse(fullCode);
  } else {
    lines.push(line);
  }
});

function analyzeAndParse(x) {
  let operators = new Array(x.length);
  let constants = new Array(x.length);
  let punctuators = new Array(x.length);
  let keywords = new Array(x.length);
  let identifiers = new Array(x.length);
  let literals = new Array(x.length);
  let tokens = [];

  let markers = {
    opMarker: 0,
    consMarker: 0,
    puncMarker: 0,
    keyMarker: 0,
    idMarker: 0,
    litMarker: 0,
  };
  let p = 0;
  let q = false;

  for (let i = 0; i < x.length; i++) {
    let ch = x.charAt(i);
    if (ch === '"') {
      q = !q;
      if (!q) {
        const lit = x.substring(p, i + 1);
        literals[markers.litMarker++] = lit;
        tokens.push({ type: "literal", value: lit });
        p = i + 1;
      } else {
        p = i;
      }
      continue;
    }

    if (!q && ch === ".") {
      processToken(x, p, i, keywords, constants, identifiers, tokens, markers);
      punctuators[markers.puncMarker++] = ".";
      tokens.push({ type: "punctuator", value: "." });
      p = i + 1;
      continue;
    }

    if (!q && (isWhitespace(ch) || isPunctuation(x, i) || isOperatorChar(ch))) {
      processToken(x, p, i, keywords, constants, identifiers, tokens, markers);
      if (isPunctuation(x, i)) {
        punctuators[markers.puncMarker++] = String(ch);
        tokens.push({ type: "punctuator", value: ch });
        p = i + 1;
      } else if (i < x.length - 1 && !isWhitespace(ch)) {
        let op2 = x.substring(i, i + 2);
        if (isOperator(op2)) {
          operators[markers.opMarker++] = op2;
          tokens.push({ type: "operator", value: op2 });
          i++;
        } else if (isOperatorChar(ch)) {
          operators[markers.opMarker++] = String(ch);
          tokens.push({ type: "operator", value: ch });
        }
        p = i + 1;
      } else if (isOperatorChar(ch)) {
        operators[markers.opMarker++] = String(ch);
        tokens.push({ type: "operator", value: ch });
        p = i + 1;
      } else {
        p = i + 1; // Skip whitespace
      }
    }
  }
  // Handle any remaining token at the end
  if (p < x.length && !q) {
    processToken(
      x,
      p,
      x.length,
      keywords,
      constants,
      identifiers,
      tokens,
      markers
    );
  }
  console.log("_____________________________________________________________");
  display("Keywords\t", keywords, markers.keyMarker);
  display("Identifiers\t", identifiers, markers.idMarker);
  display("Operators\t", operators, markers.opMarker);
  display("Constants\t", constants, markers.consMarker);
  display("Punctuators\t", punctuators, markers.puncMarker);
  display("Literals\t", literals, markers.litMarker);
  console.log("_____________________________________________________________");
  const filteredTokens = tokens.filter(
    (token) =>
      token.value.trim() !== "" &&
      !(
        token.type === "punctuator" &&
        ["!", "?", "[", "]"].includes(token.value)
      )
  );
  const parser = new Parser(filteredTokens);
  const ast = parser.parse();
  console.log("Filtered Tokens:", filteredTokens);
  console.log("Abstract Syntax Tree (AST):", JSON.stringify(ast, null, 2));
  parser.analyzeErrors();
}

function processToken(
  x,
  start,
  end,
  keywords,
  constants,
  identifiers,
  tokens,
  markers
) {
  if (start !== end) {
    let token = x.substring(start, end);
    if (isKeyword(token)) {
      keywords[markers.keyMarker++] = token;
      tokens.push({ type: "keyword", value: token });
    } else if (isConstant(token)) {
      constants[markers.consMarker++] = token;
      tokens.push({ type: "constant", value: token });
    } else if (token.trim() !== "") {
      identifiers[markers.idMarker++] = token;
      tokens.push({ type: "identifier", value: token });
    }
  }
}

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
  const punctuators = ";:,!?[]{}()"; // Removed '.' from here

  if (punctuators.includes(ch)) {
    return true;
  }
  return false;
}

function isWhitespace(ch) {
  return /\s/.test(ch);
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens.filter((token) => token.value.trim() !== "");
    this.symbolTable = [{}];
    this.errors = [];
  }

  parse() {
    const ast = [];
    while (this.tokens.length > 0) {
      const statement = this.parseStatement();
      if (statement) {
        if (statement.error) {
          this.addError(statement.error, ErrorType.SYNTAX);
        }
        ast.push(statement);
      } else {
        // If parseStatement returns null, it usually indicates an error
        // or end of input. We might want to add error handling here.
        if (this.tokens.length > 0) {
          this.addError(`Unrecognized token: ${this.tokens[0]?.value}`, ErrorType.SYNTAX, this.tokens[0]?.loc);
          this.tokens.shift();
        }
      }
    }
    return { ast };
  }

  // Helper functions for parsing
  parseAssignment() {
    let keyword;
    if (this.tokens[0]?.type === "keyword") {
      keyword = this.tokens.shift();
    }
    const identifier = this.tokens.shift();
    const op = this.tokens.shift();
    let error = null;

    if (op?.value !== "=") {
      error = this.addError(`Invalid assignment syntax near '${op?.value}'`, ErrorType.SYNTAX, op?.loc);
    }
    const value = this.tokens.shift();
    this.consumeSemicolon(
      `Missing semicolon after assignment of '${identifier.value}'`
    );

    if (keyword && !this.declareVariable(identifier.value, keyword.value)) {
      if (error === null && identifier) {
        error = this.addError(
          `Variable '${identifier.value}' already declared`, ErrorType.SEMANTIC, this.tokens[0]?.loc);
      }
    }

    if (!this.lookupVariable(identifier.value)) {
      if (error === null && identifier) {
        error = this.addError(`Variable '${identifier.value}' is not declared.`, ErrorType.SEMANTIC, this.tokens[0]?.loc);
      }
    }

    const variable = this.lookupVariable(identifier.value);
    const parsedValue = this.parseLiteralOrExpression(value);

    // Type checking
    if (
      variable &&
      parsedValue &&
      !this.isValidAssignment(parsedValue, variable.type)
    ) {
      if (error === null && value) {
        error = this.addError(
          `Error mismatch: cannot assign ${parsedValue.dataType} to ${variable.type}`,ErrorType.SEMANTIC
        );
      }
    }

    this.assignVariable(identifier.value);
    const assignmentNode = {
      type: "Assignment",
      keyword: keyword?.value,
      identifier: identifier.value,
      value: parsedValue,
    };
    if (error !== null) {
      assignmentNode.error = error;
    }
    return assignmentNode;
  }

  parseExpression() {
    let left = this.parseLiteralOrExpression(this.tokens.shift());
    if (!left) return null;

    while (this.tokens.length > 0 && this.tokens[0].type === "operator") {
      const op = this.tokens.shift();
      const right = this.parseLiteralOrExpression(this.tokens.shift());
      if (!right) return null;

      if (op.value === "+") {
        if (left.dataType === "String" || right.dataType === "String") {
          // String concatenation is allowed
          left = {
            type: "BinaryExpression",
            left: left,
            operator: op.value,
            right: right,
            dataType: "String", // Result is a string
          };
          continue;
        }
      }
      // all other operators
      if (left.dataType === "String" || right.dataType === "String") {
        this.addError(
          `Bad operand '${op.value}' to be use in printing.`,
          ErrorType.SEMANTIC
        );
      }
      left = {
        type: "BinaryExpression",
        left: left,
        operator: op.value,
        right: right,
      };
    }
    return left;
  }

  parseDeclaration() {
    const keyword = this.tokens.shift();
    const identifier = this.tokens.shift();

    // Consume up to semicolon
    if (this.tokens.length > 0 && this.tokens[0]?.value !== ";") {
      this.addError(
        `Unexpected token after declaration of '${identifier.value}'`,
        ErrorType.SEMANTIC
      );
      while (this.tokens.length > 0 && this.tokens[0]?.value !== ";") {
        this.tokens.shift();
      }
    }
    this.consumeSemicolon(
      `Missing semicolon after declaration of '${identifier.value}'`
    );

    if (!this.declareVariable(identifier.value, keyword.value)) {
      return { error: `Variable '${identifier.value}' already declared` };
    }

    return {
      type: "Declaration",
      keyword: keyword.value,
      identifier: identifier.value,
    };
  }

  parseLiteralOrExpression(token) {
    if (!token) return { error: "Missing token in expression" };
    if (token.type === "constant") {
      if (isInteger(token.value))
        return { type: "Literal", value: token.value, dataType: "int" };
      if (isFloat(token.value))
        return { type: "Literal", value: token.value, dataType: "float" };
      return { error: `Invalid constant: ${token.value}` };
    }
    if (token.type === "literal") {
      return { type: "Literal", value: token.value, dataType: "String" };
    }
    if (token.type === "identifier") {
      const variable = this.lookupVariable(token.value);
      if (!variable) {
        return this.addError(`Variable '${token.value}' is not declared.`, ErrorType.SEMANTIC, this.tokens[0]?.loc);
      }
      if (!variable.initialized) {
        this.addError(`Variable '${token.value}' is not initialized.`, ErrorType.SEMANTIC, this.tokens[0]?.loc);
        return {
          type: "Variable",
          value: token.value,
          dataType: variable.type,
        };
      }
      return { type: "Variable", value: token.value, dataType: variable.type };
    }
  }

  parseIfStatement() {
    if (!this.isIfKeyword(this.tokens[0])) {
      return null;
    }
    this.tokens.shift(); // Consume 'if'
    if (!this.consumeToken("(", "Expected '(' after 'if'")) {
      return null;
    }
    const condition = this.parseCondition();
    if (!this.consumeToken(")", "Expected ')' after condition")) {
      return null;
    }
    const thenBranch = this.parseBlock();
    if (!thenBranch) {
      return null;
    }

    const ifNode = { type: "IfStatement", condition, thenBranch };
    let elseIfBranches = [];

    while (this.tokens[0]?.value === "else") {
      this.tokens.shift(); // Consume 'else'
      if (this.isIfKeyword(this.tokens[0])) {
        const elseIfNode = this.parseIfStatement();
        if (elseIfNode) {
          elseIfBranches.push(elseIfNode);
        }
      } else {
        const elseBlock = this.parseBlock();
        if (elseBlock) {
          ifNode.elseBranch = elseBlock;
        }
        break;
      }
    }
    if (elseIfBranches.length > 0) {
      ifNode.elseIfBranches = elseIfBranches;
    }
    return ifNode;
  }

  parseCondition() {
    if (this.tokens.length < 3) {
      this.addError("Incomplete condition", ErrorType.SYNTAX);
      return null;
    }
    const left = this.tokens.shift();
    const operatorToken = this.tokens.shift();
    if (!this.isValidComparisonOperator(operatorToken.value)) {
      this.addError(`Invalid comparison operator '${operatorToken.value}' in condition`, ErrorType.SYNTAX, operatorToken.loc);
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
    if (!this.consumeToken("{", "Expected '{'")) return null;
    this.pushScope();
    const statements = [];
    while (this.tokens.length > 0 && this.tokens[0]?.value !== "}") {
      if (this.isLoopKeyword(this.tokens[0])) {
        const loopStatement = this.parseLoop(this.tokens[0].value);
        this.handleParsedStatement(
          loopStatement,
          `Failed to parse ${this.tokens[0].value} loop`,
          statements
        );
      } else if (this.isAssignment(this.tokens)) {
        const assignment = this.parseAssignment();
        this.handleParsedStatement(
          assignment,
          `Invalid assignment`,
          statements
        );
      } else if (this.isIfKeyword(this.tokens[0])) {
        const ifStatement = this.parseIfStatement();
        this.handleParsedStatement(
          ifStatement,
          `Failed to parse if statement`,
          statements
        );
      } else if (this.isMethodCall(this.tokens)) {
        const methodCall = this.parseMethodCall();
        if (methodCall) statements.push(methodCall);
      } else if (this.tokens.length >= 3) {
        const expr = this.parseExpression();
        this.handleParsedStatement(expr, `Invalid expression`, statements);
      } else if (this.tokens[0]?.value === ";") {
        this.tokens.shift();
      } else {
        this.addError(`Unrecognized token in block: ${this.tokens[0]?.value}`, ErrorType.SYNTAX, this.tokens[0]?.loc);
        this.tokens.shift();
      }
    }
    if (this.tokens.length === 0) {
      this.addError("Unclosed block: Missing '}'", ErrorType.SYNTAX, this.tokens[0]?.loc);
    } else {
      this.tokens.shift(); // Consume '}'
    }
    this.popScope();
    return statements;
  }

  parseStatement() {
    if (this.tokens.length === 0) return null;

    if (this.isLoopKeyword(this.tokens[0]))
      return this.parseLoop(this.tokens[0].value);
    if (this.isAssignment(this.tokens)) return this.parseAssignment();
    if (this.isIfKeyword(this.tokens[0])) return this.parseIfStatement();
    if (this.isMethodCall(this.tokens)) return this.parseMethodCall();
    if (this.isDeclaration(this.tokens)) return this.parseDeclaration();
    if (this.isSwitchKeyword(this.tokens[0]))
      return this.parseSwitchStatement();

    const expr = this.parseExpression();
    return expr;
  }

  parseMethodCall() {
    const objectParts = [];
    objectParts.push(this.tokens.shift().value);

    while (this.tokens.length > 0 && this.tokens[0].value === ".") {
      this.tokens.shift();
      objectParts.push(this.tokens.shift().value);
    }
    const method = objectParts.pop();
    const object = objectParts.join(".");

    if (!this.consumeToken("(", `Expected '(' after method name '${method}'`))
      return null;
    let args = [];

    while (this.tokens.length > 0 && this.tokens[0].value !== ")") {
      const parsedArg = this.parseExpression();
      args.push(parsedArg);

      if (this.tokens[0]?.value === ",") this.tokens.shift();
    }
    if (this.tokens.length === 0) {
      this.addError("Unclosed method call: Missing ')'", ErrorType.SYNTAX, this.tokens[0]?.loc);
      return { type: "MethodCall", object, method, arguments: args };
    }
    this.tokens.shift(); // Consume ')'
    if (this.tokens.length > 0) {
      this.consumeSemicolon(
        `Missing semicolon after method call to <span class="math-inline">\{object\}\.</span>{method}`
      );
    }
    const methodcall = { type: "MethodCall", object, method, arguments: args };

    this.analyzeMethodCallArguments(methodcall);
    return methodcall;
  }

  parseLoop(loopType) {
    if (loopType === "do") {
      this.tokens.shift();
      const body = this.parseBlock();
      if (!body) {
        this.addError("Invalid body in do-while loop", ErrorType.SYNTAX, this.tokens[0]?.loc);
        return null;
      }
      if (!this.consumeToken("while", "Expected 'while' after do block"))
        return null;
      if (!this.consumeToken("(", "Expected '(' after 'while'")) return null;
      const condition = this.parseCondition();
      if (!condition) {
        this.addError("Invalid condition in do-while loop", ErrorType.SYNTAX, this.tokens[0]?.loc);
        return null;
      }
      if (
        !this.consumeToken(")", "Expected ')' after condition in do-while loop")
      )
        return null;
      this.consumeSemicolon("Missing semicolon after do-while loop");
      return { type: "DoWhileLoop", condition, body };
    } else if (loopType === "while") {
      this.tokens.shift();
      if (!this.consumeToken("(", "Expected '(' after 'while'")) return null;
      const condition = this.parseCondition();
      if (!condition) {
        this.addError("Invalid condition in while loop");
        return null;
      }
      if (!this.consumeToken(")", "Expected ')' after condition in while loop"))
        return null;
      const body = this.parseBlock();
      if (!body) {
        this.addError("Invalid body in while loop", ErrorType.SYNTAX, this.tokens[0]?.loc);
        return null;
      }
      return { type: "WhileLoop", condition, body };
    } else if (loopType === "for") {
      this.tokens.shift();
      if (!this.consumeToken("(", "Expected '(' after 'for'")) return null;
      let init;
      if (this.isAssignment(this.tokens)) {
        init = this.parseAssignment();
      } else {
        while (this.tokens.length > 0 && this.tokens[0].value !== ";")
          this.tokens.shift();
        init = { type: "EmptyStatement" };
        if (
          !this.consumeToken(
            ";",
            "Expected ';' after initialization in for loop"
          )
        )
          return null;
      }
      let condition;
      if (this.tokens[0]?.value === ";") {
        condition = { type: "EmptyStatement" };
        this.tokens.shift();
      } else {
        condition = this.parseCondition();
        if (!this.consumeToken(";", "Expected ';' after condition in for loop"))
          return null;
      }
      let iteration;
      if (this.tokens[0]?.value === ")") {
        iteration = { type: "EmptyStatement" };
      } else {
        iteration = this.parseIteration();
      }
      if (
        !this.consumeToken(
          ")",
          "Expected ')' after iteration expression in for loop"
        )
      )
        return null;
      const body = this.parseBlock();
      if (!body) {
        this.addError("Invalid body in for loop", ErrorType.SYNTAX, this.tokens[0]?.loc);
        return null;
      }
      return { type: "ForLoop", init, condition, iteration, body };
    }
  }

  parseIteration() {
    if (this.tokens.length >= 2) {
      const token1 = this.tokens[0];
      const token2 = this.tokens[1];
      if (
        token1?.type === "identifier" &&
        (token2?.value === "++" || token2?.value === "--")
      ) {
        this.tokens.shift();
        this.tokens.shift();
        return {
          type: token2.value === "++" ? "Increment" : "Decrement",
          operator: token2.value,
          argument: { type: "Variable", value: token1.value },
          form: "postfix",
        };
      } else if (
        (token1?.value === "++" || token1?.value === "--") &&
        token2?.type === "identifier"
      ) {
        this.tokens.shift();
        this.tokens.shift();
        return {
          type: token1.value === "++" ? "Increment" : "Decrement",
          operator: token1.value,
          argument: { type: "Variable", value: token2.value },
          form: "prefix",
        };
      } else if (
        this.tokens.length >= 3 &&
        token1?.type === "identifier" &&
        ["+=", "-=", "*=", "/="].includes(token2?.value)
      ) {
        const identifier = this.tokens.shift();
        const operator = this.tokens.shift();
        const value = this.tokens.shift();
        return {
          type: "CompoundAssignment",
          operator: operator.value,
          left: { type: "Variable", value: identifier.value },
          right: this.parseLiteralOrExpression(value),
        };
      } else if (
        this.tokens.length >= 5 &&
        token1?.type === "identifier" &&
        token2?.value === "="
      ) {
        const left = this.tokens.shift();
        const equals = this.tokens.shift();
        const expr = this.parseExpression();
        return {
          type: "Assignment",
          left: { type: "Variable", value: left.value },
          operator: "=",
          right: expr,
        };
      }
    }
    while (this.tokens.length > 0 && this.tokens[0].value !== ")")
      this.tokens.shift();
    return { type: "EmptyStatement" };
  }

  parseSwitchStatement() {
    this.tokens.shift(); // Consume 'switch'
    if (!this.consumeToken("(", "Expected ( after switch")) return null;
    const expression = this.parseExpression();
    if (!this.consumeToken(")", "Expected ) after switch expression")) return null;
    if (!this.consumeToken("{", "Expected { after switch")) return null;

    const cases = [];
    let defaultCase = null;

    while (this.tokens[0]?.value !== "}") {
      const token = this.tokens[0];

      if (token.value === "case") {
        this.tokens.shift();
        const value = this.parseExpression();
        if (!this.consumeToken(":", "Expected : after case value")) return null;

        const body = [];
        // Parse until next case/default/close-brace
        while (
          this.tokens[0] &&
          !["case", "default", "}"].includes(this.tokens[0].value)
        ) {
          const stmt = this.parseStatement();
          if (stmt) body.push(stmt);
        }

        // Check if the case body ends with a break statement and add a semantic error if not
        if (body.length > 0 && body[body.length - 1]?.type !== "BreakStatement") {
          this.addError("Expected 'break;' at the end of case", ErrorType.SEMANTIC, this.tokens[0]?.loc);
        }

        cases.push({ type: "CaseClause", value, body });
      } else if (token.value === "default") {
        this.tokens.shift();
        if (!this.consumeToken(":", "Expected : after default")) return null;

        const body = [];
        while (this.tokens[0] && this.tokens[0].value !== "}") {
          const stmt = this.parseStatement();
          if (stmt) body.push(stmt);
        }
        defaultCase = { type: "DefaultClause", body };
      } 
      else 
      {
        this.addError(`Unexpected token: ${token.value}`, ErrorType.SYNTAX, token.loc);
        this.tokens.shift();
      }
    }

    this.consumeToken("}", "Expected closing brace for switch");
    return { type: "SwitchStatement", expression, cases, default: defaultCase };
  }

  isValidComparisonOperator(op) {
    const validOperators = ["==", "!=", "<", ">", "<=", ">="];
    return validOperators.includes(op);
  }

  isValidAssignment(value, expectedType) {
    if (expectedType === "int") return isInteger(value.value);
    if (expectedType === "float") return isFloat(value.value);
    if (expectedType === "String") return value.type === "literal";
    if (expectedType === "boolean")
      return value.value === "true" || value.value === "false";
    if (expectedType === "char")
      return value.type === "literal" && value.value.length === 3;
    if (expectedType === "void")
      return value.type === "literal" && value.value.length === 0;
    if (expectedType === "double") return isFloat(value.value);
    return false;
  }

  isAssignment(tokens) {
    const typeKeywords = ["int", "float", "String", "boolean", "char"];
    return (
      tokens.length >= 4 &&
      typeKeywords.includes(tokens[0].value) &&
      tokens[1].type === "identifier" &&
      tokens[2].value === "="
    );
  }

  isDeclaration(tokens) {
    const typeKeywords = ["int", "float", "String", "boolean", "char"];
    return (
      tokens.length >= 2 &&
      typeKeywords.includes(tokens[0].value) &&
      tokens[1].type === "identifier"
    );
  }

  isLoopKeyword(token) {
    return (
      token?.type === "keyword" && ["for", "while", "do"].includes(token?.value)
    );
  }

  isIfKeyword(token) {
    return token?.type === "keyword" && token?.value === "if";
  }

  isMethodCall(tokens) {
    return (
      tokens[0]?.type === "identifier" &&
      tokens.some((token) => token.value === "(")
    );
  }

  isSwitchKeyword(token) {
    return token?.type === "keyword" && token.value === "switch";
  }

  consumeSemicolon(errorMessage) {
    if (this.tokens.length > 0 && this.tokens[0]?.type === "punctuator" && this.tokens[0]?.value === ";") 
    {
      this.tokens.shift();
    } 
    else {
      this.addError(errorMessage, ErrorType.SYNTAX); // Categorize as syntax error
    }
  }

  consumeToken(expectedToken, errorMessage) {
    if (this.tokens.length > 0 && this.tokens[0]?.value === expectedToken) {
      this.tokens.shift();
      return true;
    } else {
      this.addError(errorMessage, ErrorType.SYNTAX); // Categorize as syntax error
      return false;
    }
  }

  analyzeMethodCallArguments(methodCall) {
    if (methodCall.method === "println") {
      if (methodCall.arguments.length !== 1) {
        this.addError(
          "println method expects one argument.",
          ErrorType.SEMANTIC
        );
      }
    }
  }

  declareVariable(identifier, type) {
    const currentScope = this.getCurrentScope();
    if (currentScope[identifier]) {
      this.addError(`Variable '${identifier}' already declared in this scope.`,ErrorType.SEMANTIC);
      return false;
    }
    currentScope[identifier] = { type, initialized: false };
    return true;
  }

  assignVariable(identifier) {
    for (let i = this.symbolTable.length - 1; i >= 0; i--) {
      if (this.symbolTable[i][identifier]) {
        this.symbolTable[i][identifier].initialized = true;
        return;
      }
    }
    this.addError(`Variable '${identifier}' is not declared.`,ErrorType.SEMANTIC);
  }

  lookupVariable(identifier) {
    for (let i = this.symbolTable.length - 1; i >= 0; i--) {
      if (this.symbolTable[i][identifier]) {
        return this.symbolTable[i][identifier];
      }
    }
    return null; // Variable not found
  }

  addError(message, type) {
    this.errors.push({ message, type });
  }

  handleParsedStatement(statement, errorMessage, ast) {
    if (statement) {
      if (statement.error) {
        // Error already handled in parse()
        return;
      }
      ast.push(statement);
    }
  }

  analyzeErrors() {
    let syntaxErrors = this.errors.filter(
      (err) => err.type === ErrorType.SYNTAX
    );
    let semanticErrors = this.errors.filter(
      (err) => err.type === ErrorType.SEMANTIC
    );

    console.log("Syntax Errors:");
    syntaxErrors.forEach((err) => console.log("- " + err.message));

    console.log("Semantic Errors:");
    semanticErrors.forEach((err) => console.log("- " + err.message));
  }

  getCurrentScope() {
    return this.symbolTable[this.symbolTable.length - 1];
  }

  pushScope() {
    this.symbolTable.push({});
  }

  popScope() {
    this.symbolTable.pop();
  }
}
