var currentEnvNode;

function analyze(){
  ENVIRONMENT = new Node();
  ENVIRONMENT.contents = "Environment";
  currentEnvNode = ENVIRONMENT;
  traverse(CST);
  output("Symbol table:");
  printSymbolTable(ENVIRONMENT);
  return true;
}

function traverse(node){
  // block node, signifying the start of a block
  if (node.contents.name == "Block"){
    output("BLOCK START");
    var envNode = new Node();
    envNode.contents = [];
    // the number of parallel scopes there are to this block
    var parallelScopes = currentEnvNode.children.length + 1;
    envNode.contents["scopeLevel"] = parallelScopes;
    envNode.parent = currentEnvNode;
    currentEnvNode.children.push(envNode);
    currentEnvNode = envNode;
  }
  
  // statementlist node with no children, signifying the end of a block
  else if (node.contents.name == "StatementList" && node.children.length == 0){
    output("BLOCK END");
    currentEnvNode = currentEnvNode.parent;
  }
  
  // handle identifiers
  else if (node.contents.name == "Id"){
    var statement = node.parent.contents.name;
    var idname = node.contents.token.value;
    var idtype;
    
    // determine the type of the id
    if (statement == "VarDecl"){
      idtype = node.parent.children[0].contents.token.value;
    }
    else if (!inScope(currentEnvNode, idname)){
      output("Warning: uninitialized variable '{0}' used on line {1} character y".format(idname, node.contents.token.lineNumber));
      idtype = "?";
    }
    else{
      idtype = currentEnvNode.contents[idname];
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
        output("variable declared: {1} {0}".format(idname, idtype));
      }
      
      // variable redeclared
      else{
        output("Error: redeclared variable '{0}' on line {0} character y".format(idname, node.contents.token.lineNumber));
      }
    }
    
    // handle other variable uses
    else{
      output("variable referenced: {0}".format(idname));
    }
  }
  for (var i = 0; i < node.children.length; i++){
    traverse(node.children[i]);
  }
}

function printSymbolTable(node){
  if (node.contents != "Environment"){
    // iterate through the identifiers in each scope
    for (var key in node.contents){
      if (key != "scopeLevel" && node.contents.hasOwnProperty(key)){
        var token = node.contents[key];
        output("{0}: {1}, line {2}, character {3}, scope {4}".format(token.name, token.type, token.lineNumber, token.linePosition, getScope(node)));
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