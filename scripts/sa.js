var currentEnvNode;

function analyze(){
  ENVIRONMENT = new Node();
  ENVIRONMENT.contents = "Environment";
  currentEnvNode = ENVIRONMENT;
  traverse(CST);
  return true;
}

function traverse(node){
  // block node, signifying the start of a block
  if (node.contents.name == "Block"){
    output("BLOCK START");
    var envNode = new Node();
    envNode.contents = [];
    envNode.parent = currentEnvNode;
    currentEnvNode.children.push(envNode);
    currentEnvNode = envNode;
  }
  // statementlist node with no children, signifying the end of a block
  else if (node.contents.name == "StatementList" && node.children.length == 0){
    output("BLOCK END");
    currentEnvNode = currentEnvNode.parent;
  }
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
    // put id in the environment
    if (statement == "VarDecl"){
      if (currentEnvNode.contents[idname] == null){
        currentEnvNode.contents[idname] = idtype;
        output("variable declared: {1} {0}".format(idname, idtype));
      }
      else{
        output("Error: redeclared variable '{0}' on line {0} character y".format(idname, node.contents.token.lineNumber));
      }
    }
    else{
      output("variable referenced: {0}".format(idname));
    }
  }
  for (var i = 0; i < node.children.length; i++){
    traverse(node.children[i]);
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