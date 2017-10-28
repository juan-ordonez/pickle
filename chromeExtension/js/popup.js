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

//Post new comment 
$(document).on("click", "#submitComment", function(){
	//Retrieve comment entered by user
	var comment = $("#newComment").val();
	var user = "Juan"
	var profilePic = "https://scontent-lax3-1.cdninstagram.com/t51.2885-19/s320x320/16583473_379492249096678_5400214466052751360_a.jpg"
	//Check if comment is not empty
	if (comment !== "") {
		//Append new comment
		$("#commentsBody").append('<div class="commentGroup"><div class="d-flex flex-nowrap align-items-center"><div class="thumbnail align-self-start"><img src='+profilePic+'></div><div class="chatBubble"><strong>'+user+'</strong> '+comment+' </div><div class="likeButton"><a href="#"><i class="fa fa-heart"></i> 22</a></div></div></div>');
		//Scroll to bottom of window
		$(".containerComments").scrollTop($(".containerComments")[0].scrollHeight);
		//Clear textarea
		$("#newComment").val("");
	}
});

//Like a comment
$(document).on("click", ".likeButton", function(){
	var likes = 22;
	$likeButton = $(this).children("a");
	if ($likeButton.hasClass("active") !== false) {
		//Decrease number of likes
		likes = likes;
		$(this).replaceWith('<div class="likeButton"><a href="#"><i class="fa fa-heart"></i> '+likes+'</a></div>')
	}
	else {
		//Increment number of likes
		likes = likes + 1;
		$(this).replaceWith('<div class="likeButton"><a href="#" class="active"><i class="fa fa-heart"></i> '+likes+'</a></div>')
	}
});

//Prevent dropup from auto-closing
$(document).on('click', '#formNewComments .dropdown-menu', function (e) {
  e.stopPropagation();
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