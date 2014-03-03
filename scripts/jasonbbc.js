var VERBOSE = true;
var INPUT = "";
var TOKENS = [];

function init(){
  var editor = ace.edit("editor");
  editor.getSession().setMode("ace/mode/c_cpp");
  $("#compile").on("click", function(){
    INPUT = editor.getValue();
    var steps = ["lex"];
    clearOutput();
    output("Starting compilation");
    // call each step of the compilation process and terminate if one fails
    for (var i = 0; i < steps.length; i++){
      output("Starting " + steps[i]);
      if (window[steps[i]]()){
        output("Successfully completed {0}".format(steps[i]));
      }
      else{
        output("Failed on ".format(steps[i]));
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