var VERBOSE = true;
var INPUT = "";

function init(){
  var editor = ace.edit("editor");
  editor.getSession().setMode("ace/mode/c_cpp");
  $("#compile").on("click", function(){
    INPUT = editor.getValue();
    lex();
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