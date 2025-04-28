
const inputWrite = document.getElementById("inputWrite");
const outputWrite = document.getElementById("outputWrite");
const astOutput = document.getElementById("astOutput");
const errorOutput = document.getElementById("errorOutput");
const convertButton = document.querySelector(".convert-button");

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

convertButton.addEventListener("click", () => {
  const input = inputWrite.value.trim();
  outputWrite.value = "";
  astOutput.textContent = "";
  errorOutput.innerHTML = "";

  const results = analyzeAndParse(input);
  displayOutput(results.lexOutput);
  displayAST(results.ast);
  displayErrors(results.errors);
});

function analyzeAndParse(input) {
  // Simulating the lexical analysis and AST generation
  let lexOutput = "";
  let ast = [];
  let errors = [];

  if (input.startsWith("import") || input.includes("def")) {
    // Assuming this is Python-like code
    const pythonResults = analyzePython(input);
    lexOutput = pythonResults.lexOutput;
    ast = pythonResults.ast;
    errors = pythonResults.errors;
  } else if (input.includes("{") || input.includes("int")) {
    // Assuming this is C-like code
    const cResults = analyzeC(input);
    lexOutput = cResults.lexOutput;
    ast = cResults.ast;
    errors = cResults.errors;
  } else {
    errors.push({ type: "syntax", message: "Unrecognized language" });
  }

  return { lexOutput, ast, errors };
}

function analyzeC(input) {
  const lexOutput = display("C Lexical Output", ["int", "return", "printf"], 3);
  const ast = [
    { type: "declaration", value: "int main() { return 0; }" },
    { type: "function", value: "int main()" }
  ];
  const errors = [];  // Add any syntax errors if found

  return { lexOutput, ast, errors };
}

// Utility function to display unique lexical tokens
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
}