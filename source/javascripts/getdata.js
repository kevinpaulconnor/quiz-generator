(function ($) {
  var key, pub, quizType;

  // initialize tabletop library
  function init() {
  		Tabletop.init( { key: url,
                     callback: readData,
                     simpleSheet: true } );
  	}

  function readData(data, tabletop) {
  	input = [];
  	for ( var i = 0; i < data.length; i++ ) {
  		input[i] = findUrlinObject( data[i] );
  	}
    //console.log(input);
  	embed(input);
  }

  function findUrlinObject ( data ) {
  	$.each( data, function( key, value ){
  		if ( key == 'correct' || key == 'incorrect' || key == 'text') {
  			data[key] = converttoHex( data[key] );
  		}
  	} );
  	return data;
  }

  function converttoHex ( string ) {
  	var hex, i;
  	var result = "";
  	for ( i = 0; i < string.length; i++ ) {
  		hex = string.charCodeAt( i ).toString( 16 );
  		result += ( "000" + hex ).slice( -4 );
  	}
  	return result;
  }

  function submitquiz() {
  		$('.quiz-container').empty();
  		buildflowchart();
  }

  function embed(input) {
    $("#embedcode").html("&lt;div class='quiz-container'></div>&lt;script type='text/javascript'>window.jQuery || document.write(\"&lt;script src='//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js'>&lt;&#92;/script>\");&lt;/script>&lt;script type='text/javascript'>var input = " + JSON.stringify(input) + "; var pubStylesheet = 's/quiz-vox.css'; var pub = 'vox'; &lt;/script>&lt;script src='s/flowchart.js'>&lt;/script>");
  }

  function googleSpreadsheetHack(url) {
  	// published spreadsheet urls have changed. translate into
  	// https://docs.google.com/spreadsheet/pub?key=$KEY&output=html
  	// format, which seems to be what tabletop.js finds acceptable
  	// It's probably possible to hack into tabletop to fix, but I'm going
  	// to pass it what it's used to. fragile!
  	var split = url.split("/");
  	var key = split[5] 	
  	return 'https://docs.google.com/spreadsheet/pub?key='+key+'&output=html'
  }

  function buildflowchart() {
    url = googleSpreadsheetHack($('#url').val());
    init();
  }

  $(document).ready(function() {
    $('#build').on('click', function(){
          submitquiz();
    })
  })  
})(jQuery);