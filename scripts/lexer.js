var tokenMatrix =
[ {"a": 1, "b": 3, "c": 1, "d": 1, "e": 1, "f": 4, "g": 1, "h": 1, "i": 5, "j": 1, "k": 1, "l": 1, "m": 1, "n": 1, "o": 1, "p": 25, "q": 1, "r": 1, "s": 6, "t": 7, "u": 1, "v": 1, "w": 8, "x": 1, "y": 1, "z": 1, "1": 2, "2": 2, "3": 2, "4": 2, "5": 2, "6": 2, "7": 2, "8": 2, "9": 2, "0": 2, "$": 9, "{": 10, "}": 11, "(": 12, ")": 13, "=": 14, "\"": 15, "!": 17, "+": 18}, // 0
  {"accept": "T_id"}, // 1
  {"accept": "T_digit", "1": 2, "2": 2, "3": 2, "4": 2, "5": 2, "6": 2, "7": 2, "8": 2, "9": 2, "0": 2}, // 2
  {"accept": "T_id", "o": 19}, // 3
  {"accept": "T_id", "a": 26}, // 4
  {"accept": "T_id", "f": 30, "n": 31}, // 5
  {"accept": "T_id", "t": 34}, // 6
  {"accept": "T_id", "r": 39}, // 7
  {"accept": "T_id", "h": 42}, // 8
  {"accept": "T_EOF"}, // 9
  {"accept": "T_LBrace"}, // 10
  {"accept": "T_RBrace"}, // 11
  {"accept": "T_LParen"}, // 12
  {"accept": "T_RParen"}, // 13
  {"accept": "T_assignment", "=": 46}, // 14
  {"a": 15, "b": 15, "c": 15, "d": 15, "e": 15, "f": 15, "g": 15, "h": 15, "i": 15, "j": 15, "k": 15, "l": 15, "m": 15, "n": 15, "o": 15, "p": 15, "q": 15, "r": 15, "s": 15, "t": 15, "u": 15, "v": 15, "w": 15, "x": 15, "y": 15, "z": 15, " ": 15, "\"": 16}, // 15
  {"accept": "T_charlist"}, // 16
  {"=": 47}, // 17
  {"accept": "T_plus"}, // 18
  {"o": 20}, // 19
  {"l": 21}, // 20
  {"e": 22}, // 21
  {"a": 23}, // 22
  {"n": 24}, // 23
  {"accept": "T_type"}, // 24
  {"accept": "T_id", "r": 48}, // 25
  {"l": 27}, // 26
  {"s": 28}, // 27
  {"e": 29}, // 28
  {"accept": "T_boolval"}, // 29
  {"accept": "T_if"}, // 30
  {"t": 32}, // 31
  {"accept": "T_type"}, // 32
  {"accept": "T_print"}, // 33
  {"r": 35}, // 34
  {"i": 36}, // 35
  {"n": 37}, // 36
  {"g": 38}, // 37
  {"accept": "T_type"}, // 38
  {"u": 40}, // 39
  {"e": 41}, // 40
  {"accept": "T_boolval"}, // 41
  {"i": 43}, // 42
  {"l": 44}, // 43
  {"e": 45}, // 44
  {"accept": "T_while"}, // 45
  {"accept": "T_boolop"}, // 46
  {"accept": "T_boolop"}, // 47
  {"i": 49}, // 48
  {"n": 50}, // 49
  {"t": 33} // 50
];
var inputIndex;
var lineNumber;
var linePosition;
var matrixPosition;
var startLinePosition;
var currentToken;

function lex(){
  inputIndex = 0;
  lineNumber = 1;
  linePosition = 0;
  matrixPosition = 0;
  startingLinePosition = -1;
  currentToken = "";
  var currentChar = nextChar();
  while (currentChar != ""){
    // found a valid state to move to
    if (currentChar in tokenMatrix[matrixPosition]){
      matrixPosition = tokenMatrix[matrixPosition][currentChar];
      currentToken += currentChar;
      if (startingLinePosition == -1){
        startingLinePosition = linePosition;
      }
    }
    // current character is not a state that can be moved to AND current state is accepting
    // create token and re-process the current character
    else if (tokenMatrix[matrixPosition][currentChar] == null && "accept" in tokenMatrix[matrixPosition]){
      var tokenType = tokenMatrix[matrixPosition]["accept"];
      var token = new Token();
      token.type = tokenType;
      token.lineNumber = lineNumber;
      token.linePosition = startingLinePosition;
      // assign names to identifiers
      if (tokenType == "T_id"){
        token.name = currentToken;
        output("Accepted token: {0}({1})".format(tokenType, token.name));
      }
      // assign values to enumerables
      else if (tokenType == "T_type" || tokenType == "T_boolop" || tokenType == "T_boolval" || tokenType == "T_digit"){
        token.value = currentToken;
        output("Accepted token: {0}({1})".format(tokenType, token.value));
      }
      else if (tokenType == "T_charlist"){
        // remove quotes from the token name
        token.value = currentToken.substr(1, currentToken.length - 2);
        output("Accepted token: {0}({1})".format(tokenType, token.value));
      }
      else{
        //output("Accepted token: {0}".format(JSON.stringify(token)));
        output("Accepted token: {0}".format(tokenType));
      }
      TOKENS.push(token);
      matrixPosition = 0;
      currentToken = "";
      continue;
    }
    // in the middle of creating a token and got an invalid character, panic
    else if (matrixPosition != 0){
      //output("Lex error at line {0} character {1}: unexpected character '{2}'".format(lineNumber, linePosition, currentChar));
      output("Lex error at line {0} character {1}: '{2}' is not a valid token".format(lineNumber, linePosition - currentToken.length, currentToken));
      return false;
    }
    currentChar = nextChar();
  }
  return true;
}

function nextChar(){
  // get the next character and advance the pointer
  var nextChar = INPUT.charAt(inputIndex++);
  if (nextChar == "\n"){
    lineNumber++;
    linePosition = 0;
  }
  else{
    linePosition++;
  }
  return nextChar;
}