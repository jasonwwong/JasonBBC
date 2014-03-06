var currentToken;
var tokenIndex;
var cst;
var cstIndentationLevel;
var panicking;

function parse(){
  tokenIndex = 0;
  cst = "";
  cstIndentationLevel = -1;
  panicking = false;
  currentToken = getNextToken();
  parseProduction("Program");
  if (!panicking){
    if (tokenIndex < TOKENS.length){
      output("<br />Warning: Input found after EOF ignored");
    }
    output("<br />Concrete Syntax Tree<pre>{0}</pre>".format(cst));
    output("Symbol table<pre>{0}</pre>".format(JSON.stringify(SYMBOLS)));
    return true;
  }
  else{
    return false;
  }
}

// helper function that adds the production as a node in the cst
// and changes the indentation level before calling the actual parse function
// also allows parse to stop if we're panicking
function parseProduction(s){
  if (!panicking){
    cstIndentationLevel++;
    cst += formatNode(s);
    window["parse" + s]();
    cstIndentationLevel--;
  }
}

function getNextToken(){
  if (tokenIndex < TOKENS.length){
    return TOKENS[tokenIndex++];
  }
  var nullToken = new Token();
  nullToken.type = "end of input";
  nullToken.lineNumber = lineNumber;
  nullToken.linePosition = linePosition;
  return nullToken;
}

function formatNode(s){
  var tokenType = "T_" + s.toLowerCase();
  for (var i = 0; i < cstIndentationLevel; i++){
    s = "| " + s;
  }
  if (tokenType == currentToken.type && currentToken.value != null){
    if (tokenType == "T_charlist"){
      s += "(\"{0}\")".format(currentToken.value);
    }
    else{
      s += "({0})".format(currentToken.value);
    }
  }
  else if (tokenType == currentToken.type && currentToken.name != null){
    s += "({0})".format(currentToken.name);
  }
  return s + "\n";
}

function checkToken(expected){
  // don't check token if panicking
  if (!panicking){
  
    // default expecting message
    if (expected != "T_RBrace"){
      output("Expecting a {0}".format(expected), true);
    }
    // special case for RBrace to produce a more descriptive error
    else{
      output("Expecting a {0} or a statement".format(expected), true);
    }
    
    // special case for EOF not found
    if (expected == "T_EOF" && currentToken.type == "end of input"){
      output("Warning: EOF not found, inserting...");
      var token = new Token();
      token.type = "T_EOF";
      TOKENS.push(token);
      currentToken = getNextToken();
    }
    
    // current token is the one we expected
    if (currentToken.type == expected){
      output("Got a {0}".format(expected), true);
      if (currentToken.type == "T_id"){
        var needsInserting = true;
        for (var i = 0; i < SYMBOLS.length; i++){
          if (SYMBOLS[i].name == currentToken.name){
            needsInserting = false;
            break;
          }
        }
        if (needsInserting){
          var symbol = new Symbol();
          symbol.type = currentToken.type;
          symbol.name = currentToken.name;
          symbol.lineNumber = currentToken.lineNumber;
          symbol.linePosition = currentToken.linePosition;
          SYMBOLS.push(symbol);
          output("Added {0} to symbol table".format(currentToken.name), true);
        }
      }
    }
    // unexpected token
    else{
      // default error message
      if (expected != "T_RBrace"){
        output("Error at line {0} character {1}: expected {2}, got {3}".format(currentToken.lineNumber, currentToken.linePosition, expected, currentToken.type));
      }
      // special case for RBrace to produce a more descriptive error
      else{
        output("Error at line {0} character {1}: expected {2}, got {3}".format(currentToken.lineNumber, currentToken.linePosition, "[T_print | T_id | T_type | T_while | T_if | T_LBrace | T_RBrace]", currentToken.type));
      }
      panicking = true;
    }
    
    // consume next token if not eof
    if (currentToken.type != "T_EOF"){
      currentToken = getNextToken();
    }
  }
}

function parseProgram(){
  parseProduction("Block");
  checkToken("T_EOF");
}

