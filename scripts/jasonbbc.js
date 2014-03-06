var VERBOSE = true;
var INPUT = "";
var TOKENS = [];
var SYMBOLS = [];

function init(){
  var editor = ace.edit("editor");
  editor.getSession().setMode("ace/mode/c_cpp");
  editor.getSession().setTabSize(2);
  editor.getSession().setUseSoftTabs(true);
  $("#compile").on("click", function(){
    INPUT = editor.getValue() + " ";
    var steps = ["lex", "parse"];
    clearOutput();
    TOKENS = [];
    output("Starting compilation");
    // call each step of the compilation process and terminate if one fails
    for (var i = 0; i < steps.length; i++){
      output("<hr />Starting {0}".format(steps[i]));
      if (window[steps[i]]()){
        output("{0} successful!".format(capitalize(steps[i])));
      }
      else{
        output("{0} failed".format(capitalize(steps[i])));
        output("<hr />Compilation failed");
        return;
      }
    }
  });
  $("#verbose").on("click", function(){
    if (VERBOSE){
      $("#verbose").text("Verbose: Off");
      VERBOSE = false;
    }
    else{
      $("#verbose").text("Verbose: On");
      VERBOSE = true;
    }
  });
}

function output(s){
  $("#output").append(s + "<br />\n");
}

function clearOutput(){
  $("#output").text("");
}

function capitalize(s){
  return s.substr(0,1).toUpperCase() + s.substr(1);
}

if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}