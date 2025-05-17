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

    console.log(`Language set to: ${lang}`);
  }

  languageButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      setLanguage(btn.dataset.lang);
      clearOutput();
    });
  });

  function clearOutput() {
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
        window.displayOutput(results.lexOutput); //  These three lines
        window.displayAST(results.ast); //  are the ones
        window.displayErrors(results.errors);
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

    function isDigit(ch) {
      return ch >= '0' && ch <= '9';
    }

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

      if (!q && isDigit(ch)) {
        let numStr = ch;
        let j = i + 1;
        let hasDecimal = false;
        while (j < x.length && (isDigit(x.charAt(j)) || x.charAt(j) === '.')) {
          if (x.charAt(j) === '.') {
          if (hasDecimal) break;
            hasDecimal = true;
          }
          numStr += x.charAt(j);
          j++;
        }
        i = j - 1;
        const tokenType = "constant";
        constants[markers.consMarker++] = numStr;
        tokens.push({ type: tokenType, value: numStr });
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
          ["?", "[", "]"].includes(token.value)
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

  function processToken(x, start, end, keywords, constants, identifiers, tokens, markers) 
  {
    if (start !== end) 
    {
      let token = x.substring(start, end).trim();
      if (token) 
      {
        if (isKeyword(token)) 
        {
          keywords[markers.keyMarker++] = token;
          tokens.push({ type: "keyword", value: token });
        } 
        else if (token === "true" || token === "false") 
        {
          tokens.push({ type: "literal", value: token, dataType: "boolean" });
        } 
        else if (isConstant(token))
        {
          constants[markers.consMarker++] = token;
          tokens.push({ type: "constant", value: token });
        } 
        else 
        {
          identifiers[markers.idMarker++] = token;
          tokens.push({ type: "identifier", value: token });
        }
      }
    }
  }

  function display(name, arr, mark) 
  {
    let output = name;
    const unique = [];
    for (let i = 0; i < mark; i++) 
    {
      if (arr[i] && !unique.includes(arr[i])) 
      {
        unique.push(arr[i]);
      }
    }
    output += unique.join(", ");
    output += "\n";
    return output;
  }

  function isKeyword(key) 
  {
    const keywords = ["boolean", "break", "case", "char", "class", "default", "do", "else", "float", "for", "if", "import", "int", "new", "private", "public", "return", "static", "switch", "void", "while", "String", "length", "continue", "else if", "else"];
    return keywords.includes(key);
  }

  function isConstant(cons) 
  {
    return isInteger(cons) || isFloat(cons);
  }

  function isInteger(str) 
  {
    if (str.length === 0) return false;
    for (let i = 0; i < str.length; i++) {
        const ch = str.charAt(i);
        if (ch < '0' || ch > '9') return false;
    }
    return true;
  }

function isFloat(str) {
    let point = 0;
    if (str.length === 0) return false;

    for (let i = 0; i < str.length; i++) {
        const ch = str.charAt(i);
        if (ch === '.') {
            if (point === 1) return false;
            point = 1;
        } else if (ch < '0' || ch > '9') {
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
    return operators.includes(op);
  }

  function isOperatorChar(ch) {
    return "+-*/=%<>!&|".includes(ch);
  }

  function isPunctuation(code, index) {
    let ch = code.charAt(index);
    const punctuators = ";:,?[]{}()";
    if (punctuators.includes(ch)) {
      return true;
    }
    return false;
  }

  function isWhitespace(ch) {
    return /\s/.test(ch);
  }

  /**
   * Parser class for analyzing and validating programming language syntax and semantics.
   * Takes tokens from a lexer and builds an Abstract Syntax Tree (AST) while checking for errors.
   */
  class Parser 
  {
    /**
     * Initializes the parser with tokens from a lexer
     * @param {Array} tokens - Array of token objects containing type, value, and location info
     */
    constructor(tokens) 
    {
      this.tokens = tokens.filter((token) => token.value.trim() !== ""); // Filters out whitespace tokens
      this.symbolTable = [{}]; // Stack of symbol tables for different nested scopes
      this.errors = []; // Collects syntax and semantic errors during parsing
    }

    /**
     * Main parsing method - processes all tokens and builds complete AST
     * @returns {Array} - Array of AST nodes representing the program structure
     */
    parse() 
    {
      const ast = []; // Initialize empty Abstract Syntax Tree
      while (this.tokens.length > 0) // Process tokens until none remain
      {
        const statement = this.parseStatement(); // Parse next statement
        if (statement) 
        {
          if (statement.error) 
          {
            this.addError(statement.error, ErrorType.SYNTAX); // Record any syntax errors
            this.synchronize(); // Skip ahead to a safe point to resume parsing
          }
          ast.push(statement); // Add parsed statement to AST
        } 
        else 
        {
          if (this.tokens.length > 0) 
          {
            this.addError(`Unrecognized token: ${this.tokens[0]?.value}`, ErrorType.SYNTAX, this.tokens[0]?.loc); // Handle unrecognized tokens
            this.synchronize(); // Skip ahead to recover from error
          }
        }
      }
      return ast;
    }

    /**
     * Error recovery method - skips tokens until a safe point to resume parsing
     * Looks for statement boundaries like semicolons or certain keywords
     */
    synchronize() 
    {
      let braceDepth = 0; // Tracks nested brace depth to maintain structure

      while (this.tokens.length > 0) 
      {
        const token = this.tokens[0];

        if (token.value === "{") 
        {
          braceDepth++; // Track entering a nested block
          this.tokens.shift()
        } 
        else if (token.value === "}") 
        {
          if (braceDepth === 0) 
          {
            break;
          }
          braceDepth--; // Exit from a nested block
          this.tokens.shift(); // Consume closing brace if at top level
        }
        else if (braceDepth === 0 &&
          (token.value === ";" || ["if", "for", "while", "class", "switch", "return", "break", "continue"].includes(token.value))) //Statement end for ; or Start of new statement
        {
          break; // Stop at statement boundary to resume parsing
        }
        else
        {
          this.tokens.shift(); // Skip current token and continue
        }
        
      }
    }

    /**
     * Main statement dispatcher - determines the type of statement and calls the appropriate parser
     * @returns {Object|null} - AST node for the statement or null if no valid statement found
     */
    parseStatement()
    {
      if (this.tokens.length === 0) return null;

      // Check for different statement types and dispatch to specialized parsers
      if (this.isClassDeclaration(this.tokens)) return this.parseClassDeclaration();
      if (this.isMethodDeclaration(this.tokens)) return this.parseMethodDeclaration();
      if (this.isLoopKeyword(this.tokens[0])) return this.parseLoop(this.tokens[0].value);
      if (this.isAssignment(this.tokens)) return this.parseAssignment();
      if (this.isIfKeyword(this.tokens[0])) return this.parseIfStatement();
      if (this.isMethodCall(this.tokens)) return this.parseMethodCall();
      if (this.isDeclaration(this.tokens)) return this.parseDeclaration();
      if (this.isSwitchKeyword(this.tokens[0])) return this.parseSwitchStatement();
      if (["break", "continue", "return"].includes(this.tokens[0]?.value)) return this.parseExitStatement();

      // If no specialized statement, try to parse as a general expression
      const expr = this.parseExpression();
      return expr;
    }

    /**
     * Parses a class declaration (e.g., "public class MyClass { ... }")
     * @returns {Object|null} - Class declaration AST node or null if invalid
     */
    parseClassDeclaration() 
    {
      // Check for access modifier (public/private)
      let modifier = null;
      if (["public", "private"].includes(this.tokens[0]?.value)) 
      {
        modifier = this.tokens.shift().value;
      }

      // Expect "class" keyword
      if (!this.consumeToken("class", "Expected class keyword")) 
      {
        this.synchronize(); // Recover from error
        return null;
      }

      // Expect class name
      if (this.tokens[0]?.type !== "identifier") 
      {
        this.addError("Expected class name", ErrorType.SYNTAX);
        this.synchronize();
        return null;
      }
      const className = this.tokens.shift().value;

      // Expect opening brace
      if (!this.consumeToken("{", "Expected { after class name")) 
      {
        this.synchronize();
        return null;
      }

      const body = [];
      this.pushScope(); // Create new scope for class members

      // Parse class body (methods and properties)
      while (this.tokens.length > 0 && this.tokens[0]?.value !== "}") 
      {
        if (this.isMethodDeclaration(this.tokens)) 
        {
          const method = this.parseMethodDeclaration();
          if (method) body.push(method);
        } 
        else 
        {
          const stmt = this.parseStatement();
          if (stmt) body.push(stmt);
        }
      }

      this.popScope(); // Exit class scope
      
      // Expect closing brace
      if (!this.consumeToken("}", "Expected } to close class declaration")) 
      {
        this.synchronize();
        return null;
      }

      // Return complete class AST node
      return { type: "ClassDeclaration", modifier, name: className, body };
    }

    /**
     * Parses a method declaration (e.g., "public void myMethod(int x) { ... }")
     * @returns {Object|null} - Method declaration AST node or null if invalid
     */
    parseMethodDeclaration() 
    {
      // Parse method modifiers (public, private, static)
      const modifiers = [];
      while (this.tokens.length > 0 && ["public", "private", "static"].includes(this.tokens[0]?.value)) 
      {
        modifiers.push(this.tokens.shift().value);
      }

      // Parse return type
      if (this.tokens[0]?.type !== "keyword" &&this.tokens[0]?.type !== "identifier") 
      {
        this.addError("Expected return type", ErrorType.SYNTAX);
        this.synchronize();
        return null;
      }
      const returnType = this.tokens.shift().value;

      // Parse method name
      if (this.tokens[0]?.type !== "identifier") 
      {
        this.addError("Expected method name", ErrorType.SYNTAX);
        this.synchronize();
        return null;
      }
      const methodName = this.tokens.shift().value;

      // Parse opening parenthesis for parameters
      if (!this.consumeToken("(", "Expected ( after method name")) 
      {
        this.synchronize();
        return null;
      }

      // Parse method parameters
      const parameters = [];
      while (this.tokens.length > 0 && this.tokens[0]?.value !== ")") 
      {
        if (this.tokens[0]?.type === "keyword" || (this.tokens[0]?.type === "identifier" && this.dataType(this.tokens[0]?.value))) 
        {
          // Parameter type
          const paramType = this.tokens.shift().value;
          
          // Parameter name
          if (this.tokens[0]?.type !== "identifier") 
          {
            this.addError("Expected parameter name", ErrorType.SYNTAX);
            this.synchronize();
            break;
          }
          const paramName = this.tokens.shift().value;

          // Check for array type (e.g., int[] args)
          let isArray = false;
          if (this.tokens[0]?.value === "[" && this.tokens[1]?.value === "]") 
          {
            isArray = true;
            this.tokens.shift(); // Consume '['
            this.tokens.shift(); // Consume ']'
          }

          parameters.push({ type: paramType, name: paramName, isArray });

          // Check for comma separating parameters
          if (this.tokens[0]?.value === ",")
          {
            this.tokens.shift();
          }
        }
        else 
        {
          this.addError("Invalid parameter", ErrorType.SYNTAX);
          this.synchronize();
          break;
        }
      }

      // Parse closing parenthesis for parameters
      if (!this.consumeToken(")", "Expected ) after parameters"))
      {
        this.synchronize();
        return null;
      }

      // Parse method body
      const body = this.parseBlock();

      // Return complete method declaration AST node
      return {type: "MethodDeclaration", modifiers, returnType, name: methodName, parameters, body };
    }

    /**
     * Parses a variable assignment (e.g., "int x = 10;")
     * Handles both declarations with assignment and simple assignments
     * @returns {Object} - Assignment AST node
     */
    parseAssignment() 
    {
      // Handle potential declaration keyword (int, float, etc.)
      let keyword;
      if (this.tokens[0]?.type === "keyword") 
      {
        keyword = this.tokens.shift();
      }
      
      // Parse identifier (variable name)
      const identifier = this.tokens.shift();
      
      // Parse assignment operator
      const op = this.tokens.shift();
      let error = null;
      let valueToken = null;

      // Validate assignment operator
      if (!op || op.value !== "=") 
      {
        this.addError(`Invalid assignment syntax: Expected '=' after identifier '${identifier?.value}' instead of '${op?.value}'`, ErrorType.SYNTAX, op?.loc || identifier?.loc);
        this.synchronize();
          
        // Skip until semicolon or closing brace
        while (this.tokens.length > 0 && this.tokens[0].value !== ';' && this.tokens[0].value !== '}') 
        {
          this.tokens.shift();
        }
      } 
      else 
      {
          // Parse the assigned value
          valueToken = this.tokens.shift();
      }
      
      // Check for required semicolon
      this.consumeSemicolon(`Missing semicolon after assignment of '${identifier.value}'`);

      // Handle variable declaration (if keyword present)
      if (keyword && !this.declareVariable(identifier.value, keyword.value)) 
      {
        if (error === null && identifier) 
        {
          this.addError(`Variable '${identifier.value}' already declared`, ErrorType.SEMANTIC, this.tokens[0]?.loc);
        }
      }

      // Check if variable exists in scope
      if (!this.lookupVariable(identifier.value)) 
      {
        if (identifier) 
        {
          this.addError(`Variable '${identifier.value}' is not declared.`, ErrorType.SEMANTIC, this.tokens[0]?.loc);
        }
      }

      // Type checking for assignment
      const variable = this.lookupVariable(identifier.value);
      const parsedValue = this.parseLiteralOrExpression(valueToken);
      if (variable && parsedValue && !this.isValidAssignment(parsedValue, variable.type))
      {
        this.addError(`Error mismatch: cannot assign ${parsedValue.dataType} to ${variable.type}`, ErrorType.SEMANTIC);
      }

      // Mark variable as assigned in symbol table
      this.assignVariable(identifier.value);
      
      // Return assignment AST node
      const assignmentNode = {type: "Assignment", keyword: keyword?.value, identifier: identifier.value, value: parsedValue };
      return assignmentNode;
    }

    /**
     * Parses a variable declaration without assignment (e.g., "int x;")
     * @returns {Object} - Declaration AST node or error
     */
    parseDeclaration() 
    {
      // Parse type keyword and identifier
      const keyword = this.tokens.shift();
      const identifier = this.tokens.shift();

      // Check for unexpected tokens after declaration
      if (this.tokens.length > 0 && this.tokens[0]?.value !== ";") 
      {
        this.addError(`Unexpected token after declaration of '${identifier.value}'`, ErrorType.SEMANTIC);
        
        // Skip until semicolon
        while (this.tokens.length > 0 && this.tokens[0]?.value !== ";") 
        {
          this.tokens.shift();
        }
      }

      // Expect semicolon
      this.consumeSemicolon(`Missing semicolon after declaration of '${identifier.value}'`);

      // Add variable to symbol table
      if (!this.declareVariable(identifier.value, keyword.value)) 
      {
        return { error: `Variable '${identifier.value}' already declared` };
      }

      // Return declaration AST node
      return { type: "Declaration", keyword: keyword.value, identifier: identifier.value };
    }

    /**
     * Parses an expression (literals, variables, operators)
     * Handles binary expressions with operator precedence
     * @returns {Object|null} - Expression AST node or null if invalid
     */
    parseExpression() 
    {
      // Parse the leftmost operand
      let left = this.parseLiteralOrExpression(this.tokens.shift());
      if (!left) return null;

      // Process binary operators (chained operations like a + b * c)
      while (this.tokens.length > 0 && this.tokens[0].type === "operator") 
      {
        const op = this.tokens.shift();
        const right = this.parseLiteralOrExpression(this.tokens.shift());
        if (!right) return null;

        // Special handling for string concatenation with +
        if (op.value === "+") 
        {
          if (left.dataType === "String" || right.dataType === "String") 
          {
            left = {type: "BinaryExpression", left: left, operator: op.value, right: right, dataType: "String" };// Result type is String for concatenation
            continue;
          }
        }
        
        // Error for invalid string operations
        if (left.dataType === "String" || right.dataType === "String") 
        {
          this.addError(`Bad operand '${op.value}' to be use in printing.`, ErrorType.SEMANTIC);
        }

        // Create binary expression AST node
        left = { type: "BinaryExpression", left: left, operator: op.value, right: right,};
      }
      return left;
    }

    /**
     * Parses a literal value or variable reference
     * @param {Object} token - Token to parse
     * @returns {Object|null} - AST node for the literal/variable or null if invalid
     */
    parseLiteralOrExpression(token) 
    {
      if (!token) 
      {
        this.addError("Missing token in expression", ErrorType.SYNTAX, token?.loc);
        this.synchronize();
        return null;
      }

      // Check for unexpected type keywords in expressions
      const typeKeywords = ["int", "float", "char", "boolean", "String", "double"];
      if (token.type === "keyword" && typeKeywords.includes(token.value)) 
      {
        this.addError(`Unexpected token inside expression '${token.value}'.`, ErrorType.SEMANTIC, token.loc);
        this.addError("Invalid declaration in expression", ErrorType.SEMANTIC, token.loc);
        this.synchronize();
        return null;
      }

      // Parse numeric constants
      if (token.type === "constant") 
      {
        if (isInteger(token.value)) return { type: "Constant", value: token.value, dataType: "int" };
        if (isFloat(token.value))return { type: "Float", value: token.value, dataType: "float" };
        return { error: `Invalid constant: ${token.value}` };
      }

      // Parse literals (strings, chars, booleans)
      if (token.type === "literal") 
      {
        if(token.value === "true" || token.value === "false") 
        {
          return { type: "Literal", value: token.value, dataType: "Boolean" };
        } 
        else if (token.value.startsWith('"') && token.value.endsWith('"')) 
        {
          return { type: "Literal", value: token.value, dataType: "String" };
        }
        else if (token.value.startsWith("'") && token.value.endsWith("'") && token.value.length === 3) 
        {
          return {type: "Literal", value: token.value.charAt(1), dataType: "char" };
        } 
        else 
        {
          return { error: `Invalid literal: ${token.value}` };
        }
      }

      // Parse variable references
      if (token.type === "identifier") 
      {
        const variable = this.lookupVariable(token.value);
        
        // Check if variable exists
        if (!variable) 
        {
          this.addError(`Variable '${token.value}' is not declared.`, ErrorType.SEMANTIC, this.tokens[0]?.loc);
          this.synchronize();
          return null;
        }
        
        // Check if variable has been assigned a value
        if (!variable.assigned) 
        {
          this.addError(`Variable '${token.value}' is used before being assigned a value.`, ErrorType.SEMANTIC, this.tokens[0]?.loc);
          this.synchronize();
        }
        
        // Return variable reference AST node
        return {type: "Variable", value: token.value, dataType: variable.type };
      }
    }

    /**
     * Parses an if statement with optional else-if and else branches
     * @param {string} context - Context of the if statement (default "if")
     * @returns {Object|null} - If statement AST node or null if invalid
     */
    parseIfStatement(context = "if") 
    {
      if (!this.isIfKeyword(this.tokens[0])) 
      {
        return null;
      }
      this.tokens.shift(); // consume 'if'

      // Parse opening parenthesis
      if (!this.consumeToken("(", "Expected '(' after 'if'")) 
      {
        return null;
      }

      // Parse condition expression
      const condition = this.parseCondition();
      if (!condition) 
      {
        this.addError("Invalid condition in 'if' statement", ErrorType.SYNTAX);
        this.synchronize();
        return null;
      }

      // Parse closing parenthesis
      if (!this.consumeToken(")", "Expected ')' after condition")) 
      {
        return null;
      }

      // Parse then branch block
      const thenBranch = this.parseBlock();
      if (!thenBranch) 
      {
        this.addError("Missing block after 'if' condition", ErrorType.SYNTAX);
        this.synchronize();
        return null;
      }

      // Create if statement AST node
      const ifNode = { type: "IfStatement", condition, thenBranch };

      // Parse optional else-if and else branches
      let elseIfBranches = [];

      while (this.tokens[0]?.value === "else") 
      {
        this.tokens.shift(); // consume 'else'

        if (this.isIfKeyword(this.tokens[0])) 
        {
          // Parse else-if branch
          this.tokens.shift(); // consume 'if'

          // Check for missing condition
          if (this.tokens[0]?.value === "{")
          {
            this.addError("Missing condition in 'else if' statement — expected '(' before block", ErrorType.SYNTAX);
            this.synchronize();
            continue;
          }
          
          // Parse opening parenthesis
          if (!this.consumeToken("(", "Expected '(' after 'else if'")) 
          {
            this.synchronize();
          }

          // Parse else-if condition
          const elseIfCondition = this.parseCondition();
          if (!elseIfCondition) 
          {
            this.addError("Invalid condition in 'else if' statement", ErrorType.SYNTAX);
            this.synchronize();
            continue;
          }

          // Parse closing parenthesis
          if (!this.consumeToken(")", "Expected ')' after 'else if' condition")) 
          {
            this.synchronize();
            break;
          }

          // Parse else-if block
          const elseIfBranch = this.parseBlock();
          if (!elseIfBranch) 
          {
            this.addError("Missing block after 'else if' condition", ErrorType.SYNTAX);
            this.synchronize();
            continue;
          }

          // Add else-if branch to list
          elseIfBranches.push({type: "ElseIfStatement", condition: elseIfCondition, thenBranch: elseIfBranch});

        } 
        else 
        {
          // Parse standalone 'else' branch
          const elseBlock = this.parseBlock();
          if (!elseBlock) 
          {
            this.addError("Missing block after 'else'", ErrorType.SYNTAX);
            this.synchronize();
            continue;
          }
          ifNode.elseBranch = elseBlock;
          hasElse = true;
          break;
        }
      }

      // Add else-if branches to if node if any exist
      if (elseIfBranches.length > 0) 
      {
        ifNode.elseIfBranches = elseIfBranches;
      }

      return ifNode;
    }

    /**
     * Parses a condition expression for if/while/for statements
     * @returns {Object|null} - Condition AST node or null if invalid
     */
    parseCondition() 
    {
      if (this.tokens.length < 1) 
      {
        this.addError("Empty condition", ErrorType.SYNTAX);
        return null;
      }

      // Parse condition expression
      const expression = this.parseExpression();
      if (!expression) 
      {
        this.addError("Invalid condition expression", ErrorType.SYNTAX);
        return null;
      }

      // Type checking for condition
      if (expression.dataType && !["boolean", "int", "float", "char"].includes(expression.dataType)) 
      {
        this.addError(`Invalid condition data type '${expression.dataType}'`, ErrorType.SEMANTIC);
      }

      // Return condition AST node
      return { type: "Condition", expression };
    }

    /**
     * Parses a code block enclosed in curly braces
     * @returns {Array|null} - Array of statement AST nodes or null if invalid
     */
    parseBlock() 
    {
      // Check for opening brace
      if (!this.consumeToken("{", "Expected '{'")) 
      {
        this.synchronize();
        return null;
      }

      // Create new scope for block variables
      this.pushScope();
      const statements = [];

      // Parse statements until closing brace
      while (this.tokens.length > 0 && this.tokens[0]?.value !== "}") 
      {
        // Check for specific statement types
        if (this.isLoopKeyword(this.tokens[0])) 
        {
          // Parse loop statement
          const loopStatement = this.parseLoop(this.tokens[0].value);
          if (loopStatement) statements.push(loopStatement);
          else 
          {
            this.addError("Failed to parse loop statement", ErrorType.SYNTAX);
            this.synchronize();
          }
        } 
        else if (this.isIfKeyword(this.tokens[0])) 
        {
          // Parse if statement
          const ifStatement = this.parseIfStatement();
          if (ifStatement) statements.push(ifStatement);
          else
          {
            this.addError("Failed to parse if statement", ErrorType.SYNTAX);
            this.synchronize();
            return null;
          }
        }
        // Check for method calls (object.method())
        else if (this.isMethodCall(this.tokens)) 
        {
          const methodCall = this.parseMethodCall();
          if (methodCall) statements.push(methodCall);
          else 
          {
            this.addError("Failed to parse method call", ErrorType.SYNTAX);
            this.synchronize();
          }
        }
        // Check for assignments with type declarations (int x = 5)
        else if (this.isAssignment(this.tokens)) 
        {
          const assignment = this.parseAssignment();
          if (assignment) statements.push(assignment);
          else 
          {
            this.addError("Failed to parse assignment", ErrorType.SYNTAX);
            this.synchronize();
          }
        }
        // Check for increment/decrement operations (x++ or ++x)
        else if (this.tokens.length >= 2 && this.tokens[0]?.type === "identifier" && (this.tokens[1]?.value === "++" || this.tokens[1]?.value === "--")) 
        {
          const iteration = this.parseIteration();
          if (iteration) 
          {
            statements.push(iteration);
            this.consumeSemicolon("Expected semicolon after increment/decrement");
          }
        }
        // Try to parse as a general expression or statement
        else if (this.tokens.length > 0) 
        {
          // Handle empty statements (just a semicolon)
          if (this.tokens[0]?.value === ";")
          {
            this.tokens.shift();
            continue;
          }

          try 
          {
            const expr = this.parseStatement();
            if (expr) statements.push(expr);
          } 
          catch (e) 
          {
            this.addError(`Error parsing statement: ${e.message}`, ErrorType.SYNTAX);
            this.synchronize();
            
            // Skip until next statement boundary
            while (this.tokens.length > 0 && this.tokens[0]?.value !== ";" && this.tokens[0]?.value !== "}") 
            {
              this.tokens.shift();
            }
            if (this.tokens[0]?.value === ";") this.tokens.shift();
          }
        }
      }
      
      // Check for unclosed block
      if (this.tokens.length === 0) 
      {
        this.addError("Unclosed block: Missing '}'", ErrorType.SYNTAX);
        this.synchronize();
      } 
      else 
      {
        this.tokens.shift(); // Consume '}'
      }

      // Exit block scope
      this.popScope();
      return statements;
    }

    /**
     * Parses a method call (e.g., "System.out.println("Hello")")
     * @returns {Object|null} - Method call AST node or null if invalid
     */
    parseMethodCall() 
    {
      // Parse object and method name (supporting dot notation)
      const objectParts = [];
      objectParts.push(this.tokens.shift().value);

      while (this.tokens.length > 0 && this.tokens[0].value === ".") 
      {
        this.tokens.shift(); // Consume '.'
        objectParts.push(this.tokens.shift().value);
      }

      // The last part is the method name, earlier parts form the object reference
      const method = objectParts.pop();
      const object = objectParts.join(".");

      // Parse opening parenthesis
      if (!this.consumeToken("(", `Expected '(' after method name '${method}'`)) 
      {
        return null;
      }

      // Parse method arguments
      let args = [];
      while (this.tokens.length > 0 && this.tokens[0].value !== ")") 
      {
        const parsedArg = this.parseExpression();
        args.push(parsedArg);

        // Check for comma between arguments
        if (this.tokens[0]?.value === ",") this.tokens.shift();
      }

      // Check for unclosed method call
      if (this.tokens.length === 0) 
      {
        this.addError("Unclosed method call: Missing ')'", ErrorType.SYNTAX, this.tokens[0]?.loc);
        return { type: "MethodCall", object, method, arguments: args };
      }

      // Consume closing parenthesis
      this.tokens.shift();

      // Check for semicolon
      if (this.tokens.length > 0) 
      {
        this.consumeSemicolon(`Missing semicolon after method call to ${object}.${method}`);
      }

      // Create method call AST node
      const methodCall = {type: "MethodCall", object, method, arguments: args };

      // Perform semantic analysis on method call
      this.analyzeMethodCallArguments(methodCall);
      return methodCall;
    }

    /**
     * Parses loop statements (for, while, do-while)
     * @param {string} loopType - Type of loop ("for", "while", or "do")
     * @returns {Object|null} - Loop AST node or null if invalid
     */
    parseLoop(loopType)
    {
      if (loopType === "do") 
      {
        // Parse do-while loop
        this.tokens.shift(); // Consume 'do'
        
        // Parse loop body
        const body = this.parseBlock();
        if (!body) 
        {
          this.addError("Invalid body in do-while loop", ErrorType.SYNTAX, this.tokens[0]?.loc );
          this.synchronize();
          return null;
        }

        // Parse while condition
        if (!this.consumeToken("while", "Expected 'while' after do block"))
        {
          this.synchronize();
          return null;
        }
        if (!this.consumeToken("(", "Expected '(' after 'while'")) 
        {
          return null;
        }
        const condition = this.parseCondition();
        if (!condition)
        {
          this.addError("Invalid condition in do-while loop", ErrorType.SYNTAX, this.tokens[0]?.loc);
          this.synchronize();
          return null;
        }

        if (!this.consumeToken(")", "Expected ')' after condition in do-while loop")) 
        {
          return null;
        }
        
        // Parse ending semicolon
        this.consumeSemicolon("Missing semicolon after do-while loop");
        
        // Return do-while loop AST node
        return { type: "DoWhileLoop", condition, body };
      } 
      else if (loopType === "while") 
      {
        // Parse while loop
        this.tokens.shift(); // Consume 'while'
        
        // Parse condition
        if (!this.consumeToken("(", "Expected '(' after 'while'")) 
        {
          return null;
        }
        const condition = this.parseCondition();
        if (!condition) 
        {
          this.addError("Invalid condition in while loop", ErrorType.SYNTAX);
          return null;
        }

        if (!this.consumeToken(")", "Expected ')' after condition in while loop")) 
        {
          return null;
        }
        
        // Parse loop body
        const body = this.parseBlock();
        if (!body) 
        {
          this.addError("Invalid body in while loop", ErrorType.SYNTAX, this.tokens[0]?.loc);
          return null;
        }

        // Return while loop AST node
        return { type: "WhileLoop", condition, body };
      } 
      else if (loopType === "for") 
      {
        // Parse for loop
        this.tokens.shift(); // Consume 'for'
        
        // Parse opening parenthesis
        if (!this.consumeToken("(", "Expected '(' after 'for'")) 
        {
          return null;
        }
        
        // Parse initialization statement
        let init;
        if (this.isAssignment(this.tokens)) 
        {
          // Handle variable declaration with assignment
          init = this.parseAssignment();
        } 
        else 
        {
          // Handle simple initialization or empty init statement
          if (this.tokens.length >= 3 && this.tokens[0]?.type === "identifier" && this.tokens[1]?.value === "=") 
          {
            // Parse assignment without type declaration (x = 5)
            const identifier = this.tokens.shift().value;
            this.tokens.shift(); // consume =
            const valueToken = this.tokens.shift();
            const value = this.parseLiteralOrExpression(valueToken);
            this.assignVariable(identifier);
            init = { type: "Assignment", identifier: identifier, value: value };
            if (!this.consumeToken(";","Expected ';' after initialization and before condition in for loop"))
            {
              return null;
            }
          } 
          else 
          {
            // Skip tokens until semicolon for invalid or empty init
            while (this.tokens.length > 0 && this.tokens[0].value !== ";") 
            {
              this.tokens.shift();
            }
            init = { type: "EmptyStatement" };
            if (!this.consumeToken(";","Expected ';' after initialization and before condition in for loop")) 
            {
              return null;
            }
          }
        }

        // Parse condition (or empty condition)
        let condition;
        if (this.tokens[0]?.value === ";") 
        {
          // Handle empty condition (e.g., for(init;;update))
          this.synchronize();
          condition = { type: "EmptyStatement" };
          this.tokens.shift(); // Consume ';'
        } 
        else 
        {
          // Parse regular condition
          condition = this.parseCondition();
          if (!this.consumeToken(";", "Expected ';' after condition and before iteration in for loop")) 
          {
            return null;
          }
        }

        // Parse iteration/update statement
        let iteration;
        if (this.tokens[0]?.value === ")") 
        {
          // Handle empty iteration (e.g., for(init;condition;))
          this.synchronize();
          iteration = { type: "EmptyStatement" };
        } 
        else 
        {
          iteration = this.parseIteration();
        }

        // Parse closing parenthesis
        if (!this.consumeToken(")","Expected ')' after iteration expression in for loop")) 
        {
          return null;
        }
        
        // Parse loop body
        const body = this.parseBlock();
        if (!body) 
        {
          this.addError("Invalid body in for loop", ErrorType.SYNTAX, this.tokens[0]?.loc);
          this.synchronize();
          return null;
        }
        
        // Return for loop AST node with all components
        return { type: "ForLoop", init, condition, iteration, body };
      }
    }

    /**
     * Parses iteration expressions for the update part of for loops
     * Handles increment/decrement and assignments (i++, ++i, i+=1, i=i+1)
     * @returns {Object} - Iteration AST node
     */
    parseIteration() 
    {
      if (this.tokens.length >= 2) 
      {
        const token1 = this.tokens[0];
        const token2 = this.tokens[1];
        
        // Handle postfix increment/decrement (i++, i--)
        if (token1?.type === "identifier" && (token2?.value === "++" || token2?.value === "--")) 
        {
          this.tokens.shift();
          this.tokens.shift();
          return { type: token2.value === "++" ? "Increment" : "Decrement", operator: token2.value, argument: { type: "Variable", value: token1.value }, form: "postfix" };
        } 
        // Handle prefix increment/decrement (++i, --i)
        else if ((token1?.value === "++" || token1?.value === "--") && token2?.type === "identifier") 
        {
          this.tokens.shift();
          this.tokens.shift();
          return { type: token1.value === "++" ? "Increment" : "Decrement", operator: token1.value, argument: { type: "Variable", value: token2.value }, form: "prefix" };
        } 
        // Handle compound assignments (i+=1, i-=2, etc.)
        else if (this.tokens.length >= 3 && token1?.type === "identifier" && ["+=", "-=", "*=", "/="].includes(token2?.value)) 
        {
          const identifier = this.tokens.shift();
          const operator = this.tokens.shift();
          const value = this.tokens.shift();
          return { type: "CompoundAssignment", operator: operator.value, left: { type: "Variable", value: identifier.value }, right: this.parseLiteralOrExpression(value) };
        } 
        // Handle regular assignments (i=i+1)
        else if (this.tokens.length >= 5 && token1?.type === "identifier" && token2?.value === "=") 
        {
          const left = this.tokens.shift();
          const equals = this.tokens.shift();
          const expr = this.parseExpression();
          return { type: "Assignment", left: { type: "Variable", value: left.value }, operator: "=", right: expr };
        }
      }
      
      // Skip invalid iteration expressions
      while (this.tokens.length > 0 && this.tokens[0].value !== ")") this.tokens.shift();
      return { type: "EmptyStatement" };
    }

    /**
     * Parses switch statements with case and default branches
     * @returns {Object|null} - Switch statement AST node or null if invalid
     */
    parseSwitchStatement() 
    {
      this.tokens.shift(); // Consume 'switch'
      
      // Parse opening parenthesis
      if (!this.consumeToken("(", "Expected ( after switch")) 
      {
        return null;
      }
      
      // Parse switch expression
      const expression = this.parseExpression();
      
      // Parse closing parenthesis
      if (!this.consumeToken(")", "Expected ) after switch expression")) 
      {
        return null;
      
      }
      
      // Parse opening brace
      if (!this.consumeToken("{", "Expected { after switch expression")) 
      {
        this.synchronize();
        return null;
      }
      
      // Parse case statements and default case
      const cases = [];
      let defaultCase = null;

      while (this.tokens.length > 0 && this.tokens[0]?.value !== "}") 
      {
        if (this.tokens[0]?.value === "case") 
        {
          // Parse case statement
          this.tokens.shift(); // Consume 'case'
          const condition = this.parseExpression();
          if (!condition) return null;
          
          // Parse case colon
          if (!this.consumeToken(":", "Expected : after case condition")) 
          {
            return null;
          }
          
          // Parse case body statements
          const body = [];
          while ( this.tokens.length > 0 && this.tokens[0]?.value !== "case" && this.tokens[0]?.value !== "default" && this.tokens[0]?.value !== "}") 
          {
            const statement = this.parseStatement();
            if (!statement) return null;
            body.push(statement);
          }
          cases.push({ type: "CaseStatement", condition, body });
        } 
        else if (this.tokens[0]?.value === "default") 
        {
          // Parse default case
          this.tokens.shift(); // Consume 'default'
          
          // Parse default colon
          if (!this.consumeToken(":", "Expected : after default keyword")) 
          {
            return null;
          }
          
          // Parse default case body statements
          const body = [];
          while (this.tokens.length > 0 && this.tokens[0]?.value !== "case" && this.tokens[0]?.value !== "default" && this.tokens[0]?.value !== "}") 
          {
            const statement = this.parseStatement();
            if (!statement) return null;
            body.push(statement);
          }
          defaultCase = { type: "DefaultStatement", body };
        } 
        else 
        {
          this.addError( "Invalid statement inside switch block",ErrorType.SYNTAX);
          return null;
        }
      }

      // Parse closing brace
      if (!this.consumeToken("}", "Expected } to close switch statement")) 
      {
        this.synchronize();
        return null;
      }

      // Return switch statement AST node with cases and default case
      return { type: "SwitchStatement", expression, cases, defaultCase };
    }

    /**
     * Parses break, continue, and return statements
     * @returns {Object} - Exit statement AST node
     */
    parseExitStatement() 
    {
      const statementType = this.tokens[0].value;
      this.tokens.shift(); // Consume 'break', 'continue', or 'return'
      
      // Parse optional return value
      let value = null;
      // For return statements, we might have a return value
      if (statementType === "return" && this.tokens[0]?.value !== ";") value = this.parseExpression();

      // Parse required semicolon
      this.consumeSemicolon(`Expected semicolon after ${statementType}`);

      // Return appropriate AST node based on statement type
      if (statementType === "break") 
      {
        return { type: "BreakStatement" };
      } 
      else if (statementType === "continue") 
      {
        return { type: "ContinueStatement" };
      } 
      else 
      {
        return { type: "ReturnStatement", value };
      }
    }

    /**
     * Checks if an operator is a valid comparison operator
     * @param {string} op - Operator to check
     * @returns {boolean} - True if valid comparison operator, false otherwise
     */
    isValidComparisonOperator(op) 
    {
      const validOperators = ["==", "!=", "<", ">", "<=", ">="];
      return validOperators.includes(op);
    }

    /**
     * Validates type compatibility for assignments
     * @param {Object} value - Value AST node
     * @param {string} expectedType - Expected data type
     * @returns {boolean} - True if assignment is valid, false otherwise
     */
    isValidAssignment(value, expectedType) 
    {
      // Check variable assignment compatibility
      if (value.type === "Variable") return value.dataType === expectedType;
      
      // Check numeric type compatibility
      if (expectedType === "int") return isInteger(value.value);
      if (expectedType === "float") return isFloat(value.value);
      
      // Check other type compatibility
      if (expectedType === "String") return value.dataType === "String";
      if (expectedType === "boolean") return value.value === "true" || value.value === "false";
      if (expectedType === "char") return value.dataType === "char";
      if (expectedType === "void") return false;
      if (expectedType === "double") return isFloat(value.value);
      return false;
    }

    /**
     * Checks if tokens represent a variable assignment with type declaration
     * @param {Array} tokens - Tokens to check
     * @returns {boolean} - True if assignment statement, false otherwise
     */
    isAssignment(tokens) 
    {
      const typeKeywords = ["int", "float", "String", "boolean", "char"];
      return (tokens.length >= 4 && typeKeywords.includes(tokens[0].value) && tokens[1].type === "identifier" && tokens[2].value === "=");
    }

    /**
     * Checks if tokens represent a variable declaration without assignment
     * @param {Array} tokens - Tokens to check
     * @returns {boolean} - True if declaration statement, false otherwise
     */
    isDeclaration(tokens) 
    {
      const typeKeywords = ["int", "float", "String", "boolean", "char"];
      return (tokens.length >= 2 && typeKeywords.includes(tokens[0].value) && tokens[1].type === "identifier");
    }

    /**
     * Checks if token is a loop keyword (for, while, do)
     * @param {Object} token - Token to check
     * @returns {boolean} - True if loop keyword, false otherwise
     */
    isLoopKeyword(token) 
    {
      return (token?.type === "keyword" && ["for", "while", "do"].includes(token?.value));
    }

    /**
     * Checks if token is the 'if' keyword
     * @param {Object} token - Token to check
     * @returns {boolean} - True if 'if' keyword, false otherwise
     */
    isIfKeyword(token) 
    {
      return token?.type === "keyword" && token?.value === "if";
    }

    /**
     * Checks if token is an exit statement keyword (break, continue, return)
     * @param {Object} token - Token to check
     * @returns {boolean} - True if exit statement keyword, false otherwise
     */
    isExitStatement(token) 
    {
      return (token?.type === "keyword" && ["break", "continue", "return"].includes(token?.value));
    }

    /**
     * Checks if tokens represent a method call
     * @param {Array} tokens - Tokens to check
     * @returns {boolean} - True if method call, false otherwise
     */
    isMethodCall(tokens) {
      if (tokens.length < 3) return false;

      // Simple case: identifier followed by opening parenthesis
      if (tokens[0]?.type === "identifier" && tokens[1]?.value === "(") return true;

      // More complex case: object.method() call with dot notation
      let i = 0;
      if (tokens[i]?.type !== "identifier") return false;

      i++;
      while (i < tokens.length - 1) 
      {
        if (tokens[i]?.value === ".") 
        {
          i++;
          if (tokens[i]?.type === "identifier")
          {
            i++;
            if (tokens[i]?.value === "(") 
            {
              return true;
            }
          } 
          else 
          {
            return false;
          }
        } 
        else if (tokens[i]?.value === "(") 
        {
          return true;
        } 
        else 
        {
          return false;
        }
      }
      return false;
    }

    /**
     * Checks if tokens represent a class declaration
     * @param {Array} tokens - Tokens to check
     * @returns {boolean} - True if class declaration, false otherwise
     */
    isClassDeclaration(tokens)
    {
      return ((tokens.length >= 1 && tokens[0]?.value === "class") || (tokens.length >= 2 && ["public", "private"].includes(tokens[0]?.value) && tokens[1]?.value === "class"));
    }

    /**
     * Checks if tokens represent a method declaration
     * @param {Array} tokens - Tokens to check
     * @returns {boolean} - True if method declaration, false otherwise
     */
    isMethodDeclaration(tokens) 
    {
      let i = 0;
      // Skip access and static modifiers
      while (i < tokens.length && ["public", "private", "static"].includes(tokens[i]?.value)) 
      {
        i++;
      }

      // Check for return type (keyword or identifier)
      if (i < tokens.length &&(tokens[i]?.type === "keyword" || tokens[i]?.type === "identifier")) 
      {
        i++;
      }
      else 
      {
        return false;
      }

      // Check for method name (identifier)
      if (i < tokens.length && tokens[i]?.type === "identifier") 
      {
        i++;
      } 
      else 
      {
        return false;
      }

      // Check for opening parenthesis
      return i < tokens.length && tokens[i]?.value === "(";
    }

    /**
     * Checks if token is the 'switch' keyword
     * @param {Object} token - Token to check
     * @returns {boolean} - True if 'switch' keyword, false otherwise
     */
    isSwitchKeyword(token) 
    {
      return token?.type === "keyword" && token.value === "switch";
    }

    /**
     * Consumes a semicolon and adds an error if missing
     * @param {string} context - Error context message
     * @param {string|null} identifier - Optional identifier name for error message
     */
    consumeSemicolon(context = "statement", identifier = null)
    {
      if (this.tokens.length > 0 && this.tokens[0]?.type === "punctuator" && this.tokens[0]?.value === ";") 
      {
        this.tokens.shift();
      } 
      else 
      {
        const name = identifier ? ` '${identifier}'` : "";
        this.addError(`Error: ${context}${name}`, ErrorType.SYNTAX, this.tokens[0]?.loc);
      }
    }

    /**
     * Consumes an expected token and adds an error if not found
     * @param {string} expectedToken - Token value to consume
     * @param {string} errorMessage - Error message if token not found
     * @returns {boolean} - True if token consumed successfully, false otherwise
     */
    consumeToken(expectedToken, errorMessage) 
    {
      if (this.tokens.length > 0 && this.tokens[0]?.value === expectedToken) 
      {
        this.tokens.shift();
        return true;
      } 
      else 
      {
        this.addError(errorMessage, ErrorType.SYNTAX, this.tokens[0]?.loc);
        return false;
      }
    }

    /**
     * Validates arguments for specific method calls (currently only println)
     * @param {Object} methodCall - Method call AST node
     */
    analyzeMethodCallArguments(methodCall) 
    {
      if (methodCall.method === "println") 
      {
        if (methodCall.arguments.length !== 1) 
        {
          this.addError("println method expects one argument.", ErrorType.SEMANTIC);
          this.synchronize(); //Synchronizes and handles the error to avoid mishandling
        }
      }
    }

    /**
     * Declares a variable in the current scope
     * @param {string} identifier - Variable name
     * @param {string} type - Variable data type
     * @returns {boolean} - True if declaration successful, false if already declared
     */
    declareVariable(identifier, type) 
    {
      const currentScope = this.getCurrentScope();
      if (currentScope[identifier]) 
      {
        this.addError(`Variable '${identifier}' already declared in this scope.`, ErrorType.SEMANTIC);
        return false;
      }
      currentScope[identifier] = {type, declared: true, assigned: false, assignments: [] };
      return true;
    }

    /**
     * Marks a variable as assigned in the symbol table
     * @param {string} identifier - Variable name
     */
    assignVariable(identifier) 
    {
      // Search through all scopes from innermost to outermost
      for (let i = this.symbolTable.length - 1; i >= 0; i--) 
      {
        if (this.symbolTable[i][identifier]) 
        {
          this.symbolTable[i][identifier].assigned = true;
          return;
        }
      }
      this.addError(`Variable '${identifier}' is not declared.`, ErrorType.SEMANTIC);
    }

    /**
     * Checks if a token represents a valid data type
     * @param {string} token - Token value to check
     * @returns {boolean} - True if valid data type, false otherwise
     */
    dataType(token) 
    {
      const types = ["int", "float", "char", "String", "boolean"];
      return types.includes(token);
    }

    /**
     * Looks up a variable in all scopes
     * @param {string} identifier - Variable name
     * @returns {Object|null} - Variable info object or null if not found
     */
    lookupVariable(identifier) 
    {
      // Search through all scopes from innermost to outermost
      for (let i = this.symbolTable.length - 1; i >= 0; i--) 
      {
        if (this.symbolTable[i][identifier]) 
        {
          return this.symbolTable[i][identifier];
        }
      }
      return null;
    }

    /**
     * Adds an error to the error list
     * @param {string} message - Error message
     * @param {ErrorType} type - Error type (SYNTAX or SEMANTIC)
     * @param {Object|null} location - Error location information
     * @returns {Object} - Error object
     */
    addError(message, type = ErrorType.SYNTAX, location = null) 
    {
      this.errors.push({ message, type, loc: location });
      return { error: message };
    }

    /**
     * Processes a parsed statement and adds it to the statement list
     * @param {Object} statement - Parsed statement AST node
     * @param {string} errorMessage - Error message if statement is invalid
     * @param {Array} statements - Statement list to add to
     */
    handleParsedStatement(statement, errorMessage, statements) {
      if (statement) 
      {
        if (statement.error) 
        {
          this.addError(statement.error, ErrorType.SYNTAX);
          return;
        }
        statements.push(statement);
      }
      else 
      {
        this.addError(errorMessage, ErrorType.SYNTAX);
      }
    }

    /**
     * Gets the current (innermost) scope
     * @returns {Object} - Current scope object
     */
    getCurrentScope() 
    {
      return this.symbolTable[this.symbolTable.length - 1];
    }

    /**
     * Creates a new scope
     */
    pushScope() 
    {
      this.symbolTable.push({});
    }

    /**
     * Exits the current scope
     */
    popScope() 
    {
      this.symbolTable.pop();
    }

    /**
     * Performs semantic analysis on condition expressions
     * Validates data types and operations in conditions
     * @param {Object} left - Left operand AST node
     * @param {Object} right - Right operand AST node
     * @param {string} operator - Comparison operator
     */
    semanticCons(left, right, operator) 
    {
      // Check if left operand is a variable and validate it
      if (left?.type === "Variable") 
      {
        const varInfo = this.lookupVariable(left.value);
        if (!varInfo) 
        {
          this.addError(`Variable '${left.value}' in condition is not declared.`, ErrorType.SEMANTIC);
        } 
        else 
        {
          left.dataType = varInfo.type;
          if (!varInfo.assigned) 
          {
            this.addError(`Variable '${left.value}' used in before being assigned a value.`,ErrorType.SEMANTIC);
          }
        }
      }
      
      // Check if right operand is a variable and validate it
      if (right?.type === "Variable") 
      {
        const varInfo = this.lookupVariable(right.value);
        if (!varInfo) 
        {
          this.addError(`Variable '${right.value}' in condition is not declared`,ErrorType.SEMANTIC);
        } 
        else 
        {
          right.dataType = varInfo.type;
          if (!varInfo.assigned) 
          {
            this.addError(`Variable '${right.value}' used in condition before assignment.`, ErrorType.SEMANTIC);
          }
        }
      }
      
      // Check type compatibility between variable and literal
      if (left?.type === "Variable" && right?.type === "Literal") 
      {
        if (!this.isValidAssignment(right, left.dataType)) 
        {
          this.addError(`Invalid comparison: '${right.value}' does not match type '${left.dataType}' of '${left.value}'`, ErrorType.SEMANTIC);
        }
      }
      
      // Check type compatibility between literal and variable
      if (left?.type === "Literal" && right?.type === "Variable") 
      {
        if (!this.isValidAssignment(left, right.dataType)) 
        {
          this.addError(`Invalid comparison: '${left.value}' does not match type '${right.dataType}' of '${right.value}'`, ErrorType.SEMANTIC);
        }
      }
      
      // Check type compatibility between two variables
      if (left?.type === "Variable" && right?.type === "Variable") 
      {
        if (left.dataType !== right.dataType) 
        {
          this.addError(`Type mismatch in condition: ' ${left.dataType}' to '${right.dataType}' comparison. ''`, ErrorType.SEMANTIC);
        }
      }

      // Validate type combinations for comparisons
      const comparisons = [["int", "int"], ["float", "float"], ["int", "float"], ["float", "int"], ["boolean", "boolean"], ["char", "char"], ["String", "String"],
      ];
      if (left?.dataType && right?.dataType && !comparisons.some(([a, b]) => a === left.dataType && b === right.dataType)) 
      {
        this.addError(`Datatypes mismatch: '${left.dataType}' and '${right.dataType}' in condition`,ErrorType.SEMANTIC);
      }
      
      // Check for assignment operator used instead of equality
      if (operator === "=") 
      {
        this.addError(`Invalid operator '=' in condition`, ErrorType.SEMANTIC);
      }

      // Check for invalid string equality comparison
      if (operator === "==" && left.dataType === "String" && right.dataType === "String") 
      {
        this.addError(`Invalid comparison in condition`, ErrorType.SEMANTIC);
      }

      // Check for arithmetic operators in conditions
      if (["+", "-", "*", "/"].includes(operator)) 
      {
        this.addError(`Invalid comparison in condition`, ErrorType.SEMANTIC);
      }

      // Check for mixing boolean with non-boolean types
      if ((left.dataType === "boolean" && right.dataType !== "boolean") || (right.dataType === "boolean" && left.dataType !== "boolean")) 
      {
        this.addError(`Invalid comparison between the datatypes in condition`, ErrorType.SEMANTIC);
      }

      // Check for invalid string/char comparison
      if((left.dataType === "char" && right.dataType === "String") || (left.dataType === "String" && right.dataType === "char")) 
      {
        this.addError(`Invalid comparison between the datatypes in condition`, ErrorType.SEMANTIC);
      }

      // Check for comparison between two literals (constant result)
      if (left.type === "Literal" && right.type === "Literal") 
      {
        this.addError(`infinite comparison in condition`, ErrorType.SEMANTIC);
      }
    }
  }
  window.analyzeAndParseJava = analyzeAndParseJava;
});
