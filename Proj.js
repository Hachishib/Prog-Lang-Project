const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let lines = [];
console.log("Enter your code (type 'END' on a new line to finish):");
rl.on("line", (line) => {
    if (line.trim() === "END") {
        rl.close();
        const fullCode = lines.join('\n');
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

        if (!q && ch === '.') {
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
        processToken(x, p, x.length, keywords, constants, identifiers, tokens, markers);
    }

    if (!isCorrect(x)) {
        console.log("ERROR!");
    } else {
        console.log("_____________________________________________________________");
        display("Keywords\t", keywords, markers.keyMarker);
        display("Identifiers\t", identifiers, markers.idMarker);
        display("Operators\t", operators, markers.opMarker);
        display("Constants\t", constants, markers.consMarker);
        display("Punctuators\t", punctuators, markers.puncMarker);
        display("Literals\t", literals, markers.litMarker);
        console.log("_____________________________________________________________");

        const filteredTokens = tokens.filter((token) => token.value.trim() !== "" && !(token.type === "punctuator" && ["!", "?", "[", "]"].includes(token.value)));
        const parser = new Parser(filteredTokens);
        const ast = parser.parse();
        console.log("Filtered Tokens:", filteredTokens);
        console.log("Abstract Syntax Tree (AST):", JSON.stringify(ast, null, 2));
    }
}

function processToken(x, start, end, keywords, constants, identifiers, tokens, markers) {
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

function isKeyword(key) 
{
  const keywords = ["boolean", "break", "case", "char", "class", "default", "do", "else", "float","for", "if", "import", "int", "new", "private", "public", "return", "static","switch", "void", "while", "String", "length", "continue", "else if", "else"];
  return keywords.includes(key);
}
  
function isConstant(cons) 
{
  return isInteger(cons) || isFloat(cons);
}
  
function isInteger(str) 
{
  return /^\d+$/.test(str);
}
  
function isFloat(str) 
{
  return /^\d+\.\d+$/.test(str);
}
  
function isOperator(op) 
{
  const operators = ["+","-","*","/","%","=","<",">","!","++","--","+=","-=","*=","/=",">=","<=","==","!=","||","&&",];
  return operators.includes(op);
}
  
function isOperatorChar(ch) 
{
  return "+-*/=%<>!&|".includes(ch);
}
  
function isPunctuation(code, index) 
{
  let ch = code.charAt(index);
  const punctuators = ";,!?[]{}()";  // Removed '.' from here

  if (punctuators.includes(ch)) 
  {
      return true;
  }
  return false;
}
  
function isCorrect(code) 
{
  let brackets = 0, parentheses = 0;
  let inside = false;
  let last = "\0";
  
  for (let i = 0; i < code.length; i++) 
  {
    let ch = code.charAt(i);  
    if (!isWhitespace(ch)) 
    {
        last = ch;
    }
    if (ch === '"') 
      {
        inside = !inside;
      }
      if (!inside) 
      {
        if (ch === "{") 
        {
          brackets++;
        }
        if (ch === "}") 
        {
          brackets--;
        } 
        if (ch === "(") 
        {
          parentheses++;
        }
        if (ch === ")") 
        {
          parentheses--;
        }
        if (brackets < 0 || parentheses < 0) 
        {            
          return false;
        }
      }
    }
  return ((last === "}" || last === ";") && brackets === 0 && parentheses === 0 && !inside);
}
  
function isWhitespace(ch) 
{
  return /\s/.test(ch); 
}
  
class Parser 
{
  constructor(tokens) 
  {
    this.tokens = tokens.filter((token) => token.value.trim() !== "");
    this.symbolTable = {};
    this.errors = [];
  }
  
  parse() 
  {
    const ast = [];

    while (this.tokens.length > 0) 
    {
      // Check if this is a loop (for, while, do-while)
      if (this.tokens[0]?.type === "keyword" && ["for", "while", "do"].includes(this.tokens[0]?.value)) 
      {
        const loopStatement = this.parseLoop(this.tokens[0].value);
        if (loopStatement) 
        {
          ast.push(loopStatement);
        } 
        else 
        {
          this.errors.push(`Failed to parse ${this.tokens[0].value} loop`);
          this.tokens.shift(); // Skip the loop keyword
        }
      }
      // Check if this is a declaration/assignment
      else if (this.isAssignment(this.tokens)) 
      {
        const assignment = this.parseAssignment();
        assignment.error ? this.errors.push(assignment.error) : ast.push(assignment);
      }
      // Check if this is an if statement
      else if (this.tokens[0]?.type === "keyword" && this.tokens[0]?.value === "if")
      {
        const ifStatement = this.parseIfStatement();
        if (ifStatement) 
          {
            ast.push(ifStatement);
          }
      }
      // Handle method calls like System.out.println
      else if (this.tokens[0]?.type === "identifier" && this.tokens.length > 5 && this.tokens[1]?.value === "." && this.tokens[3]?.value === "." && this.tokens[5]?.value === "(") 
      {
        const methodCall = this.parseMethodCall();
        ast.push(methodCall);
      }
      // Default case: try to parse as expression
      else if (this.tokens.length >= 3) 
      {
        const expression = this.parseExpression();
        expression?.error ? this.errors.push(expression.error) : ast.push(expression);
      } 
      else 
      {
        // Skip unrecognized token
        this.errors.push(`Unrecognized token: ${this.tokens[0]?.value}`);
        this.tokens.shift();
      }
    }
    return { ast, errors: this.errors };
  }
  
  parseAssignment() 
  {
    const keyword = this.tokens.shift();
    const identifier = this.tokens.shift();
    const op = this.tokens.shift();
        
    if (op?.value !== "=") 
    {
      return { error: `Invalid assignment syntax near '${op?.value}'` };
    }
    const value = this.tokens.shift();
    // Check for semicolon
    let hasSemicolon = false;
    if (this.tokens.length > 0 && this.tokens[0]?.type === "punctuator" && this.tokens[0]?.value === ";") 
    {
      this.tokens.shift(); // Consume semicolon
      hasSemicolon = true;
    }
    if (!hasSemicolon) 
    {
      this.errors.push(`Missing semicolon after assignment of '${identifier.value}'`);
    }
    if (this.symbolTable[identifier.value]) 
    {
      return { error: `Error: Variable '${identifier.value}' already declared`,};
    }
    if (!this.isValidAssignment(value, keyword.value)) 
    {
      return {error: `Type mismatch assigning ${value?.value} to ${keyword.value}`,};
    }
    this.symbolTable[identifier.value] = { type: keyword.value };
    return {
      type: "Assignment",
      keyword: keyword.value,
      identifier: identifier.value,
      value: this.parseLiteralOrExpression(value),
    };
  }
  isValidAssignment(value, expectedType) 
    {
      if (expectedType === "int") 
      {
        return isInteger(value.value);
      }
      if (expectedType === "float") 
      {
        return isFloat(value.value);
      }
      if (expectedType === "String") 
      {
        return value.type === "literal";
      }
      if (expectedType === "boolean") 
      {
        return value.value === "true" || value.value === "false";
      }
      if (expectedType === "char") 
      {
        return value.type === "literal" && value.value.length === 3; // e.g., 'a'
      }
      if (expectedType === "void") 
      {
        return value.type === "literal" && value.value.length === 0; // e.g., void function
      }
      if (expectedType === "double") 
      {
        return isFloat(value.value);
      }
      return false;
    }

  isAssignment(tokens) 
  {
    const typeKeywords = ["int", "float", "String", "boolean", "char"]; // A Variable add For assignment
    return (
      tokens.length >= 3 &&
      typeKeywords.includes(tokens[0].value) && // ONLY type keywords
      tokens[1].type === "identifier" &&
      tokens[2].type === "operator" &&
      tokens[2].value === "="
    );
  }

  parseLiteralOrExpression(token) 
  {
    if (!token) 
    {
      return { error: "Missing token in expression" };
    }
    
    if (token.type === "constant" || token.type === "literal") 
    {
      return { type: "Literal", value: token.value };
    }
    else if (token.type === "identifier") 
    {
      return { type: "Variable", value: token.value };
    }
    return { error: `Unexpected token '${token.value}'` };
  }

  parseExpression() 
  {
    if (this.tokens.length < 3) 
    {
      this.errors.push("Incomplete expression");
      return { error: "Incomplete expression" };
    }

    const left = this.tokens.shift();
    const op = this.tokens.shift();
    const right = this.tokens.shift();
        
    // Check for semicolon
    let hasSemicolon = false;
    if (this.tokens.length > 0 && this.tokens[0]?.type === "punctuator" && this.tokens[0]?.value === ";") 
    {
      this.tokens.shift(); // Consume semicolon
      hasSemicolon = true;
    }
        
    if (!hasSemicolon && op.value !== "==") 
    { // Skip semicolon check for conditions
      this.errors.push(`Missing semicolon after expression`);
    }
      
    if (!op || op.type !== "operator") 
    {
      return { error: `Unexpected token '${op?.value}', expected operator` };
    }
        
    const leftParsed = this.parseLiteralOrExpression(left);
    const rightParsed = this.parseLiteralOrExpression(right);
        
    if (leftParsed.error || rightParsed.error) 
    {
      return { error: `Invalid expression: ${left.value} ${op.value} ${right.value}`};
    }
    return {
      type: "Expression",
      left: leftParsed,
      operator: op.value,
      right: rightParsed
    };
  }

  parseIfStatement() 
  {
    if (this.tokens[0]?.value !== "if") 
    {
      return null;
    }
    this.tokens.shift(); // Consume 'if'
    // Parse condition
    if (this.tokens[0]?.value !== "(") 
    {
      this.errors.push("Expected '(' after 'if'");
      return null;
    }
    this.tokens.shift(); // Consume '('
    const condition = this.parseCondition();
    if (this.tokens[0]?.value !== ")") 
    {
      this.errors.push("Expected ')' after condition");
      return null;
    }
    this.tokens.shift(); // Consume ')'
    // Parse then block
    const thenBranch = this.parseBlock();
    if (!thenBranch) 
    {
      return null;
    }
    const ifNode = 
    {
      type: "IfStatement",
      condition,
      thenBranch,
    };
    let elseIfBranches = [];
    while (this.tokens[0]?.value === "else") 
    {
      this.tokens.shift(); // Consume 'else'
      if (this.tokens[0]?.value === "if") 
      {
        const elseIfNode = this.parseIfStatement();
        if (elseIfNode) 
        {
          elseIfBranches.push(elseIfNode);
        }
      } 
      else 
      {
        const elseBlock = this.parseBlock();
        if (elseBlock) 
        {
          ifNode.elseBranch = elseBlock;
        }
        break;
      }
    }
    if (elseIfBranches.length > 0) 
    {
      ifNode.elseIfBranches = elseIfBranches;
    }
    return ifNode;
  }
      
  
  parseCondition() 
  {
    if (this.tokens.length < 3) 
    {
      this.errors.push("Incomplete condition");
      return null;
    }
    const left = this.tokens.shift();
    const operatorToken = this.tokens.shift();
    // Validate operator is a comparison operator
    const validOperators = ["==", "!=", "<", ">", "<=", ">="];
    if (!validOperators.includes(operatorToken.value)) 
    {
      this.errors.push(`Invalid comparison operator '${operatorToken.value}' in condition`);
    }
    const right = this.tokens.shift();
    return {
      type: "Condition",
      left: this.parseLiteralOrExpression(left),
      operator: operatorToken.value,
      right: this.parseLiteralOrExpression(right)
    };
  }
  
  parseBlock() 
  {
    if (this.tokens[0]?.value !== "{") 
    {
      this.errors.push("Expected '{'");
      return [];
    }   
    this.tokens.shift(); // Consume '{'
    const statements = [];
        
    while (this.tokens.length > 0 && this.tokens[0]?.value !== "}") 
    {
      // Check for loop statements
      if (this.tokens[0]?.type === "keyword" && ["for", "while", "do"].includes(this.tokens[0]?.value)) 
      {
        const loopStatement = this.parseLoop(this.tokens[0].value);
        if (loopStatement) 
        {
          statements.push(loopStatement);
        }
      }
      // Check for assignment
      else if (this.isAssignment(this.tokens)) 
      {
        const assignment = this.parseAssignment();
        assignment.error ? this.errors.push(assignment.error) : statements.push(assignment);
      }
      // Check for nested if statement
      else if (this.tokens[0]?.type === "keyword" && this.tokens[0]?.value === "if") 
      {
        const ifStatement = this.parseIfStatement();
        if (ifStatement) 
        {
          statements.push(ifStatement);
        }
      }
      // Check for method calls (e.g., System.out.println)
      else if (this.tokens.length >= 3 && this.tokens[0]?.type === "identifier" && this.tokens[1]?.value === "." && this.tokens[2]?.type === "identifier") 
      {
        const methodCall = this.parseMethodCall();
        if (methodCall) statements.push(methodCall);
      }
      // Check for other expression statements
      else if (this.tokens.length >= 3) 
      {
        const expr = this.parseExpression();
        expr?.error ? this.errors.push(expr.error) : statements.push(expr);
      } 
      else 
      {
        // If we have a stray semicolon, just consume it
        if (this.tokens[0]?.value === ";") 
        {
          this.tokens.shift();
          continue;
        }   
        // Skip unrecognized token
        this.errors.push(`Unrecognized token in block: ${this.tokens[0]?.value}`);
        this.tokens.shift();
      }
    }
        
    if (this.tokens.length === 0) 
    {
      this.errors.push("Unclosed block: Missing '}'");
    } 
    else
    {
      this.tokens.shift(); // Consume '}'
    }
    return statements;
  }
      
  parseStatement() 
  {
    if (this.tokens.length === 0) 
    {
      return null;
    }  
    // Loop statements
    if (this.tokens[0]?.type === "keyword" && ["for", "while", "do"].includes(this.tokens[0]?.value)) 
    {
      return this.parseLoop(this.tokens[0].value);
    }
    // Assignment
    if (this.isAssignment(this.tokens)) 
    {
      const assignment = this.parseAssignment();
      return assignment;
    }
    // If-statement
    if (this.tokens[0].value === "if") 
    {
      return this.parseIfStatement();
    }
    // Method Call (System.out.println)
    if (this.tokens[0]?.type === "identifier" && this.tokens[1]?.value === "." && this.tokens[2]?.type === "identifier" && this.tokens[3]?.value === "." && this.tokens[4]?.type === "identifier" && this.tokens[5]?.value === "(") 
    {
      const methodCall = this.parseMethodCall();   
      // Check for semicolon
      if (this.tokens[0]?.type === "punctuator" && this.tokens[0]?.value === ";") 
      {
        this.tokens.shift(); // Consume semicolon
      } 
      else 
      {
        this.errors.push("Missing semicolon after method call");
      }
      return methodCall;
    }
    // Fallback to basic expression
    const expr = this.parseExpression();
    return expr;
  }
  
  parseMethodCall() 
  {
    const objectParts = [];
    objectParts.push(this.tokens.shift().value); // First part (e.g., "System")
            
    // Continue collecting object parts until we find something that isn't a dot followed by an identifier
    while (this.tokens.length >= 2 && this.tokens[0].value === "." && this.tokens[1].type === "identifier") 
    {
      this.tokens.shift(); // Consume '.'
      objectParts.push(this.tokens.shift().value); // Add next part (e.g., "out")
    }
    // The last part is the method name (e.g., "println")
    const method = objectParts.pop(); 
    const object = objectParts.join(".");
            
    // Check for opening parenthesis
    if (this.tokens.length === 0 || this.tokens[0].value !== "(") 
    {
      this.errors.push(`Expected '(' after method name '${method}'`);
      return null;
    }
    this.tokens.shift(); // Consume '('
    // Parse arguments
    const args = [];
    while (this.tokens.length > 0 && this.tokens[0].value !== ")") 
    {
      // Handle arguments
      const arg = this.tokens.shift();
      args.push(this.parseLiteralOrExpression(arg));
      // Handle argument separators (commas)
      if (this.tokens[0]?.value === ",") 
      {
        this.tokens.shift(); // Consume ','
      }
    }
    if (this.tokens.length === 0) 
    {
      this.errors.push("Unclosed method call: Missing ')'");
      return {
        type: "MethodCall",
        object,
        method,
        arguments: args,
      };
    }
    this.tokens.shift(); // Consume ')'
    // Check for semicolon
    if (this.tokens.length > 0 && this.tokens[0]?.value === ";") 
    {
      this.tokens.shift(); // Consume ';'
    } 
    else 
    {
      this.errors.push(`Missing semicolon after method call to ${object}.${method}`);
    }
    return {
      type: "MethodCall",
      object,
      method,
      arguments: args,
    };
  }
          
  // Parse loop statements (for, while, do-while)
  parseLoop(loopType) 
  {
    if (loopType === "do") 
    {
      this.tokens.shift(); // Remove 'do'      
      // Parse body
      const body = this.parseBlock();
      if (!body) 
      {
        this.errors.push("Invalid body in do-while loop");
        return null;
      }
      // Check if the next token is 'while'
      if (this.tokens.length === 0 || this.tokens[0].value !== "while") 
      {
        this.errors.push("Expected 'while' after do block");
        return null;
      }
      this.tokens.shift(); // Remove 'while'
      if (this.tokens[0]?.value !== "(") 
      {
        this.errors.push("Expected '(' after 'while'");
        return null;
      }
            
      this.tokens.shift(); // Remove '('      
      // Parse condition
      const condition = this.parseCondition();
      if (!condition) 
      {
        this.errors.push("Invalid condition in do-while loop");
        return null;
      }
            
      if (this.tokens[0]?.value !== ")") 
      {
        this.errors.push("Expected ')' after condition in do-while loop");
        return null;
      }
      this.tokens.shift(); // Remove ')'
      // Check for semicolon
      if (this.tokens[0]?.value === ";") 
      {
        this.tokens.shift();
      } 
      else 
      {
        this.errors.push("Missing semicolon after do-while loop");
      }
      return {
        type: "DoWhileLoop",
        condition,
        body,
      };
    } 
    else if (loopType === "while") 
    {
      this.tokens.shift(); // Remove 'while'
      if (this.tokens[0]?.value !== "(") 
      {
        this.errors.push("Expected '(' after 'while'");
        return null;
      }
      this.tokens.shift(); // Remove '('
      // Parse condition
      const condition = this.parseCondition();
      if (!condition) 
      {
        this.errors.push("Invalid condition in while loop");
        return null;
      }
      if (this.tokens[0]?.value !== ")") 
      {
        this.errors.push("Expected ')' after condition in while loop");
        return null;
      }
      this.tokens.shift(); // Remove ')'
      // Parse body
      const body = this.parseBlock();
      if (!body) 
      {
        this.errors.push("Invalid body in while loop");
        return null;
      }
            
      return {
        type: "WhileLoop",
        condition,
        body,
      };
    }
    else if (loopType === "for") 
    {
      this.tokens.shift(); // Remove 'for'
      if (this.tokens[0]?.value !== "(") 
      {
        this.errors.push("Expected '(' after 'for'");
        return null;
      }
      this.tokens.shift(); // Remove '('
      // Parse initialization
      let init;
      if (this.isAssignment(this.tokens)) 
      {
        init = this.parseAssignment();
      } 
      else 
      {
        // Skip the initialization part
        while (this.tokens.length > 0 && this.tokens[0].value !== ";") 
        {
          this.tokens.shift();
        }
        init = { type: "EmptyStatement" };
        if (this.tokens.length === 0 || this.tokens[0].value !== ";") 
        {
          this.errors.push("Expected ';' after initialization in for loop");
          return null;
        }        
        this.tokens.shift(); // Remove ';'
      }
      // Parse condition
      let condition;
      if (this.tokens[0]?.value === ";") 
      {
        condition = { type: "EmptyStatement" };
        this.tokens.shift(); // Remove ';'
      } 
      else 
      {
        condition = this.parseCondition();
        if (this.tokens.length === 0 || this.tokens[0].value !== ";") 
        {
          this.errors.push("Expected ';' after condition in for loop");
          return null;
        }
        this.tokens.shift(); // Remove ';'
      }
      // Parse iteration expression
      let iteration;
      if (this.tokens[0]?.value === ")") 
      {
        iteration = { type: "EmptyStatement" };
      } 
      else 
      {
        // Parse iteration (i++, i+=1, etc.)
        if (this.tokens.length >= 2) 
        {
          const token1 = this.tokens[0];
          const token2 = this.tokens[1];
          // Handle i++ or i--
          if (token1?.type === "identifier" && token2?.value === "++" || token2?.value === "--") 
          {
            this.tokens.shift(); // identifier
            this.tokens.shift(); // ++ or --
            iteration = {
              type: token2.value === "++" ? "Increment" : "Decrement",
              operator: token2.value,
              argument: {
                type: "Variable",
                value: token1.value
              },
              form: "postfix"
            };
          } 
          // Handle ++i or --i
          else if ((token1?.value === "++" || token1?.value === "--") && token2?.type === "identifier") 
          {
            this.tokens.shift(); // ++ or --
            this.tokens.shift(); // identifier
            iteration = {
              type: token1.value === "++" ? "Increment" : "Decrement",
              operator: token1.value,
              argument: {
                type: "Variable",
                value: token2.value
              },
              form: "prefix"
            };
          }
          // Handle i+=1 or i-=1
          else if (this.tokens.length >= 3 && token1?.type === "identifier" && ["+=", "-=", "*=", "/="].includes(token2?.value)) 
          {
            const identifier = this.tokens.shift(); // identifier
            const operator = this.tokens.shift(); // += or -= etc.
            const value = this.tokens.shift(); // numeric value
            iteration = {
              type: "CompoundAssignment",
              operator: operator.value,
              left: {
                type: "Variable",
                value: identifier.value
              },
              right: this.parseLiteralOrExpression(value)
            };
          } 
          // Handle simple assignment i=i+1
          else if (this.tokens.length >= 5 && token1?.type === "identifier" && token2?.value === "=") 
          {
            // Parse as expression
            const left = this.tokens.shift();  // identifier
            const equals = this.tokens.shift(); // =
            const expr = this.parseExpression();
            iteration = {
              type: "Assignment",
              left: {
                type: "Variable",
                value: left.value
              },
              operator: "=",
              right: expr
            };
          } 
          else 
          {
            // Skip the iteration part
            while (this.tokens.length > 0 && this.tokens[0].value !== ")") 
            {
              this.tokens.shift();
            }
            iteration = { type: "EmptyStatement" };
          }
                      
          if (this.tokens.length === 0 || this.tokens[0].value !== ")") 
          {
            this.errors.push("Expected ')' after iteration expression in for loop");
            return null;
          }
          this.tokens.shift(); // Remove ')'
          // Parse body
          const body = this.parseBlock();
          if (!body) 
          {
            this.errors.push("Invalid body in for loop");
            return null;
          }            
          return {
            type: "ForLoop",
            init,
            condition,
            iteration,
            body,
          };
        }
      }
    }
  }
}