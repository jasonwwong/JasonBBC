var executable;
var stackPointer;
var heapPointer;
var statics;
var jumps;
var stackOverflow;

function codegen(){
  executable = [];
  statics = [{temp: "T1 XX", varname: "temp", scope: 0, vartype: "int", address: 0}];
  jumps = [];
  stackPointer = 0;
  heapPointer = 255;
  stackOverflow = false;
  currentEnvNode = ENVIRONMENT;
  var result = traverseAndGen(AST.children[0]);
  if (!result){
    return false;
  }
  backpatch();
  fillRestWithZeroes();
  output("<br />" + getExecutable());
  return true;
}

function traverseAndGen(node){
  // call the appropriate generation function on non-leaves
  if (node.children.length > 0){
    output("Generating code for " + node.contents.name);
    window["gen" + node.contents.name](node);
    if (stackOverflow){
      output("Error: stack overflow");
      return false;
    }
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
  
  return true;
}

function insertCode(code){
  var codeArray = code.split(" ");
  for (var i = 0; i < codeArray.length; i++){
    executable[stackPointer] = codeArray[i];
    stackPointer++;
    if (stackPointer >= heapPointer){
      stackOverflow = true;
    }
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
  statics.push({temp: "T{0} XX".format(n), varname: name, scope: getScope(currentEnvNode), vartype: type, address: 0});
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

function lookUpType(varname, scope){
  for (var i = 0; i < statics.length; i++){
    if (statics[i].varname == varname && scope.indexOf(statics[i].scope) == 0){
      return statics[i].vartype;
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
  var output = node.children[0].contents.name;
  // number
  if ("1234567890".indexOf(output) != -1){
    insertCode("A0 " + toByte(output));
    insertCode("A2 01 FF");
  }
  // string
  else if (output.substr(0,1) == '"'){
    putStringInHeap(output.substr(1, output.length - 2));
    // load acc into y reg
    insertCode("A0 " + toByte(heapPointer + 1));
    // syscall
    insertCode("A2 02 FF");
  }
  // id
  else if (output.indexOf("Expr") == -1){
    switch(lookUpType(output, getScope(currentEnvNode))){
      case "int":
      case "boolean":
        // load y reg from memory
        insertCode("AC " + lookUpTempCode(output, getScope(currentEnvNode)));
        // syscall
        insertCode("A2 01 FF");
        break;
      case "string":
        // load y reg from memory
        insertCode("AC " + lookUpTempCode(output, getScope(currentEnvNode)));
        // syscall
        insertCode("A2 02 FF");
        break;
    }
  }
  // expr
  else{
    node = node.children[0];
    // call the expression, which sets the acc to the result
    window["gen" + node.contents.name](node);
    // load acc into y reg
    insertCode("AC T1 XX");
    // syscall
    insertCode("A2 01 FF");
  }
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
      insertCode("A9 {0} 8D {1}".format(toByte(heapPointer + 1), lookUpTempCode(name, getScope(currentEnvNode))));
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
    insertCode("8D T1 XX");
    // load the new digit into the acc
    insertCode("A9 " + toByte(digit));
    // add the old acc to the acc
    insertCode("6D T1 XX");
  }
  
  // right side is a number or id
  if ("1234567890".indexOf(digit2) != -1 || digit2.indexOf("Expr") == -1){
    // save acc to memory
    insertCode("8D T1 XX");
    
    // number
    if ("1234567890".indexOf(digit2) != -1){
      // load acc from const
      insertCode("A9 " + toByte(digit2));
    }
    // id
    else{
      // load acc from memory
      insertCode("AD " + toByte(digit2));
    }
    
    // add memory to acc
    insertCode("6D T1 XX");
    // store acc in memory
    insertCode("8D T1 XX");
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

function backpatch(){
  output("Backpatching...");
  insertCode("00");
  for (var i = 1; i <= statics.length; i++){
    var hex = parseInt(stackPointer).toString(16).toUpperCase();
    while (hex.length < 4){
      hex = "0" + hex;
    }
    output("T{0} XX -> {1}".format(i, hex));
    for (var j = 0; j < executable.length; j++){
      if (executable[j] == "T" + i){
        var firstByte = hex.substr(2, 2);
        var secondByte = hex.substr(0, 2);
        executable[j] = firstByte;
        executable[j+1] = secondByte;
        
      }
    }
    insertCode("00");
  }
}