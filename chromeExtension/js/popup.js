//Attach wave effect to buttons and other elements
Waves.attach(".btn");
Waves.init();

$('.btn').mouseup(function() { this.blur() });

if (window.location.href == chrome.extension.getURL('settings.html')){
	$(document).on("click", ".backBtn", function(){
		//chrome.browserAction.setPopup({popup : "popup.html"});
		window.location.href = chrome.extension.getURL(history.back());
	});
}

$(document).on("click", ".deletePost", function(){
	$(this).parent().parent().parent().animate({ opacity: 0 }, function(){
		$(this).slideToggle();
	});
});

$(document).on("click", ".hidePost", function(){
	$(this).parent().parent().parent().animate({ opacity: 0 }, function(){
		$(this).slideToggle();
	});
});

if (window.location.href == chrome.extension.getURL("userProfile.html")) {
	 chrome.storage.local.get(["previousPage", "previousUrl", "profileName"], function(result){
	 	$("#"+result.previousPage).addClass("active");
	 	console.log(result.previousUrl);
	 	$(".backBtn").prop("href", result.previousUrl);
	 	$("#topNav h1").text(result.profileName);
	 });
	 
}

if (window.location.href == chrome.extension.getURL("newsfeed.html") || window.location.href == chrome.extension.getURL("popup.html")) {
	if (window.location.href == chrome.extension.getURL("newsfeed.html")) {
		var newsfeed = true;
	} else {
		var newsfeed = false;
	}
	//Autosize textarea for new comments
	autosize($('#newComment'));

	//Drawer
	$(document).on("click", ".hamburger", function(){
		toggleDrawer();
	});
	$(document).on("click", ".groupTitle", function(){
		if ($(".drawer").hasClass("hidden")) {
			toggleDrawer();
		}
	});
	$(document).on("click", ".closeDrawerArea", function(){
		if (!$(".drawer").hasClass("hidden")) {
			toggleDrawer();
		}
	});
	$(document).on("click", ".drawerLink", function(){
		$(".drawerLink").removeClass("active");
		$(this).addClass("active");
		$(".groupTitle").text($(this).text());
		var id = $(this)[0].id;
		chrome.storage.local.set({"currentGroup" : id}, function () {
			console.log(id);

		});
		console.log(window.location.href);
		toggleDrawer();
		if (newsfeed) {
			window.location.replace("newsfeed.html");
		} else {
			window.location.replace("popup.html");
		}
	});

}

if (window.location.href == chrome.extension.getURL("createGroup.html")) {
	$(document).on("change", ":checkbox", function(){
		var checked = [];
		$("input:checked").each(function(){
		    checked.push($(this));
		});
		if (checked.length === 1) {
			$("#createGroupBtn").removeAttr("disabled");
			$("#createGroupBtn").slideDown();
		}
		else if (checked.length === 0) {
			$("#createGroupBtn").slideUp(function(){
				$("#createGroupBtn").prop("disabled", "true");
			});
		}
	});
}

