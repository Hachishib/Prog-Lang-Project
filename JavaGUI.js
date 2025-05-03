const ErrorType = { SYNTAX: "syntax", SEMANTIC: "semantic" };

document.addEventListener("DOMContentLoaded", function () {
  const inputWrite = document.getElementById("inputWrite");
  const outputWrite = document.getElementById("outputWrite");
  const astOutput = document.getElementById("astOutput");
  const errorOutput = document.getElementById("errorOutput");
  const convertButton = document.querySelector(".convert-button");

  const languageButtons = document.querySelectorAll(".language-btn");
  let currentLanguage = "java";

  function setLanguage(lang) {
    currentLanguage = lang;

    document.querySelectorAll(".language-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document.querySelector(`.language-${lang}`).classList.add("active");
    clearOutput();
  }

  languageButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      setLanguage(btn.dataset.lang);
      clearOutput();
    });
  });

  function clearOutput() {
    inputWrite.value = "";
    outputWrite.value = "";
    astOutput.textContent = "";
    errorOutput.innerHTML = "";
  }

  convertButton.addEventListener("click", () => {
    const input = inputWrite.value.trim();
    outputWrite.value = "";
    astOutput.textContent = "";
    errorOutput.innerHTML = "";

    let results;
    switch (currentLanguage) {
      case "java":
        console.log("C results:", results);
        results = analyzeAndParseJava(input); // From JavaGUI.js
        break;
      case "python":
        results = analyzeAndParsePython(input); // From PythonGui.js
        break;
      case "c":
        results = window.analyzeAndParseC(input); // From CGUI.js
        console.log("C results:", results); //  <-- ADD THIS LINE (for debugging)
        window.displayOutput(results.lexOutput); //  These three lines
        window.displayAST(results.ast); //  are the ones
        window.displayErrors(results.errors);
        console.log("C results:", results);
        break;
      default:
        results = { lexOutput: "", ast: [], errors: [] };
    }

    displayOutput(results.lexOutput);
    displayAST(results.ast);
    displayErrors(results.errors);
  });

  function displayOutput(output) {
    outputWrite.value = output;
  }

  function displayAST(ast) {
    astOutput.innerHTML = "";
    const cleanAST = ast.filter((node) => !node.error);

    if (cleanAST.length > 0) {
      const pre = document.createElement("pre");
      pre.textContent = JSON.stringify(cleanAST, null, 2);
      pre.style.whiteSpace = "pre-wrap";
      astOutput.appendChild(pre);
    } else {
      astOutput.textContent = "No AST generated";
    }
  }

  function displayErrors(errors) {
    errorOutput.innerHTML = "";

    if (!errors || errors.length === 0) {
      errorOutput.innerHTML = "<p>No errors found</p>";
      return;
    }

    var syntaxErrors = [];
    var semanticErrors = [];

    for (var i = 0; i < errors.length; i++) {
      var error = errors[i];
      if (error.type === "syntax") {
        syntaxErrors.push(error.message);
      } else if (error.type === "semantic") {
        semanticErrors.push(error.message);
      }
    }

    if (syntaxErrors.length > 0) {
      var syntaxHeader = document.createElement("h3");
      syntaxHeader.textContent = "Syntax Errors";
      syntaxHeader.style.marginBottom = "10px";
      errorOutput.appendChild(syntaxHeader);
      addErrorItems(syntaxErrors);
    }

    if (semanticErrors.length > 0) {
      var semanticHeader = document.createElement("h3");
      semanticHeader.textContent = "Semantic Errors";
      semanticHeader.style.margin = "15px 0 10px 0";
      errorOutput.appendChild(semanticHeader);
      addErrorItems(semanticErrors);
    }

    function addErrorItems(errorList) {
      var container = document.createElement("div");
      container.style.marginLeft = "20px";

      for (var j = 0; j < errorList.length; j++) {
        var item = document.createElement("div");
        item.textContent = "• " + errorList[j];
        item.style.marginBottom = "8px";
        container.appendChild(item);
      }
      errorOutput.appendChild(container);
    }
  }

  function analyzeAndParseJava(x) {
    let lexOutput = "";
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
      prepMarker: 0,
    };
    let p = 0;
    let q = false;
    let inComment = false;
    let inMultilineComment = false;

    for (let i = 0; i < x.length; i++) {
      let ch = x.charAt(i);
      if (!q) {
        if (ch === "/" && i + 1 < x.length && x.charAt(i + 1) === "/") {
          inComment = true;
          i++;
          continue;
        } else if (ch === "/" && i + 1 < x.length && x.charAt(i + 1) === "*") {
          inMultilineComment = true;
          i++;
          continue;
        } else if (
          inMultilineComment &&
          ch === "*" &&
          i + 1 < x.length &&
          x.charAt(i + 1) === "/"
        ) {
          inMultilineComment = false;
          i++;
          p = i + 1;
          continue;
        } else if (inComment || inMultilineComment) {
          if (inComment && (ch === "\n" || ch === "\r")) {
            inComment = false;
            p = i + 1;
          }
          continue;
        }
      }

      if (
        !q &&
        !inComment &&
        !inMultilineComment &&
        ch === "#" &&
        (i === 0 || x.charAt(i - 1) === "\n" || x.charAt(i - 1) === "\r")
      ) {
        inPreprocessor = true;
        p = i;
        while (
          i + 1 < x.length &&
          x.charAt(i + 1) !== "\n" &&
          x.charAt(i + 1) !== "\r"
        ) {
          i++;
        }
        preprocessor[markers.prepMarker++] = x.substring(p, i + 1);
        tokens.push({ type: "preprocessor", value: x.substring(p, i + 1) });
        inPreprocessor = false;
        p = i + 1;
        continue;
      }

      if ((ch === '"' || ch === "'") && !inComment && !inMultilineComment) {
        if (q) {
          if (x.charAt(i - 1) !== "\\") {
            q = !q;
          }
        } else {
          q = !q;
        }
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
        processToken(
          x,
          p,
          i,
          keywords,
          constants,
          identifiers,
          tokens,
          markers
        );
        punctuators[markers.puncMarker++] = ".";
        tokens.push({ type: "punctuator", value: "." });
        p = i + 1;
        continue;
      }
      if (
        !q &&
        (isWhitespace(ch) || isPunctuation(x, i) || isOperatorChar(ch))
      ) {
        processToken(
          x,
          p,
          i,
          keywords,
          constants,
          identifiers,
          tokens,
          markers
        );
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
          p = i + 1;
        }
      }
    }

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
    lexOutput += "\n";
    lexOutput += display("Keywords    : \t", keywords, markers.keyMarker);
    lexOutput += "\n";
    lexOutput += display("Identifiers    :\t", identifiers, markers.idMarker);
    lexOutput += "\n";
    lexOutput += display("Operators    :\t", operators, markers.opMarker);
    lexOutput += "\n";
    lexOutput += display("Constants   :\t", constants, markers.consMarker);
    lexOutput += "\n";
    lexOutput += display("Punctuators:\t", punctuators, markers.puncMarker);
    lexOutput += "\n";
    lexOutput += display("Literals       :\t", literals, markers.litMarker);
    lexOutput += "\n";

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

    return {
      lexOutput: lexOutput,
      ast: ast,
      errors: parser.errors,
    };
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
    let output = name;
    const unique = [];
    for (let i = 0; i < mark; i++) {
      if (arr[i] && !unique.includes(arr[i])) {
        unique.push(arr[i]);
      }
    }
    output += unique.join(", ");
    output += "\n";
    return output;
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
    const punctuators = ";:,!?[]{}()";
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
          if (this.tokens.length > 0) {
            this.addError(
              `Unrecognized token: ${this.tokens[0]?.value}`,
              ErrorType.SYNTAX,
              this.tokens[0]?.loc
            );
            this.tokens.shift();
          }
        }
      }
      return ast;
    }

    parseStatement() {
      if (this.tokens.length === 0) return null;

      if (this.isClassDeclaration(this.tokens))
        return this.parseClassDeclaration();
      if (this.isMethodDeclaration(this.tokens))
        return this.parseMethodDeclaration();
      if (this.isLoopKeyword(this.tokens[0]))
        return this.parseLoop(this.tokens[0].value);
      if (this.isAssignment(this.tokens)) return this.parseAssignment();
      if (this.isIfKeyword(this.tokens[0])) return this.parseIfStatement();
      if (this.isMethodCall(this.tokens)) return this.parseMethodCall();
      if (this.isDeclaration(this.tokens)) return this.parseDeclaration();
      if (this.isSwitchKeyword(this.tokens[0]))
        return this.parseSwitchStatement();
      if (["break", "continue", "return"].includes(this.tokens[0]?.value))
        return this.parseExitStatement();

      const expr = this.parseExpression();
      return expr;
    }

    parseClassDeclaration() {
      let modifier = null;
      if (["public", "private"].includes(this.tokens[0]?.value)) {
        modifier = this.tokens.shift().value;
      }

      if (!this.consumeToken("class", "Expected class keyword")) {
        return null;
      }

      if (this.tokens[0]?.type !== "identifier") {
        this.addError("Expected class name", ErrorType.SYNTAX);
        return null;
      }
      const className = this.tokens.shift().value;

      if (!this.consumeToken("{", "Expected { after class name")) {
        return null;
      }

      const body = [];
      this.pushScope();

      while (this.tokens.length > 0 && this.tokens[0]?.value !== "}") {
        if (this.isMethodDeclaration(this.tokens)) {
          const method = this.parseMethodDeclaration();
          if (method) body.push(method);
        } else {
          const stmt = this.parseStatement();
          if (stmt) body.push(stmt);
        }
      }

      this.popScope();
      if (!this.consumeToken("}", "Expected } to close class declaration")) {
        return null;
      }

      return { type: "ClassDeclaration", modifier, name: className, body };
    }

    parseMethodDeclaration() {
      const modifiers = [];
      while (
        this.tokens.length > 0 &&
        ["public", "private", "static"].includes(this.tokens[0]?.value)
      ) {
        modifiers.push(this.tokens.shift().value);
      }

      if (
        this.tokens[0]?.type !== "keyword" &&
        this.tokens[0]?.type !== "identifier"
      ) {
        this.addError("Expected return type", ErrorType.SYNTAX);
        return null;
      }
      const returnType = this.tokens.shift().value;

      if (this.tokens[0]?.type !== "identifier") {
        this.addError("Expected method name", ErrorType.SYNTAX);
        return null;
      }
      const methodName = this.tokens.shift().value;

      if (!this.consumeToken("(", "Expected ( after method name")) {
        return null;
      }

      const parameters = [];
      while (this.tokens.length > 0 && this.tokens[0]?.value !== ")") {
        if (
          this.tokens[0]?.type === "keyword" ||
          (this.tokens[0]?.type === "identifier" &&
            this.dataType(this.tokens[0]?.value))
        ) {
          const paramType = this.tokens.shift().value;
          if (this.tokens[0]?.type !== "identifier") {
            this.addError("Expected parameter name", ErrorType.SYNTAX);
            break;
          }
          const paramName = this.tokens.shift().value;

          let isArray = false;
          if (this.tokens[0]?.value === "[" && this.tokens[1]?.value === "]") {
            isArray = true;
            this.tokens.shift();
            this.tokens.shift();
          }

          parameters.push({ type: paramType, name: paramName, isArray });

          if (this.tokens[0]?.value === ",") {
            this.tokens.shift();
          }
        } else {
          this.addError("Invalid parameter", ErrorType.SYNTAX);
          break;
        }
      }

      if (!this.consumeToken(")", "Expected ) after parameters")) {
        return null;
      }

      const body = this.parseBlock();

      return {
        type: "MethodDeclaration",
        modifiers,
        returnType,
        name: methodName,
        parameters,
        body,
      };
    }

    parseAssignment() {
      let keyword;
      if (this.tokens[0]?.type === "keyword") {
        keyword = this.tokens.shift();
      }
      const identifier = this.tokens.shift();
      const op = this.tokens.shift();
      let error = null;
      let value = null;

      if (!op || op.value !== "=") {
        error = this.addError(
          `Invalid assignment syntax: Expected '=' after identifier '${identifier?.value}'instead of '${op?.value}'`,
          ErrorType.SYNTAX,
          op?.loc || identifier?.loc
        );
      } else {
        value = this.tokens.shift();
      }
      this.consumeSemicolon(
        `Missing semicolon after assignment of '${identifier.value}'`
      );

      if (keyword && !this.declareVariable(identifier.value, keyword.value)) {
        if (error === null && identifier) {
          error = this.addError(
            `Variable '${identifier.value}' already declared`,
            ErrorType.SEMANTIC,
            this.tokens[0]?.loc
          );
        }
      }

      if (!this.lookupVariable(identifier.value)) {
        if (identifier) {
          this.addError(
            `Variable '${identifier.value}' is not declared.`,
            ErrorType.SEMANTIC,
            this.tokens[0]?.loc
          );
        }
      }

      const variable = this.lookupVariable(identifier.value);
      const parsedValue = this.parseLiteralOrExpression(value);

      if (
        variable &&
        parsedValue &&
        !this.isValidAssignment(parsedValue, variable.type)
      ) {
        if (value) {
          this.addError(
            `Error mismatch: cannot assign ${parsedValue.dataType} to ${variable.type}`,
            ErrorType.SEMANTIC
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
      return assignmentNode;
    }

    parseDeclaration() {
      const keyword = this.tokens.shift();
      const identifier = this.tokens.shift();

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

    parseExpression() {
      let left = this.parseLiteralOrExpression(this.tokens.shift());
      if (!left) return null;

      while (this.tokens.length > 0 && this.tokens[0].type === "operator") {
        const op = this.tokens.shift();
        const right = this.parseLiteralOrExpression(this.tokens.shift());
        if (!right) return null;

        if (op.value === "+") {
          if (left.dataType === "String" || right.dataType === "String") {
            left = {
              type: "BinaryExpression",
              left: left,
              operator: op.value,
              right: right,
              dataType: "String",
            };
            continue;
          }
        }
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

    parseLiteralOrExpression(token) {
      if (!token) return { error: "Missing token in expression" };

      const typeKeywords = [
        "int",
        "float",
        "char",
        "boolean",
        "String",
        "double",
      ];
      if (token.type === "keyword" && typeKeywords.includes(token.value)) {
        this.addError(
          `Unexpected token inside expression '${token.value}'.`,
          ErrorType.SEMANTIC,
          token.loc
        );
        return { error: "Invalid declaration in expression" };
      }

      if (token.type === "constant") {
        if (isInteger(token.value))
          return { type: "Constant", value: token.value, dataType: "int" };
        if (isFloat(token.value))
          return { type: "Float", value: token.value, dataType: "float" };
        return { error: `Invalid constant: ${token.value}` };
      }

      if (token.type === "literal") {
        if (token.value.startsWith('"') && token.value.endsWith('"')) {
          return { type: "Literal", value: token.value, dataType: "String" };
        } else if (
          token.value.startsWith("'") &&
          token.value.endsWith("'") &&
          token.value.length === 3
        ) {
          return {
            type: "Literal",
            value: token.value.charAt(1),
            dataType: "char",
          };
        } else {
          return { error: `Invalid literal: ${token.value}` };
        }
      }

      if (token.type === "identifier") {
        const variable = this.lookupVariable(token.value);
        if (!variable) {
          return this.addError(
            `Variable '${token.value}' is not declared.`,
            ErrorType.SEMANTIC,
            this.tokens[0]?.loc
          );
        }
        if (!variable.assigned) {
          this.addError(
            `Variable '${token.value}' is used before being assigned a value.`,
            ErrorType.SEMANTIC,
            this.tokens[0]?.loc
          );
        }
        return {
          type: "Variable",
          value: token.value,
          dataType: variable.type,
        };
      }
    }

    parseIfStatement(context = "if") {
      if (!this.isIfKeyword(this.tokens[0])) {
        return null;
      }
      this.tokens.shift();

      if (!this.consumeToken("(", "Expected '(' after 'if'")) {
        return null;
      }

      const condition = this.parseCondition();
      if (!condition) {
        return null;
      }

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
        this.tokens.shift();
        if (this.isIfKeyword(this.tokens[0])) {
          const elseIfNode = this.parseIfStatement("else if");
          if (elseIfNode) {
            elseIfBranches.push(elseIfNode);
          }
        } else {
          const elseBlock = this.parseBlock();
          if (elseBlock) ifNode.elseBranch = elseBlock;
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
      const savedTokens = [...this.tokens];

      // Try to parse a binary expression like i % 2
      let left = null;

      // Check for simple cases first (identifier or constant)
      if (
        this.tokens[0]?.type === "identifier" ||
        this.tokens[0]?.type === "constant" ||
        this.tokens[0]?.type === "literal"
      ) {
        const leftToken = this.tokens.shift();
        left = this.parseLiteralOrExpression(leftToken);

        // Check if the next token might be part of a binary expression (e.g., %)
        if (
          this.tokens[0]?.type === "operator" &&
          "+-*/%".includes(this.tokens[0]?.value)
        ) {
          // Put the token back
          this.tokens.unshift(leftToken);
          // Reset and try to parse as expression
          left = this.parseSimpleExpression();
        }
      } else {
        // If not a simple case, try to parse as expression
        left = this.parseSimpleExpression();
      }

      if (!left || left.error) {
        // If parsing failed, restore tokens and try another approach
        this.tokens = savedTokens;
        const leftToken = this.tokens.shift();
        left = this.parseLiteralOrExpression(leftToken);
      }

      if (!left || left.error) return null;

      // Get the operator
      const operatorToken = this.tokens.shift();
      if (!this.isValidComparisonOperator(operatorToken?.value)) {
        this.addError(
          `Invalid comparison operator '${operatorToken?.value}' in condition`,
          ErrorType.SYNTAX,
          operatorToken?.loc
        );
        return null;
      }

      // Parse right side - using similar approach as left side
      let right = null;

      if (
        this.tokens[0]?.type === "identifier" ||
        this.tokens[0]?.type === "constant" ||
        this.tokens[0]?.type === "literal"
      ) {
        const rightToken = this.tokens.shift();
        right = this.parseLiteralOrExpression(rightToken);

        if (
          this.tokens[0]?.type === "operator" &&
          "+-*/%".includes(this.tokens[0]?.value)
        ) {
          this.tokens.unshift(rightToken);
          right = this.parseSimpleExpression();
        }
      } else {
        right = this.parseSimpleExpression();
      }

      if (!right || right.error) {
        // If parsing failed, fall back to simple token
        const rightToken = this.tokens.shift();
        right = this.parseLiteralOrExpression(rightToken);
      }

      if (!right || right.error) return null;

      // Perform semantic analysis
      this.semanticCons(left, right, operatorToken?.value);

      return { type: "Condition", left, operator: operatorToken?.value, right };
    }

    parseSimpleExpression() {
      if (this.tokens.length < 3) return null;

      const leftToken = this.tokens.shift();
      const left = this.parseLiteralOrExpression(leftToken);
      if (!left || left.error) {
        this.tokens.unshift(leftToken); // Put token back
        return null;
      }

      if (
        this.tokens[0]?.type !== "operator" ||
        !"+-*/%".includes(this.tokens[0]?.value)
      ) {
        this.tokens.unshift(leftToken); // Put token back
        return null;
      }

      const op = this.tokens.shift();
      const rightToken = this.tokens.shift();
      const right = this.parseLiteralOrExpression(rightToken);

      if (!right || right.error) {
        // Restore tokens if parsing fails
        this.tokens.unshift(rightToken);
        this.tokens.unshift(op);
        this.tokens.unshift(leftToken);
        return null;
      }

      return {
        type: "BinaryExpression",
        left: left,
        operator: op.value,
        right: right,
        dataType: left.dataType,
      };
    }

    parseBlock() {
      if (!this.consumeToken("{", "Expected '{'")) return null;

      this.pushScope();
      const statements = [];

      while (this.tokens.length > 0 && this.tokens[0]?.value !== "}") {
        // First check for specific statement types
        if (this.isLoopKeyword(this.tokens[0])) {
          const loopStatement = this.parseLoop(this.tokens[0].value);
          if (loopStatement) statements.push(loopStatement);
          else
            this.addError("Failed to parse loop statement", ErrorType.SYNTAX);
        } else if (this.isIfKeyword(this.tokens[0])) {
          const ifStatement = this.parseIfStatement();
          if (ifStatement) statements.push(ifStatement);
          else this.addError("Failed to parse if statement", ErrorType.SYNTAX);
        }
        // Check for method calls (object.method())
        else if (this.isMethodCall(this.tokens)) {
          const methodCall = this.parseMethodCall();
          if (methodCall) statements.push(methodCall);
          else this.addError("Failed to parse method call", ErrorType.SYNTAX);
        }
        // Check for assignments with type declarations (int x = 5)
        else if (this.isAssignment(this.tokens)) {
          const assignment = this.parseAssignment();
          if (assignment) statements.push(assignment);
          else this.addError("Failed to parse assignment", ErrorType.SYNTAX);
        }
        // Check for increment/decrement operations (x++ or ++x)
        else if (
          this.tokens.length >= 2 &&
          this.tokens[0]?.type === "identifier" &&
          (this.tokens[1]?.value === "++" || this.tokens[1]?.value === "--")
        ) {
          const iteration = this.parseIteration();
          if (iteration) {
            statements.push(iteration);
            this.consumeSemicolon(
              "Expected semicolon after increment/decrement"
            );
          }
        }
        // Try to parse as a general expression
        else if (this.tokens.length > 0) {
          // Handle empty statements (just a semicolon)
          if (this.tokens[0]?.value === ";") {
            this.tokens.shift();
            continue;
          }

          try {
            const expr = this.parseStatement();
            if (expr) statements.push(expr);
          } catch (e) {
            this.addError(
              `Error parsing statement: ${e.message}`,
              ErrorType.SYNTAX
            );
            while (
              this.tokens.length > 0 &&
              this.tokens[0]?.value !== ";" &&
              this.tokens[0]?.value !== "}"
            ) {
              this.tokens.shift();
            }
            if (this.tokens[0]?.value === ";") this.tokens.shift();
          }
        }
      }
      if (this.tokens.length === 0) {
        this.addError("Unclosed block: Missing '}'", ErrorType.SYNTAX);
      } else {
        this.tokens.shift(); // Consume '}'
      }

      this.popScope();
      return statements;
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

      if (
        !this.consumeToken("(", `Expected '(' after method name '${method}'`)
      ) {
        return null;
      }

      let args = [];
      while (this.tokens.length > 0 && this.tokens[0].value !== ")") {
        const parsedArg = this.parseExpression();
        args.push(parsedArg);

        if (this.tokens[0]?.value === ",") this.tokens.shift();
      }

      if (this.tokens.length === 0) {
        this.addError(
          "Unclosed method call: Missing ')'",
          ErrorType.SYNTAX,
          this.tokens[0]?.loc
        );
        return { type: "MethodCall", object, method, arguments: args };
      }

      this.tokens.shift();

      if (this.tokens.length > 0) {
        this.consumeSemicolon(
          `Missing semicolon after method call to ${object}.${method}`
        );
      }

      const methodCall = {
        type: "MethodCall",
        object,
        method,
        arguments: args,
      };

      this.analyzeMethodCallArguments(methodCall);
      return methodCall;
    }

    parseLoop(loopType) {
      if (loopType === "do") {
        this.tokens.shift(); // Consume 'do'
        const body = this.parseBlock();
        if (!body) {
          this.addError(
            "Invalid body in do-while loop",
            ErrorType.SYNTAX,
            this.tokens[0]?.loc
          );
          return null;
        }

        if (!this.consumeToken("while", "Expected 'while' after do block"))
          return null;

        if (!this.consumeToken("(", "Expected '(' after 'while'")) return null;

        const condition = this.parseCondition();
        if (!condition) {
          this.addError(
            "Invalid condition in do-while loop",
            ErrorType.SYNTAX,
            this.tokens[0]?.loc
          );
          return null;
        }

        if (
          !this.consumeToken(
            ")",
            "Expected ')' after condition in do-while loop"
          )
        )
          return null;

        this.consumeSemicolon("Missing semicolon after do-while loop");
        return { type: "DoWhileLoop", condition, body };
      } else if (loopType === "while") {
        this.tokens.shift(); // Consume 'while'
        if (!this.consumeToken("(", "Expected '(' after 'while'")) return null;

        const condition = this.parseCondition();
        if (!condition) {
          this.addError("Invalid condition in while loop", ErrorType.SYNTAX);
          return null;
        }

        if (
          !this.consumeToken(")", "Expected ')' after condition in while loop")
        )
          return null;

        const body = this.parseBlock();
        if (!body) {
          this.addError(
            "Invalid body in while loop",
            ErrorType.SYNTAX,
            this.tokens[0]?.loc
          );
          return null;
        }

        return { type: "WhileLoop", condition, body };
      } else if (loopType === "for") {
        this.tokens.shift(); // Consume 'for'
        if (!this.consumeToken("(", "Expected '(' after 'for'")) return null;

        let init;
        if (this.isAssignment(this.tokens)) {
          init = this.parseAssignment();
        } else {
          if (
            this.tokens.length >= 3 &&
            this.tokens[0]?.type === "identifier" &&
            this.tokens[1]?.value === "="
          ) {
            const identifier = this.tokens.shift().value;
            this.tokens.shift(); // consume =
            const valueToken = this.tokens.shift();
            const value = this.parseLiteralOrExpression(valueToken);
            this.assignVariable(identifier);
            init = { type: "Assignment", identifier: identifier, value: value };
            if (
              !this.consumeToken(
                ";",
                "Expected ';' after initialization in for loop"
              )
            )
              return null;
          } else {
            while (this.tokens.length > 0 && this.tokens[0].value !== ";") {
              this.tokens.shift();
            }
            init = { type: "EmptyStatement" };
            if (
              !this.consumeToken(
                ";",
                "Expected ';' after initialization in for loop"
              )
            )
              return null;
          }
        }

        let condition;
        if (this.tokens[0]?.value === ";") {
          condition = { type: "EmptyStatement" };
          this.tokens.shift(); // Consume ';'
        } else {
          condition = this.parseCondition();
          if (
            !this.consumeToken(";", "Expected ';' after condition in for loop")
          )
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
          this.addError(
            "Invalid body in for loop",
            ErrorType.SYNTAX,
            this.tokens[0]?.loc
          );
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
      if (!this.consumeToken(")", "Expected ) after switch expression"))
        return null;
      if (!this.consumeToken("{", "Expected { after switch expression"))
        return null;

      const cases = [];
      let defaultCase = null;

      while (this.tokens.length > 0 && this.tokens[0]?.value !== "}") {
        if (this.tokens[0]?.value === "case") {
          this.tokens.shift(); // Consume 'case'
          const condition = this.parseExpression();
          if (!condition) return null;
          if (!this.consumeToken(":", "Expected : after case condition"))
            return null;

          const body = [];
          while (
            this.tokens.length > 0 &&
            this.tokens[0]?.value !== "case" &&
            this.tokens[0]?.value !== "default" &&
            this.tokens[0]?.value !== "}"
          ) {
            const statement = this.parseStatement();
            if (!statement) return null;
            body.push(statement);
          }
          cases.push({ type: "CaseStatement", condition, body });
        } else if (this.tokens[0]?.value === "default") {
          this.tokens.shift(); // Consume 'default'
          if (!this.consumeToken(":", "Expected : after default keyword"))
            return null;

          const body = [];
          while (
            this.tokens.length > 0 &&
            this.tokens[0]?.value !== "case" &&
            this.tokens[0]?.value !== "default" &&
            this.tokens[0]?.value !== "}"
          ) {
            const statement = this.parseStatement();
            if (!statement) return null;
            body.push(statement);
          }
          defaultCase = { type: "DefaultStatement", body };
        } else {
          this.addError(
            "Invalid statement inside switch block",
            ErrorType.SYNTAX
          );
          return null;
        }
      }

      if (!this.consumeToken("}", "Expected } to close switch statement"))
        return null;

      return { type: "SwitchStatement", expression, cases, defaultCase };
    }

    parseExitStatement() {
      const statementType = this.tokens[0].value;
      this.tokens.shift(); // Consume 'break', 'continue', or 'return'
      let value = null;
      // For return statements, we might have a return value
      if (statementType === "return" && this.tokens[0]?.value !== ";")
        value = this.parseExpression();

      this.consumeSemicolon(`Expected semicolon after ${statementType}`);

      if (statementType === "break") {
        return { type: "BreakStatement" };
      } else if (statementType === "continue") {
        return { type: "ContinueStatement" };
      } else {
        return { type: "ReturnStatement", value };
      }
    }

    isValidComparisonOperator(op) {
      const validOperators = ["==", "!=", "<", ">", "<=", ">="];
      return validOperators.includes(op);
    }

    isValidAssignment(value, expectedType) {
      if (value.type === "Variable") return value.dataType === expectedType;
      if (expectedType === "int") return isInteger(value.value);
      if (expectedType === "float") return isFloat(value.value);
      if (expectedType === "String") return value.dataType === "String";
      if (expectedType === "boolean")
        return value.value === "true" || value.value === "false";
      if (expectedType === "char") return value.dataType === "char";
      if (expectedType === "void") return false;
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
        token?.type === "keyword" &&
        ["for", "while", "do"].includes(token?.value)
      );
    }

    isIfKeyword(token) {
      return token?.type === "keyword" && token?.value === "if";
    }

    isExitStatement(token) {
      return (
        token?.type === "keyword" &&
        ["break", "continue", "return"].includes(token?.value)
      );
    }

    isMethodCall(tokens) {
      if (tokens.length < 3) return false;

      // Simple case: identifier followed by (
      if (tokens[0]?.type === "identifier" && tokens[1]?.value === "(")
        return true;

      // More complex case: identifier.identifier...( pattern
      let i = 0;
      if (tokens[i]?.type !== "identifier") return false;

      i++;
      while (i < tokens.length - 1) {
        if (tokens[i]?.value === ".") {
          i++;
          if (tokens[i]?.type === "identifier") {
            i++;
            if (tokens[i]?.value === "(") {
              return true;
            }
          } else {
            return false;
          }
        } else if (tokens[i]?.value === "(") {
          return true;
        } else {
          return false;
        }
      }
      return false;
    }

    isClassDeclaration(tokens) {
      return (
        (tokens.length >= 1 && tokens[0]?.value === "class") ||
        (tokens.length >= 2 &&
          ["public", "private"].includes(tokens[0]?.value) &&
          tokens[1]?.value === "class")
      );
    }

    isMethodDeclaration(tokens) {
      let i = 0;
      while (
        i < tokens.length &&
        ["public", "private", "static"].includes(tokens[i]?.value)
      ) {
        i++;
      }

      if (
        i < tokens.length &&
        (tokens[i]?.type === "keyword" || tokens[i]?.type === "identifier")
      ) {
        i++;
      } else {
        return false;
      }

      if (i < tokens.length && tokens[i]?.type === "identifier") {
        i++;
      } else {
        return false;
      }
      return i < tokens.length && tokens[i]?.value === "(";
    }

    isSwitchKeyword(token) {
      return token?.type === "keyword" && token.value === "switch";
    }

    consumeSemicolon(context = "statement", identifier = null) {
      if (
        this.tokens.length > 0 &&
        this.tokens[0]?.type === "punctuator" &&
        this.tokens[0]?.value === ";"
      ) {
        this.tokens.shift();
      } else {
        const name = identifier ? ` '${identifier}'` : "";
        this.addError(
          `Error: ${context}${name}`,
          ErrorType.SYNTAX,
          this.tokens[0]?.loc
        );
      }
    }

    consumeToken(expectedToken, errorMessage) {
      if (this.tokens.length > 0 && this.tokens[0]?.value === expectedToken) {
        this.tokens.shift();
        return true;
      } else {
        this.addError(errorMessage, ErrorType.SYNTAX, this.tokens[0]?.loc);
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
        this.addError(
          `Variable '${identifier}' already declared in this scope.`,
          ErrorType.SEMANTIC
        );
        return false;
      }
      currentScope[identifier] = {
        type,
        declared: true,
        assigned: false,
        assignments: [],
      };
      return true;
    }

    assignVariable(identifier) {
      for (let i = this.symbolTable.length - 1; i >= 0; i--) {
        if (this.symbolTable[i][identifier]) {
          this.symbolTable[i][identifier].assigned = true;
          return;
        }
      }
      this.addError(
        `Variable '${identifier}' is not declared.`,
        ErrorType.SEMANTIC
      );
    }

    dataType(token) {
      const types = ["int", "float", "char", "String", "boolean"];
      return types.includes(token);
    }

    lookupVariable(identifier) {
      for (let i = this.symbolTable.length - 1; i >= 0; i--) {
        if (this.symbolTable[i][identifier]) {
          return this.symbolTable[i][identifier];
        }
      }
      return null;
    }

    addError(message, type = ErrorType.SYNTAX, location = null) {
      this.errors.push({ message, type, loc: location });
      return { error: message };
    }

    handleParsedStatement(statement, errorMessage, statements) {
      if (statement) {
        if (statement.error) {
          this.addError(statement.error, ErrorType.SYNTAX);
          return;
        }
        statements.push(statement);
      } else {
        this.addError(errorMessage, ErrorType.SYNTAX);
      }
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

    semanticCons(left, right, operator) {
      if (left?.type === "Variable") {
        const varInfo = this.lookupVariable(left.value);
        if (!varInfo) {
          this.addError(
            `Variable '${left.value}' in condition is not declared`,
            ErrorType.SEMANTIC
          );
        } else {
          left.dataType = varInfo.type;
          if (!varInfo.assigned) {
            this.addError(
              `Variable '${left.value}' used in before being assigned a value.`,
              ErrorType.SEMANTIC
            );
          }
        }
      }
      if (right?.type === "Variable") {
        const varInfo = this.lookupVariable(right.value);
        if (!varInfo) {
          this.addError(
            `Variable '${right.value}' in condition is not declared`,
            ErrorType.SEMANTIC
          );
        } else {
          right.dataType = varInfo.type;
          if (!varInfo.assigned) {
            this.addError(
              `Variable '${right.value}' used in condition before assignment.`,
              ErrorType.SEMANTIC
            );
          }
        }
      }
      if (left?.type === "Variable" && right?.type === "Literal") {
        if (!this.isValidAssignment(right, left.dataType)) {
          this.addError(
            `Invalid comparison: '${right.value}' does not match type '${left.dataType}' of '${left.value}'`,
            ErrorType.SEMANTIC
          );
        }
      }
      if (left?.type === "Literal" && right?.type === "Variable") {
        if (!this.isValidAssignment(left, right.dataType)) {
          this.addError(
            `Invalid comparison: '${left.value}' does not match type '${right.dataType}' of '${right.value}'`,
            ErrorType.SEMANTIC
          );
        }
      }
      if (left?.type === "Variable" && right?.type === "Variable") {
        if (left.dataType !== right.dataType) {
          this.addError(
            `Type mismatch in condition: ' ${left.dataType}' to '${right.dataType}' comparison. ''`,
            ErrorType.SEMANTIC
          );
        }
      }

      const comparisons = [
        ["int", "int"],
        ["float", "float"],
        ["int", "float"],
        ["float", "int"],
        ["boolean", "boolean"],
        ["char", "char"],
        ["String", "String"],
      ];
      if (
        left?.dataType &&
        right?.dataType &&
        !comparisons.some(
          ([a, b]) => a === left.dataType && b === right.dataType
        )
      ) {
        this.addError(
          `Datatypes mismatch: '${left.dataType}' and '${right.dataType}' in condition`,
          ErrorType.SEMANTIC
        );
      }
      if (operator === "=") {
        this.addError(`Invalid operator '=' in condition`, ErrorType.SEMANTIC);
      }

      if (
        operator === "==" &&
        left.dataType === "String" &&
        right.dataType === "String"
      ) {
        this.addError(`Invalid comparison in condition`, ErrorType.SEMANTIC);
      }

      if (["+", "-", "*", "/"].includes(operator)) {
        this.addError(`Invalid comparison in condition`, ErrorType.SEMANTIC);
      }

      if (
        (left.dataType === "boolean" && right.dataType !== "boolean") ||
        (right.dataType === "boolean" && left.dataType !== "boolean")
      ) {
        this.addError(
          `Invalid comparison between the datatypes in condition`,
          ErrorType.SEMANTIC
        );
      }

      if (
        (left.dataType === "char" && right.dataType === "String") ||
        (left.dataType === "String" && right.dataType === "char")
      ) {
        this.addError(
          `Invalid comparison between the datatypes in condition`,
          ErrorType.SEMANTIC
        );
      }

      if (left.type === "Literal" && right.type === "Literal") {
        this.addError(`infinite comparison in condition`, ErrorType.SEMANTIC);
      }
    }
  }
  window.analyzeAndParseJava = analyzeAndParseJava;
});
