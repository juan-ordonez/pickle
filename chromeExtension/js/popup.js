//Attach wave effect to buttons and other elements
Waves.attach(".btn");
Waves.init();

$('.btn').mouseup(function() { this.blur() });

//Scroll to bottom of chat page each time popup is opened
$(".containerComments").scrollTop($(".containerComments")[0].scrollHeight);

//Autosize textarea for new comments
autosize(document.querySelectorAll('#newComment'));
//Scroll to bottom of page after each textarea resize
$('#newComment').each(function(){
  autosize(this);
}).on('autosize:resized', function(){
  $(".containerComments").scrollTop($(".containerComments")[0].scrollHeight);
});

//Press enter to submit textarea, Shift+enter for new line
$("#newComment").keypress(function (e) {
    if(e.which == 13 && !e.shiftKey) {        
        //$(this).closest("form").submit();
        $("#submitComment").trigger("click");
        e.preventDefault();
        return false;
    }
});

//Prevent dropup from auto-closing
$(document).on('click', '#formNewComments .dropdown-menu', function (e) {
  e.stopPropagation();
});


$(document).on("click", "#friendListCheckboxes input", function(){
	$("#checkFriends").removeAttr("checked");
});
//When friends checkbox is checked, disable other checkboxes (or enable when unchecked)
$(document).on("click", "#checkFriends", function(){
	if ($('#checkFriends').is(':checked')) {
		$("#friendListCheckboxes input").attr("disabled", true);
		$("#friendListCheckboxes .dropdown-item").addClass("disabled");
	}
	else {
		$("#friendListCheckboxes input").attr("disabled", false);
		$("#friendListCheckboxes .dropdown-item").removeClass("disabled");
	}
});