var executable;
var stackPointer;
var heapPointer;
var statics;
var jumps;

function codegen(){
  executable = [];
  statics = [{temp: "T0 XX", varname: "temp", scope: 0, address: 0}];
  jumps = [];
  stackPointer = 0;
  heapPointer = 255;
  currentEnvNode = ENVIRONMENT;
  traverseAndGen(AST.children[0]);
  fillRestWithZeroes();
  output("<br />" + getExecutable());
  return true;
}

function traverseAndGen(node){
  // call the appropriate generation function
  if (node.children.length > 1){
    output("Generating code for " + node.contents.name);
    window["gen" + node.contents.name](node);
  }
  
  // block start, move the scope pointer down
  if (node.contents.name == "Block"){
    // index 0 always works since old nodes are deleted
    currentEnvNode = currentEnvNode.children[0];
  }
  
  // recurse on the children if not a statement
  if (node.contents.name.indexOf("Statement") == -1){
    for (var i = 0; i < node.children.length; i++){
      traverseAndGen(node.children[i]);
    }
  }
  
  // block end, move the scope pointer up
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
  if (!(s instanceof String)){
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
  // right side is not expression, no further evaluation required
  if (value.indexOf("Expr") == -1){
    if (value == "false"){
      value = "0";
    }
    else if (value == "true"){
      value == "1";
    }
    // not a string
    if (value.substr(0,1) != '"'){
      // a digit
      if ("1234567890".indexOf(value) != -1){
        value = toByte(value);
        // load acc from constant then store into memory
        insertCode("A9 {0} 8D {1}".format(value, lookUpTempCode(name, getScope(currentEnvNode))));
      }
      // an ID
      else{
        // load acc from memory then store into memory
        insertCode("AD {0} 8D {1}".format(lookUpTempCode(value, getScope(currentEnvNode)), lookUpTempCode(name, getScope(currentEnvNode))));
      }
    }
    // a string
    else{
      putStringInHeap(value.substr(1, value.length - 2));
      // load acc from constant then store into memory
      insertCode("A9 {0} 8D {1}".format(toByte(heapPointer), lookUpTempCode(name, getScope(currentEnvNode))));
    }
  }
  // right side is expression, call it
  else{
    node = node.children[1];
    // call the expression, which sets the acc to the result
    window["gen" + node.contents.name](node);
    // store acc into memory
    insertCode("8D " + lookUpTempCode(name, getScope(currentEnvNode)));
  }
}

function genWhileStatement(node){
  
}

function genIfStatement(node){
  
}

// postcondition: the accumulator has the result of the expression
function genIntExpr(node){
  output("Generating code for IntExpr");
  var digit = node.children[0].contents.name;
  var digit2 = node.children[2].contents.name;
  // top-level int expr, so the accumulator can simply be overwritten
  if (node.parent.contents.name.indexOf("Statement") != -1){
    // load acc from constant
    insertCode("A9 " + toByte(digit));
  }
  // nested int expr
  else{
    // store the acc in memory
    insertCode("8D T0 XX");
    // load the new digit into the acc
    insertCode("A9 " + toByte(digit));
    // add the old acc to the acc
    insertCode("6D T0 XX");
  }
  
  // right side is a number or id
  if ("1234567890".indexOf(digit2) != -1 || digit2.indexOf("Expr") == -1){
    insertCode("8D T0 XX");
    if ("1234567890".indexOf(digit2) != -1){
      insertCode("A9 " + toByte(digit2));
    }
    else{
      insertCode("AD T0 XX");
    }
    insertCode("6D T0 XX");
  }
  // right side is another intexpr, call it
  else{
    genIntExpr(node.children[2]);
  }
}

function genBooleanExpr(node){
  
}

function genBlock(node){
  
}