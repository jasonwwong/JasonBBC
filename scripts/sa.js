var currentEnvNode;
var currentAstNode;
var astIndentationLevel;

function analyze(){
  ENVIRONMENT = new Node();
  ENVIRONMENT.contents = "Environment";
  currentEnvNode = ENVIRONMENT;
  output("Starting scope and type check...");
  var analyzeSuccessful = analyzeNode(CST);
  if (analyzeSuccessful){
    output("Passed scope and type check!<br /><br />Symbol table:");
    printSymbolTable(ENVIRONMENT);
    output("<br />AST:");
    AST = new Node();
    AST.contents = "AST";
    currentAstNode = AST;
    buildAST(CST.children[0]);
    astIndentationLevel = -1;
    output("<pre>{0}</pre>".format(printAST(AST)));
    return true;
  }
  else{
    return false;
  }
}

function analyzeNode(node){
  // block node, signifying the start of a block
  if (node.contents.name == "Block"){
    var envNode = new Node();
    envNode.contents = [];
    // the number of parallel scopes there are to this block
    var parallelScopes = currentEnvNode.children.length + 1;
    envNode.contents["scopeLevel"] = parallelScopes;
    envNode.parent = currentEnvNode;
    currentEnvNode.children.push(envNode);
    currentEnvNode = envNode;
    output("Opening scope {0}".format(getScope(currentEnvNode)));
  }
  
  // statementlist node with no children, signifying the end of a block
  else if (node.contents.name == "StatementList" && node.children.length == 0){
    output("Closing scope {0}".format(getScope(currentEnvNode)));
    currentEnvNode = currentEnvNode.parent;
  }
  
  // handle identifiers
  else if (node.contents.name == "Id"){
    var statement = node.parent.contents.name;
    var idname = node.contents.token.value;
    var lineNumber = node.contents.token.lineNumber;
    var linePosition = node.contents.token.linePosition;
    var idtype;
    
    // determine the type of the id
    if (statement == "VarDecl"){
      idtype = node.parent.children[0].contents.token.value;
    }
    else if (!inScope(currentEnvNode, idname)){
      output("Warning: uninitialized variable '{0}' used on line {1} character {2}".format(idname, lineNumber, linePosition));
      idtype = "?";
    }
    else{
      idtype = getType(currentEnvNode, idname);
      setUsed(currentEnvNode, idname);
    }
    
    // handle variable declaration
    if (statement == "VarDecl"){
    
      // variable has not been previously declared in this scope, add it to the environment
      if (currentEnvNode.contents[idname] == null){
        // clone the token produced by the lexer, bringing over the linenumber and lineposition
        // http://stackoverflow.com/a/5344074
        var token = JSON.parse(JSON.stringify(node.contents.token));
        token.name = idname;
        token.type = idtype;
        token.value = null;
        currentEnvNode.contents[idname] = token;
        output("Variable declared: {1} {0}".format(idname, idtype));
      }
      
      // variable redeclared
      else{
        output("Error: redeclared variable '{0}' on line {1} character {2}".format(idname, lineNumber, linePosition));
        return;
      }
    }
    
    // typecheck expressions
    else if (statement == "Expr"){
      var typeOfExpression = node.parent.parent.contents.name;
      if (typeOfExpression == "IntExpr" && idtype != "int"){
        output("Error: type mismatch on line {0} character {1}, expected {2} to be int, was {3}".format(lineNumber, linePosition, idname, idtype));
        return false;
      }
      else if (typeOfExpression == "BooleanExpr"){
        var tokenBeingComparedTo = node.parent.parent.children[2].children[0];
        var expectedType = tokenBeingComparedTo.contents.name;
        if (expectedType == "Id"){
          expectedType = tokenBeingComparedTo.type;
        }
        else{
          // trim off the "Expr" from token name, e.g. "StringExpr"
          expectedType = expectedType.substr(0, expectedType.length - 4).toLowerCase();
        }
        if (idtype != expectedType && (idtype != "?" && expectedType != "?")){
          output("Error: type mismatch on line {0} character {1}, expected {2} to be {3}, was {4}".format(lineNumber, linePosition, idname, expectedType, idtype));
          return false;
        }
        else{
          output("Type check passed: {0} == {1}".format(idtype, expectedType));
        }
      }
    }
    
    // typecheck assignments
    else if (statement == "AssignmentStatement"){
      var tokenBeingComparedTo = node.parent.children[1].children[0];
      var expectedType = tokenBeingComparedTo.contents.name;
      if (expectedType == "Id"){
        expectedType = tokenBeingComparedTo.type;
      }
      else{
        // trim off the "Expr" from token name, e.g. "StringExpr"
        expectedType = expectedType.substr(0, expectedType.length - 4).toLowerCase();
      }
      if (idtype != expectedType && (idtype != "?" && expectedType != "?")){
        output("Error: type mismatch on line {0} character {1}, expected {2} to be {3}, was {4}".format(lineNumber, linePosition, idname, expectedType, idtype));
        return false;
      }
      else{
        output("Type check passed: {0} == {1}".format(idtype, expectedType));
      }
    }
  }
  for (var i = 0; i < node.children.length; i++){
    var analyzeSuccessful = analyzeNode(node.children[i]);
    if (!analyzeSuccessful){
      return false;
    }
  }
  return true;
}

