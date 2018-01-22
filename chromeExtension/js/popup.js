//Attach wave effect to buttons and other elements
Waves.attach(".btn");
Waves.init();

$('.btn').mouseup(function() { this.blur() });

// if (window.location.href == chrome.extension.getURL('settings.html')){
// 	$(document).on("click", ".backBtn", function(){
// 		//chrome.browserAction.setPopup({popup : "popup.html"});
// 		window.location.href = chrome.extension.getURL(history.back());
// 	});
// }

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

$(document).on("click", "#prepareYipp", function(){
	$(".activePageBtns").animate({opacity : 0}, 200, function(){
		$(".activePageBtns").css({height : 0});
		$(".activePageInput").fadeIn(200);
		$(".activePageInput textarea").focus();
	});
	$(".closeYippArea").show();
	$(".closeYippArea").animate({opacity: 0.5});
	$(".container").css({overflowY: 'hidden'});
	$(".currentTabInfo small:first-child").html('<i class="fas fa-link mr-2"></i>Share page');
});

$(document).on("click", ".closeYippArea", function(){
	$(".activePageInput").fadeOut(200, function(){
		$(".activePageBtns").css({height : 48});
		$(".activePageBtns").animate({opacity : 100}, 200);
	});
	$(".closeYippArea").animate({opacity: 0}, function(){
		$(".closeYippArea").hide();
	});
	$(".container").css({overflowY: 'auto'});
	$(".currentTabInfo small:first-child").html('<i class="fas fa-link mr-2"></i>Current page');
});


//Populate group details page
if (window.location.href == chrome.extension.getURL("groupDetails.html")) {
	chrome.storage.local.get(["previousPage", "previousUrl", "currentGroupName"], function(result){
	 	$("#"+result.previousPage).addClass("active");
	 	$(".backBtn").prop("href", result.previousUrl);
	 	$(".currentGroupLabel").text(result.currentGroupName);
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
		toggleDrawer();
		if (newsfeed) {
			window.location.replace("newsfeed.html");
		} else {
			window.location.replace("popup.html");
		}
	});

}

$('#newComment').bind('input propertychange', function() {

	var message = $("#newComment").val();
	chrome.storage.local.set({"messageBackup" : message});

});

if (window.location.href == chrome.extension.getURL('newsfeed.html')) {
	//Press enter to submit textarea, Shift+enter for new line
	$("#newComment").keypress(function (e) {
	    if(e.which == 13 && !e.shiftKey) {        
	        //$(this).closest("form").submit();
	        $("#submitYipp").trigger("click");
	        e.preventDefault();
	        return false;
	    }
	});

	$(document).on("click", "#submitYipp", function(){
    	$(".emptyGroupState").fadeOut();
    	$(".currentTabInfo, .activePageBtns").addClass("inactive");
    	$("#submitYipp").prop("disabled", "true");
		$(".closeYippArea").trigger("click");
	});
}

if (window.location.href == chrome.extension.getURL('popup.html') || window.location.href == chrome.extension.getURL('popup.html#')) {

	//Get title of current page and set it on the top navigation
	chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
		var activeTab = arrayOfTabs[0];
		pageTitle = activeTab.title;
		$("#topNav h1").text(pageTitle.trimToLength(50));
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
			var newContainerMargin = $("#formNewComments").height() - 24;
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