function isBlock(){
  return currentToken.type == "T_LBrace";
}

function parseBlock(){
  checkToken("T_LBrace");
  parseProduction("StatementList");
  checkToken("T_RBrace");
}

function parseStatementList(){
  if (isStatement()){
    parseProduction("Statement");
    parseProduction("StatementList");
  }
  else{
    // epsilon production, do nothing
  }
}

function isStatement(){
  return (isPrintStatement() || isAssignmentStatement() || isVarDecl() || isWhileStatement() || isIfStatement() || isBlock());
}

function parseStatement(){
  if (isPrintStatement()){
    parseProduction("PrintStatement");
  }
  else if (isAssignmentStatement()){
    parseProduction("AssignmentStatement");
  }
  else if (isVarDecl()){
    parseProduction("VarDecl");
  }
  else if (isWhileStatement()){
    parseProduction("WhileStatement");
  }
  else if (isIfStatement()){
    parseProduction("IfStatement");
  }
  else if (isBlock()){
    parseProduction("Block");
  }
}

function isPrintStatement(){
  return currentToken.type == "T_print";
}

function parsePrintStatement(){
  checkToken("T_print");
  checkToken("T_LParen");
  parseProduction("Expr");
  checkToken("T_RParen");
}

function isAssignmentStatement(){
  return currentToken.type == "T_id";
}

function parseAssignmentStatement(){
  parseProduction("Id");
  checkToken("T_assignment");
  parseProduction("Expr");
}

function isVarDecl(){
  return currentToken.type == "T_type";
}

function parseVarDecl(){
  parseProduction("Type");
  parseProduction("Id");
}

function isWhileStatement(){
  return currentToken.type == "T_while";
}

function parseWhileStatement(){
  checkToken("T_while");
  parseProduction("BooleanExpr");
  parseProduction("Block");
}

function isIfStatement(){
  return currentToken.type == "T_if";
}

function parseIfStatement(){
  checkToken("T_if");
  parseProduction("BooleanExpr");
  parseProduction("Block");
}

function parseExpr(){
  if (isIntExpr()){
    parseProduction("IntExpr");
  }
  else if (isStringExpr()){
    parseProduction("StringExpr");
  }
  else if (isBooleanExpr()){
    parseProduction("BooleanExpr");
  }
  else if (isId()){
    parseProduction("Id");
  }
  else{
    output("Error at line {0} character {1}: expected {2}, got {3}".format(currentToken.lineNumber, currentToken.linePosition, "[T_digit | T_charlist | T_LParen | T_boolval | T_id]", currentToken.type));
    panicking = true;
  }
}

function isIntExpr(){
  return currentToken.type == "T_digit";
}

function parseIntExpr(){
  parseProduction("Digit");
  if (isIntop()){
    parseProduction("Intop");
    parseProduction("Expr");
  }
}

function isStringExpr(){
  return currentToken.type == "T_charlist";
}

function parseStringExpr(){
  parseProduction("CharList");
}

function isBooleanExpr(){
  return currentToken.type == "T_LParen" || isBoolval();
}

function parseBooleanExpr(){
  if (currentToken.type == "T_LParen"){
    checkToken("T_LParen");
    parseProduction("Expr");
    parseProduction("Boolop");
    parseProduction("Expr");
    checkToken("T_RParen");
  }
  else if (isBoolval()){
    parseProduction("Boolval");
  }
}

function isId(){
  return currentToken.type == "T_id";
}

function parseId(){
  checkToken("T_id");
}

function parseCharList(){
  checkToken("T_charlist");
}

function parseType(){
  checkToken("T_type");
}

function parseDigit(){
  checkToken("T_digit");
}

function parseBoolop(){
  checkToken("T_boolop");
}

function isBoolval(){
  return currentToken.type == "T_boolval";
}

function parseBoolval(){
  checkToken("T_boolval");
}

function isIntop(){
  return currentToken.type == "T_plus";
}

function parseIntop(){
  checkToken("T_plus");
}