function printSymbolTable(node){
  if (node.contents != "Environment"){
    // iterate through the identifiers in each scope
    for (var key in node.contents){
      if (key != "scopeLevel" && node.contents.hasOwnProperty(key)){
        var token = node.contents[key];
        var used = "";
        if (token.used == false){
          used = "un";
        }
        output("{0}: {1}, line {2}, character {3}, scope {4}, {5}used".format(token.name, token.type, token.lineNumber, token.linePosition, getScope(node), used));
      }
    }
  }
  if (node.children != null){
    for (var i = 0; i < node.children.length; i++){
      printSymbolTable(node.children[i]);
    }
  }
}

function inScope(node, idname){
  if (node.contents[idname] != null){
    return true;
  }
  else if (node.parent != null){
    return inScope(node.parent, idname);
  }
  else{
    return false;
  }
}

function getScope(node){
  if (node.parent.contents == "Environment"){
    return "1";
  }
  else{
    return getScope(node.parent) + "." + node.contents["scopeLevel"];
  }
}

function getType(node, idname){
  if (node.contents[idname] != null){
    return node.contents[idname].type;
  }
  else if (node.parent != null){
    return getType(node.parent, idname);
  }
  else{
    return false;
  }
}

function setUsed(node, idname){
  if (node.contents[idname] != null){
    node.contents[idname].used = true;
    output("Variable used: {0}, declared in scope {1}".format(idname, node.contents["scopeLevel"]));
  }
  else if (node.parent != null){
    setUsed(node.parent, idname);
  }
}

function buildAST(node){
  if (node.contents.name == "Block" || node.contents.name == "WhileStatement" || node.contents.name == "IfStatement"){
    insertNewAstNode(node.contents.name);
  }
  else if (node.contents.name == "PrintStatement"){
    insertNewAstNode("Print");
    insertNewAstNode(getNameOfLeaf(node));
    currentAstNode = currentAstNode.parent.parent;
    return;
  }
  else if (node.contents.name.substr(-9) == "Statement" && node.contents.name.length > 9){
    insertNewAstNode(node.contents.name);
    insertNewAstNode(getNameOfLeaf(node.children[0]));
    currentAstNode = currentAstNode.parent;
    insertNewAstNode(getNameOfLeaf(node.children[1]));
    currentAstNode = currentAstNode.parent.parent;
    return;
  }
  else if (node.contents.name == "VarDecl"){
    insertNewAstNode("VarDecl");
    insertNewAstNode(getNameOfLeaf(node.children[0]));
    currentAstNode = currentAstNode.parent;
    insertNewAstNode(getNameOfLeaf(node.children[1]));
    currentAstNode = currentAstNode.parent.parent;
    return;
  }
  else if (node.contents.name == "BooleanExpr"){
    if (node.children[1] != null){
      insertNewAstNode(node.children[1].contents.token.value);
      insertNewAstNode(getNameOfLeaf(node.children[0]));
      currentAstNode = currentAstNode.parent;
      insertNewAstNode(getNameOfLeaf(node.children[2]));
      currentAstNode = currentAstNode.parent.parent;
    }
    else{
      insertNewAstNode(node.children[0].contents.token.value);
      currentAstNode = currentAstNode.parent.parent;
    }
    return;
  }
  for (var i = 0; i < node.children.length; i++){
    buildAST(node.children[i]);
  }
}

function printAST(node){
  var output = "";
  if (astIndentationLevel >= 0){
    output += formatAstNode(node.contents);
  }
  astIndentationLevel++;
  for (var i = 0; i < node.children.length; i++){
    output += printAST(node.children[i]);
  }
  astIndentationLevel--;
  return output;
}

function formatAstNode(c){
  var s = c.name;
  if (astIndentationLevel > 0){
    for (var i = 0; i < astIndentationLevel; i++){
      s = "| " + s;
    }
  }
  return s + "\n";
}

function insertNewAstNode(contents){
  var astNode = new Node();
  astNode.contents = [];
  astNode.contents.name = contents;
  astNode.parent = currentAstNode;
  currentAstNode.children.push(astNode);
  currentAstNode = astNode;
}

function getNameOfLeaf(node){
  if (node.children.length == 0){
    if (node.contents.name == "CharList"){
      return '"{0}"'.format(node.contents.token.value);
    }
    else{
      return node.contents.token.value;
    }
  }
  else return getNameOfLeaf(node.children[0]);
}