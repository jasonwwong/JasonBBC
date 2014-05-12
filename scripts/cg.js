var executable;
var stackPointer;
var heapPointer;
var statics;
var jumps;

function codegen(){
  executable = [];
  statics = [];
  jumps = [];
  stackPointer = 0;
  heapPointer = 255;
  currentEnvNode = ENVIRONMENT;
  traverseAndGen(AST.children[0]);
  fillRestWithZeroes();
  output(getExecutable());
  return true;
}

function traverseAndGen(node){
  if (node.children.length > 1){
    window["gen" + node.contents.name](node);
  }
  if (node.contents.name == "Block"){
    // index 0 always works since old nodes are deleted
    currentEnvNode = currentEnvNode.children[0];
  }
  for (var i = 0; i < node.children.length; i++){
    traverseAndGen(node.children[i]);
  }
  if (node.contents.name == "Block"){
    currentEnvNode = currentEnvNode.parent;
    // don't need info from old node anymore, get rid of it
    currentEnvNode.children.splice(0, 1);
  }
}

function insertCode(code){
  var codeArray = code.split(" ");
  for (var i = 0; i < codeArray.length; i++){
    executable[stackPointer] = codeArray[i];
    stackPointer++;
  }
}

function fillRestWithZeroes(){
  for (var i = stackPointer; i <= heapPointer; i++){
    executable[i] = "00";
  }
}

function getExecutable(){
  var output = "<pre>";
  for (var i = 0; i < executable.length; i++){
    if (i % 8 == 0){
      output += "\n";
    }
    output += executable[i] + " ";
  }
  return "</pre>" + output;
}

function genVarDecl(node){
  var type = node.children[0].contents.name;
  var n = statics.length + 1;
  var name = node.children[1].contents.name;
  statics.push({temp: "T{0} XX".format(n), varname: name, scope: getScope(currentEnvNode), address: 0});
  if (type == "int" || type == "boolean"){
    insertCode("A9 00 8D T{0} XX".format(n));
  }
}

function lookUpTempCode(varname, scope){
  for (var i = 0; i < statics.length; i++){
    if (statics[i].varname == varname && scope.indexOf(statics[i].scope) == 0){
      return statics[i].temp;
    }
  }
}

function toByte(s){
  if (s instanceof String){
    s = s + "";
  }
  var hex = parseInt(s).toString(16).toUpperCase();
  if (hex.length == 1){
    hex = "0" + hex;
  }
  return hex;
}

function genPrintStatement(node){
  
}

function putStringInHeap(s){
  heapPointer = heapPointer - s.length;
  for (var i = 0; i < s.length; i++){
    executable[heapPointer] = toByte(s.charCodeAt(i));
    heapPointer++;
  }
  executable[heapPointer] = "00";
  heapPointer = heapPointer - (s.length + 1);
}

function genAssignmentStatement(node){
  var name = node.children[0].contents.name;
  var value = node.children[1].contents.name;
  // raw value, no further evaluation required
  if (value.indexOf("Expr") == -1){
    if (value == "false"){
      value = "0";
    }
    else if (value == "true"){
      value == "1";
    }
    // not a string
    if (value.substr(0,1) != '"'){
      value = toByte(value);
      insertCode("A9 {0} 8D {1}".format(value, lookUpTempCode(name, getScope(currentEnvNode))));
    }
    // a string
    else{
      putStringInHeap(value.substr(1, value.length - 2));
      insertCode("A9 {0} 8D {1}".format(toByte(heapPointer), lookUpTempCode(name, getScope(currentEnvNode))));
    }
  }
}

function genWhileStatement(node){
  
}

function genIfStatement(node){
  
}

function genIntExpr(node){
  
}

function genBooleanExpr(node){
  
}

function genBlock(node){
  
}