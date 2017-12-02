//Attach wave effect to buttons and other elements
Waves.attach(".btn");
Waves.init();

$('.btn').mouseup(function() { this.blur() });

//Get title of current page and set it on the bottom navigation
chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
	var activeTab = arrayOfTabs[0];
	pageTitle = activeTab.title;
	$("#bottomNav h1").text(pageTitle.trimToLength(40));
});

//Scroll to bottom of chat page each time popup is opened
$(".containerComments").scrollTop($(".containerComments")[0].scrollHeight);

//Autosize textarea for new comments
autosize($('#newComment'));
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

//Disable/enable scrolling on comments when friends dropup is opened/closed
$(".input-group-btn").on("shown.bs.dropdown", function(){
	$(".containerComments").attr("style", "overflow:hidden!important;");
});
$(".input-group-btn").on("hide.bs.dropdown", function(){
	$(".containerComments").attr("style", "");
});

$(document).on("click", "#friendListCheckboxes input", function(){
	$("#checkFriends").removeAttr("checked");
});

//Toggle display of privacy settings when clicking button
$(document).on("click", "#privacyBtn", function(){
	if ($("#privacySettings").is(":visible")) {
		$("#privacyCaret").removeClass("fa-caret-up");
		$("#privacyCaret").addClass("fa-caret-down");
	}
	else {
		$("#privacyCaret").removeClass("fa-caret-down");
		$("#privacyCaret").addClass("fa-caret-up");
	}
	$("#privacySettings").slideToggle();
});


//When user selects "all friends" in privacy options
$(document).on("change", "#publicMessage", function(){
	if ($('#publicMessage').is(':checked')) {
		$("#privacyIcon").removeClass("fa-user-secret");
		$("#privacyIcon").addClass("fa-users");
		$("#tagFriendsNav").css("background-color", "#2196F3");
		$("#btnTags").removeClass("btnTagsPrivate");
	}
});

//When user selects "only tagged friends" in privacy options
$(document).on("change", "#privateMessage", function(){
	if ($('#privateMessage').is(':checked')) {
		$("#privacyIcon").removeClass("fa-users");
		$("#privacyIcon").addClass("fa-user-secret");
		$("#tagFriendsNav").css("background-color","#424242");
		$("#btnTags").addClass("btnTagsPrivate");
	}
});

//When friends checkbox is checked, disable other checkboxes (or enable when unchecked)
// $(document).on("click", "#checkFriends", function(){
// 	if ($('#checkFriends').is(':checked')) {
// 		$("#friendListCheckboxes input").attr("disabled", true);
// 		$("#friendListCheckboxes .dropdown-item").addClass("disabled");
// 	}
// 	else {
// 		$("#friendListCheckboxes input").attr("disabled", false);
// 		$("#friendListCheckboxes .dropdown-item").removeClass("disabled");
// 	}
// });

//Hide irrelevant comments when reply button is clicked
$(document).on("click", ".replyBtn", function(){
	//Remove tags from previously hidden comments
	$(".commentGroup").removeClass("hiddenComment");
	// Get tagged ids from html
	var commentIds = $(this).parent().parent().attr("class").split(' ')[1];
	//Get tagged names from html
	var commentNames = $(this).parent().siblings("p").text().split(', ');
	//Scroll down with animation
	$(".containerComments").animate({ scrollTop: $("#formNewComments").height() }, 200, function(){
		//Adapt scrolling settings
		$("#formNewComments").removeClass("commentsScroll");
		$("#formNewComments").addClass("commentsNoScroll");
		//Hide comments that don't match tagged ids
		$(".commentGroup").not("."+commentIds).slideToggle(200, function(){
			//Fix scrolling settings if necessary
			if ($("#formNewComments").height() > 425) {
			$("#formNewComments").removeClass("commentsNoScroll");
			$("#formNewComments").addClass("commentsScroll");
			$(".containerComments").scrollTop($(".containerComments")[0].scrollHeight);
			}
		});
	});
	//Tag comments to be hidden with "hiddenComment" class
	$(".commentGroup").not("."+commentIds).addClass("hiddenComment");
	//Fade out comments to be hidden
	$(".commentGroup").not("."+commentIds).animate({ opacity: 0 });
	$("#closeFriends").show();
	$("#bottomNav p").text("");
	$(".replyBtn").animate({ opacity: 0 });
	$(".replyBtn").siblings().animate({ opacity: 0 });
	$(".replyBtn").slideToggle();
	$(".replyBtn").siblings().slideToggle();
	
	//Add names selected to title of bottomNav
	var bottomNavTitle = "";  
	for(i=0; i < commentNames.length; i++) {
		if (i == commentNames.length - 1) {
		 	bottomNavTitle = bottomNavTitle + commentNames[i].split(' ')[0];
		}
		else {
		 	bottomNavTitle = bottomNavTitle + commentNames[i].split(' ')[0] + ", ";
		}
	}
	$("#bottomNav h1").text(bottomNavTitle.trimToLength(40));
	//Change colors of bottomNav
	$("#bottomNav").addClass("replying");

	//Check checkboxes of users tagged
	arrayIds = commentIds.split('-');
	for(i=0; i < arrayIds.length; i++) {
		$("#"+arrayIds[i]).attr("checked", "checked");
	}

	//Disable friendlist checkboxes
	$("#friendsListDropdown input").attr("disabled", true);
	$("#friendsListDropdown .dropdown-item").addClass("disabled");

	//Change text on textarea and focus
	$("#newComment").attr("placeholder", "Type a reply");
	$("#newComment").focus();

});

$(document).on("click", "#closeFriends", function(){
	//Fade in hidden comments
	$(".hiddenComment").css({ opacity: 100 });
	//Fix scrolling settings
	$("#formNewComments").removeClass("commentsScroll");
	$("#formNewComments").addClass("commentsNoScroll");
	//Show hidden comments
	$(".hiddenComment").slideToggle(200, function(){
		//Fix scrolling settings
		if ($("#formNewComments").height() > 425) {
			$("#formNewComments").removeClass("commentsNoScroll");
			$("#formNewComments").addClass("commentsScroll");
			$(".containerComments").scrollTop($(".containerComments")[0].scrollHeight);
		}
	});
	$(".replyBtn").show();
	$(".replyBtn").siblings().show();
	$(".replyBtn").animate({ opacity: 100 });
	$(".replyBtn").siblings().animate({ opacity: 100 });
	$("#closeFriends").hide();
	$("#bottomNav h1").text(pageTitle.trimToLength(40));
	$(".form-check-input").removeAttr("checked");

	//Enable checkboxes
	$("#friendsListDropdown input").attr("disabled", false);
	$("#friendsListDropdown .dropdown-item").removeClass("disabled");

	//Change text on textarea
	$("#newComment").attr("placeholder", "Comment on this web page");

	//Change colors of bottomNav back
	$("#bottomNav").removeClass("replying");
});

//This function allows for trimming of strings
String.prototype.trimToLength = function(m) {
  return (this.length > m) 
    ? jQuery.trim(this).substring(0, m).split(" ").slice(0, -1).join(" ") + "..."
    : this;
};

