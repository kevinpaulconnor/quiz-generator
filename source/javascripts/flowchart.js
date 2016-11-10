(function ($) {
  // make sure to attach json object 'var input' with quiz data, and define 'var pubStylesheet'
  
  // variables
  var slug, currentRow, connectsTo, currentSlug, pub, number, lastRow;
  var questionNumber = 0;
  var separator = ",";
  altSeparator = "&";
  var formSelector = '.sqs-block-form';
  var touchsupport;
  var question = {
  	get current () {
  		return { number: this._number, text: this._text }
  	},
  	set current (state) {
  		this._number = state.number;
    	this._text = state.text;
  	}
  };
  var immigrantDefault = 'the intending immigrant';
  var immigrantName = '';
  var respondentName;

  var pageScroll = function(target) {
    $('html,body').animate({
       scrollTop: $(target).offset().top - 30
    }, 1000);
  };

  // get next slug to build question, disable previous question's buttons
  var getSlug = function(newslug, selection) {
    $(selection).addClass('flowchart-selected');
    trackEvent(
        'q' + questionNumber + '-selected-' + this.class,
        'Q' + questionNumber + ' selected ' + this.class);
    var parent = ($(selection).parent());
    var moveArrow = $(selection).position().left + 55;
    $(parent).after('<div style="position:absolute; left:' + moveArrow + 'px;" class="arrow-down">&darr;</div>');
    $('.flowchart-button').attr('disabled', true);
    slug = newslug;
    updateForm(selection);
    buildQuestion(slug);
  };

  // clean slug
  var cleanSlug = function(slug) {
    slug = slug.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return slug;
  };

  var compareSlug = function(slug) {
  	// there has got to be a better way to track state than iterating over the list of slugs every time, vox...
    for (var i = 0; i < input.length; i++) {
      currentSlug = cleanSlug(input[i].slug);
      if (currentSlug == slug) {
        currentRow = i;
        break;
      }
    }
  };

  // build question in flowchart - scrolldown enabled for all questions except the last one
  var buildQuestion = function(slug) {
    compareSlug(slug);
    var bigWindow = false;
    if ($(window).width() > 500) {
    	bigWindow = true;
    }
    var style = (bigWindow && currentRow != 0) ? "display:none;": '';
    var questionSelector = ".question-" + questionNumber
    $(".quiz-container").append("<div class='question-" + questionNumber + "' style='" + style + "'><div class='question'>" + thirdPersonPronounReplace(input[currentRow].text) + writeBullets() + moreInformation() + "</div></div>");
    if (currentRow != 0) {
      if (bigWindow) {
        $(questionSelector).fadeIn('slow');
      } else {
				pageScroll(questionSelector);
      }
    }
    // there is something that is awkward about this...
    if (touchsupport && input[currentRow].information != "") {
    	$(questionSelector + ' div.help')[0].addEventListener("touchstart", function() { $(questionSelector + ' .hover-content' ).addClass('touch') }, false);
      $(questionSelector  + ' div.help')[0].addEventListener("touchend", function() { $(questionSelector + ' .hover-content' ).removeClass('touch') }, false);
    }
    question.current = { number: questionNumber, text: input[currentRow].text }
    writeOptions(currentRow);
    trackEvent('q' + questionNumber + '-displayed', 'Q' + questionNumber + ' displayed');
  };
  
  var thirdPersonPronounReplace = function(text) {
  	replaceText = text;
  	if (immigrantName != '') {
  		replaceText = text.replace(immigrantDefault, immigrantName);
  	}
  	return replaceText
  }
  
  // might be a good idea to drive writeBullets and moreInformation from the same code
  // i.e. call addExtras() from buildQuestion - skip the returnText handling that way
  var writeBullets = function() {
  	returnText = "";
  	if (input[currentRow].bullets != "") {
  		returnText = '<ul>';
  		var bullets = input[currentRow].bullets.split(altSeparator);
  		for (var i=0; i < bullets.length;i++) {
  				returnText += '<li>'+ bullets[i] +'</li>'
  		}
		returnText += '</ul>'
  	}
  	return returnText
  };

	var moreInformation = function() {
  	returnText = "";
  	if (input[currentRow].information != "") {
  		returnText = '<div class="help"><img src="s/icon-help.svg"></div><div class="hover-content">'+ input[currentRow].information +'</div>';
  	}
  	return returnText
  };

  // write possible options to each question, handles multiple options
  var writeOptions = function(currentRow) {
    var row = input[currentRow];
    var connectsLabels = row.connectstext.split(separator);
    connectsTo = row.connectsto.split(separator);
    if (connectsTo[0] == 'END') {
      showForm();
    } else {
      for (var i = 0; i < connectsLabels.length; i ++) {
        $('.question-' + questionNumber).append("<button class='flowchart-button qq-button choice-" + questionNumber + "-" + i + "'>" + connectsLabels[i] + "</button>");
        $('.choice-' + questionNumber + '-' + i).on('click', getClass);
      }      
    }
    $('.question-' + questionNumber).fadeIn(400);
    questionNumber++;
  };

  var getClass = function () {
    var classes = $(this).attr('class').split(' ');
    number = classes[classes.length - 1].split('-');
    getSlug(cleanSlug(connectsTo[number[number.length- 1]]), this);
  };

  // restarts flowchart from beginning
  var restart = function() {
    $('.quiz-container').empty();
    pageScroll('.quiz-container');
    questionNumber = 0;
    slug = input[0].slug;
    buildQuestion(slug);
    trackEvent('restart', 'Flowchart restarted');
  };

	// scaffolding might be useful so i'm letting it stay for now
  function trackEvent(action, label) {
    if( typeof(ga) != 'undefined' ) {
      ga('send', 'event', 'flowchart', action, label);
    } else if (typeof(_gaq) != 'undefined' ){
      _gaq.push($.merge(['_trackEvent', 'flowchart'], arguments));
    }
  }

  // attach quiz and vertical-specific stylesheets
  $('head').append('<link rel="stylesheet" href="s/flowchart.css" type="text/css" />');
  // $('head').append('<link rel="stylesheet" href="/stylesheets/flowchart.css" type="text/css" />');
  $('head').append('<link rel="stylesheet" href="' + pubStylesheet + '" type="text/css" />');

  function unpackQuizHack() {
    var newInput = [];
    for ( var i = 0; i < input.length; i++ ) {
      newInput[i] = convertUrlinJson( input[i] );
    }
    input = newInput;
    slug = input[0].slug;
    slug = cleanSlug(slug);
    buildQuestion(slug);
  }

  function convertUrlinJson( data ) {
    $.each( data, function( key, value ) {
      if ( key == 'correct' || key == 'incorrect' || key =='text') {
        var j;
        var hexes = data[key].match(/.{1,4}/g) || [];
        var back = "";
        for( j = 0; j<hexes.length; j++ ) {
          back += String.fromCharCode( parseInt( hexes[j], 16 ) );
        }
        data[key] = back;
      }
    } );
    return data;
  }
  
  // might be nice to make this selector more flexible
  function showForm() {
  	$(formSelector).removeClass('hidden');
  }

  function hideForm() {
  	$(formSelector).addClass('hidden');
  }
  
  var updateForm = function (selection) {
  	var selector = 'input[name="SQF_QUESTION_' + question.current.number + '"]';
  	//enableInput(selector);
  	var initialValue = "QUESTION: " + question.current.text + ", ANSWER: " + selection.innerHTML 
  	var amendedValue = initialValue;
  	// squarespace email freaks out if you pass values of 100 characters or more
  	// so, truncate and prepend some ellipses
  	if (initialValue.length > 100) {
  		amendedValue = "..." + initialValue.substr((initialValue.length - 96), initialValue.length-1);
  	}
  	$(selector).val(amendedValue);
  }
  
  function renderNameInput(type) {
		return '<div class="field"><input class="field-element field-control" name="fname" x-autocompletetype="given-name" type="text" spellcheck="false" maxlength="30" data-title="'+type+'">'+'Name</div>';
	}
  
  function determineNames() {
  	  	$('.spacer-block').html('<fieldset class="names">'+
              '<div class="title">' + "What is the intended immigrant's name?" + '</div>' +
              renderNameInput('immigrant') + 
              renderSameName() +
              renderDifferentName() +
              '</fieldset>');
        setNameHandlers();
  }
  
  function renderSameName() {
  	return '<div class="title">' + "Are you the intended immigrant?" + '</div>' +
  					'<input name="same" type="radio" value="yes">Yes</input><input name="same" type="radio" value="no">No</input>';
  }
  
  function renderDifferentName() {
  	return '<div class="differentName hidden"><div class="title">What is your name?</div>' +
  		renderNameInput('respondent') + '</div>'
  }
  
  function setNameHandlers() {
  	$('input[name="same"]').click(function() {
  		immigrantName = $('input[data-title="immigrant"]').val();
 			$('input[name="SQF_IMMIGRANTNAME"]').val(immigrantName);
 			
  		if ($('input:radio[name="same"]:checked').val() == 'yes') {
  			$('fieldset.names').find('input').attr("disabled", "disabled");
  			$('input[name="SQF_RESPONDENTNAME"]').val(immigrantName);
  			unpackQuizHack();
  		}
  		if ($('input:radio[name="same"]:checked').val() == 'no') {
  			$('.differentName').removeClass("hidden");
  		}
  	});
  	$('.differentName input').blur(function(){
  		respondentName = $('input[data-title="respondent"]').val();
  		$('input[name="SQF_RESPONDENTNAME"]').val(respondentName);
  		// trying to do this in 'same' handler, but leave in case i need it
  		//$('input[name="SQF_IMMIGRANTNAME"]').val($('input[data-title="immigrant"]').val());
  		$('fieldset.names').find('input').attr("disabled", "disabled");
  		unpackQuizHack();
  	});
  }
  
  /*<fieldset id="name-yui_3_17_2_3_1478197886898_6043" class="form-item fields name required">
              <div class="title">Name <span class="required">*</span></div>
              <legend>Name</legend>
              
                <div class="field first-name">
                  <label class="caption"><input class="field-element field-control" name="fname" x-autocompletetype="given-name" type="text" spellcheck="false" maxlength="30" data-title="First">
                  First Name</label>
                </div>
                <div class="field last-name">
                  <label class="caption"><input class="field-element field-control" name="lname" x-autocompletetype="surname" type="text" spellcheck="false" maxlength="30" data-title="Last">
                  Last Name</label>
                </div>
              </fieldset>
  <input class="button sqs-system-button sqs-editable-button" type="button" value="Get Started">
  */
  
  // squarespace is providing the submit form so we don't have a lot of control.
  // we only want to send question data that we have with our emailed hidden inputs, so disable everything to start
  // but, squarespace email sends the disabled inputs into the email even if disabled, so
  // this isn't going to work. Keeping the apparatus around in case something presents itself
  // later.
  /*function disableHiddenInputs(){
  	$('input[type="hidden"]').attr("disabled", 'disabled');
  }
  
  function enableInput(selector) {
  	$(selector).removeAttr("disabled");
  } */ 
  
  $(document).ready(function(){
    trackEvent('loaded', 'Quiz is loaded');
    touchsupport = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0)
		if (!touchsupport){ // browser doesn't support touch
    	document.documentElement.className += " non-touch"
		}
		//disableHiddenInputs();
		hideForm();
		determineNames();	
    //unpackQuizHack();
  });
})(jQuery);