if (window.location.href == chrome.extension.getURL('popup.html') || window.location.href == chrome.extension.getURL('popup.html#')) {

	//Get title of current page and set it on the top navigation
	chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
		var activeTab = arrayOfTabs[0];
		pageTitle = activeTab.title;
		$("#topNav h1").text(pageTitle.trimToLength(32));
	});

	//Scroll to bottom of chat page each time popup is opened
	$(".containerComments").scrollTop($(".containerComments")[0].scrollHeight);

	//Autosize textarea for new comments
	autosize($('#newComment'));
	$('#newComment').on('autosize:resized', function(){
		console.log($(".containerComments").scrollTop());
		console.log($("#commentsBody").height());
		//If comments are scrolled all the way down
		if($(".containerComments")[0].scrollHeight - $(".containerComments").scrollTop() == $(".containerComments").outerHeight()) {
			//Move comments up after each textarea resize
			var newContainerMargin = $("#formNewComments").height() - 18;
			$("#commentsBody").css("margin-bottom", newContainerMargin+"px");
			//Scroll to bottom of page after each textarea resize
			$(".containerComments").scrollTop($(".containerComments")[0].scrollHeight);
		}
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
		$(".containerComments").animate({ scrollTop: $("#commentsBody").height() }, 200, function(){
			//Adapt scrolling settings
			$("#commentsBody").removeClass("commentsScroll");
			$("#commentsBody").addClass("commentsNoScroll");
			//Hide comments that don't match tagged ids
			$(".commentGroup").not("."+commentIds).slideToggle(200, function(){
				//Fix scrolling settings if necessary
				if ($("#commentsBody").height() > 425) {
				$("#commentsBody").removeClass("commentsNoScroll");
				$("#commentsBody").addClass("commentsScroll");
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
		$(".replyBtn").animate({ opacity: 0 }, 200);
		$(".replyBtn").siblings().animate({ opacity: 0 }, 200);
		$(".replyBtn").slideToggle(200);
		$(".replyBtn").siblings().slideToggle(200);
		
		//Add names selected to replyGroup
		var taggedGroup = "";  
		for(i=0; i < commentNames.length; i++) {
			if (i == commentNames.length - 1) {
			 	taggedGroup = taggedGroup + commentNames[i].split(' ')[0];
			}
			else {
			 	taggedGroup = taggedGroup + commentNames[i].split(' ')[0] + ", ";
			}
		}
		$("#topNav h1").text(taggedGroup.trimToLength(35));
		$("#closeFriends").show();
		if ($(this).parent().siblings().children(".chatBubble").hasClass("private")) {
			$("#topNav").addClass("replyingPrivate");
			$("#privateMessage").prop("checked", true);
			$("#privateMessage").change();
		}
		else {
			$("#topNav").addClass("replying");
			$("#publicMessage").prop("checked", true);
			$("#publicMessage").change();
		}
		//Change colors of bottomNav
		//$("#replyGroup").slideToggle(200);
		//$(".containerComments").animate({height: 450}, 200);

		//Check checkboxes of users tagged
		arrayIds = commentIds.split('-');
		for(i=0; i < arrayIds.length; i++) {
			$("#friendListCheckboxes #"+arrayIds[i]).prop("checked", true);
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
		$("#commentsBody").removeClass("commentsScroll");
		$("#commentsBody").addClass("commentsNoScroll");
		//Show hidden comments
		$(".hiddenComment").slideToggle(200, function(){
			//Fix scrolling settings
			if ($("#commentsBody").height() > 425) {
				$("#commentsBody").removeClass("commentsNoScroll");
				$("#commentsBody").addClass("commentsScroll");
				$(".containerComments").scrollTop($(".containerComments")[0].scrollHeight);
			}
		});
		$(".replyBtn").show();
		$(".replyBtn").siblings().show();
		$(".replyBtn").animate({ opacity: 100 }, 200);
		$(".replyBtn").siblings().animate({ opacity: 100 }, 200);
		$("#closeFriends").hide();
		$("#topNav h1").text(pageTitle.trimToLength(40));
		$("#publicMessage").prop("checked", true);
		$("#publicMessage").change();
		$("#friendListCheckboxes .form-check-input").prop("checked", false);
		$("#topNav").removeClass("replying");
		$("#topNav").removeClass("replyingPrivate");
		$(".containerComments").animate({height: 500}, 200);

		//Enable checkboxes
		$("#friendsListDropdown input").attr("disabled", false);
		$("#friendsListDropdown .dropdown-item").removeClass("disabled");

		//Change text on textarea
		$("#newComment").attr("placeholder", "Comment on this web page");
	});
}

//This function allows for trimming of strings
String.prototype.trimToLength = function(m) {
  return (this.length > m) 
    ? jQuery.trim(this).substring(0, m).split(" ").slice(0, -1).join(" ") + "..."
    : this;
};

function toggleDrawer() {
	if ($(".drawer").hasClass("hidden")) {
		$(".drawer").animate({ left: 0 });
		$(".closeDrawerArea").show();
		$(".closeDrawerArea").animate({opacity: 0.5});
		$(".drawer").removeClass("hidden");
	}
	else {
		$(".drawer").animate({ left: -200 });
		$(".closeDrawerArea").animate({opacity: 0}, function(){
			$(".closeDrawerArea").hide();
		});
		$(".drawer").addClass("hidden");
	}
}

