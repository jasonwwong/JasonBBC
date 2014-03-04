var currentToken;
var tokenIndex;

function parse(){
  tokenIndex = 0;
  currentToken = getNextToken();
  parseProgram();
  return true;
}

function getNextToken(){
  if (tokenIndex < TOKENS.length){
    return TOKENS[tokenIndex++];
  }
  return null;
}

function checkToken(expected){
  output("Expecting a {0}".format(expected));
  // special case for EOF
  if (expected == "T_EOF" && currentToken == null){
    output("Warning: EOF not found, inserting...");
    var token = new Token();
    token.type = "T_EOF";
    TOKENS.push(token);
    currentToken = getNextToken();
  }
  // general case
  if (currentToken.type == expected){
    output("Got a {0}".format(expected));
  }
  // unexpected token
  else{
    output("Error at line {0} character {1}: expected {2}, got {3}".format(currentToken.lineNumber, currentToken.linePosition, expected, currentToken.type));
    return;
  }
  // consume next token
  currentToken = getNextToken();
}

function parseProgram(){
  parseBlock();
  checkToken("T_EOF");
}

function isBlock(){
  return currentToken.type == "T_LBrace";
}

function parseBlock(){
  checkToken("T_LBrace");
  parseStatementList();
  checkToken("T_RBrace");
}

function parseStatementList(){
  if (isStatement()){
    parseStatement();
    parseStatementList();
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
    parsePrintStatement();
  }
  else if (isAssignmentStatement()){
    parseAssignmentStatement();
  }
  else if (isVarDecl()){
    parseVarDecl();
  }
  else if (isWhileStatement()){
    parseWhileStatment();
  }
  else if (isIfStatement()){
    parseIfStatement();
  }
  else if (isBlock()){
    parseBlock();
  }
}

function isPrintStatement(){
  return currentToken.type == "T_print";
}

function parsePrintStatement(){
  checkToken("T_print");
  checkToken("T_LParen");
  parseExpr();
  checkToken("T_RParen");
}

function isAssignmentStatement(){
  return currentToken.type == "T_id";
}

function parseAssignmentStatement(){
  parseId();
  checkToken("T_assignment");
  parseExpr();
}

function isVarDecl(){
  return currentToken.type == "T_type";
}

function parseVarDecl(){
  parseType();
  parseId();
}

function isWhileStatement(){
  return currentToken.type == "T_while";
}

function parseWhileStatement(){
  checkToken("T_while");
  parseBooleanExpr();
  parseBlock();
}

function isIfStatement(){
  return currentToken.type == "T_if";
}

function parseIfStatement(){
  checkToken("T_if");
  parseBooleanExpr();
  parseBlock();
}

function parseExpr(){
  if (isIntExpr()){
    parseIntExpr();
  }
  else if (isStringExpr()){
    parseStringExpr();
  }
  else if (isBooleanExpr()){
    parseBooleanExpr();
  }
  else if (isId()){
    parseId();
  }
}

function isIntExpr(){
  return currentToken.type == "T_digit";
}

function parseIntExpr(){
  parseDigit();
  if (isIntop()){
    parseIntop();
    parseExpr();
  }
}

function isStringExpr(){
  return currentToken.type == "T_quote";
}

function parseStringExpr(){
  checkToken("T_string");
}

function isBooleanExpr(){
  return currentToken.type == "T_LParen" || isBoolval();
}

function parseBooleanExpr(){
  if (currentToken.type == "T_LParen"){
    checkToken("T_LParen");
    parseExpr();
    parseBoolop();
    parseExpr();
    checkToken("T_RParen");
  }
  else if (isBoolval()){
    parseBoolval();
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

function parseIntop(){
  checkToken("T_plus");
}