var userID;
var userName;
var userEmail;
var friendsArray;
var session;
var url;
var picture;
var notifications;
var pageTitle;
var commentsHTML;
var notificationsHTML;
var postsHTML;
var commentsHTML;

if (document.getElementById("logoutButton")) {
  document.getElementById("logoutButton").addEventListener("click", logout);
}

function logout(e) {
  
  e.preventDefault();

  chrome.storage.local.get(['session'], function(response) {

    session = response['session'];
  
    if (session) {
      //Log user out
      $.get("https://pickle-server-183401.appspot.com/logout/" + session, function(data){
        chrome.browserAction.setPopup({popup : "register.html"});
        window.location.replace("register.html");
        });
      //Set icon to inactive state
      chrome.browserAction.setIcon({path:"iconInactive128.png"});
    }
  chrome.storage.local.clear();

  });
  
  }


if (document.getElementById("submitComment")) {
  $(document).on("click", "#submitComment", comment);
}

function comment(e) {

  e.preventDefault();

  // Open dropdown with friends checkboxes if user submits comment without choosing any friends
  var checked = [];
  $("#friendListCheckboxes input:checked").each(function(){
    checked.push($(this));
  });
  if (checked.length === 0) {
      e.stopPropagation();
      if ($("#friendsListDropdown").is(":hidden")){
        $('.dropdown-toggle').dropdown('toggle');
      }
  } 
  // Else proceed submitting the comment
  else {

    //Get string of comment submitted by user
    var value = $("#newComment").val();

    //Get the url and title of the page on which the comment is being posted
    chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
      var activeTab = arrayOfTabs[0];
      url = activeTab.url;
      pageTitle = activeTab.title;
    });   

    //Get the following comment data
    ids = []; //Array of ids tagged in comment
    names = []; //Array of names tagged in comment
    var tags; // String with ids tagged in comment
    var all; // Boolean for whether the comment is for all friends or not

    $('.form-check-input:checkbox:checked').get().forEach(function(element) {
      ids.push(element.id);
      names.push($(element).parent().text().trim());
    });
    chrome.storage.local.set({'tags': JSON.stringify(ids)});
    //If the user is tagging all friends in comment

    if (document.getElementById('publicMessage').checked) {
      
      chrome.storage.local.set({'public' : true});
      all = true;

    } 
    //Else if user only tagging selected friends
    else {
      chrome.storage.local.set({'public' : ""})
      all = "";

    }

    //Get user name
    var user = userName.split(" ")[0];
    //Get string with tagged ids 
    var idsString = ids.slice();
    idsString.push(userID.toString());
    idsString.sort();
    var idsString = idsString.join('-');
    //Get string with tagged names
    names.push(userName);
    names.sort();
    var namesString = names.join(', ');
    var htmlArray = [];
    for (var i = 0; i < names.length; i++) {
      htmlArray.push('<a class="dropdown-item" href="#">'+names[i]+'</a>');
    }
    var tagsHtml = htmlArray.join('');
    

    //Send all comment data to background page
    chrome.storage.local.get(['tags', 'public'], function (result) {
      tags = result['tags'];
      all = result['public'];
      chrome.extension.sendMessage({type : "comment", userID : userID, url : url, value : value, tags : tags, all : all, 
        picture : picture, pageTitle : pageTitle, names : namesString, ids : idsString, tagsHtml : tagsHtml, checked : document.getElementById('publicMessage').checked});
    });

    //Append new comment to html using javascript
    if (value !== "") {
      appendComment(user, value, picture, namesString, idsString, all, tagsHtml);
    }

  }

}

//Liking or unliking a comment when user clicks heart icon
$(document).on("click", ".likeButton", function(){
  //Get id of the comment and the number of likes it has
  $likeButton = $(this).children("a");
  var likes = parseInt($likeButton.text());
  var id = decodeURIComponent($(this).closest(".commentGroup").attr('id'));
  var liked = false;

  //Decrease number of likes if user is unliking
  if ($likeButton.hasClass("active") == true) {
    likes = likes - 1;
    $(this).replaceWith('<div class="likeButton"><a href="#"><i class="fa fa-heart"></i> '+likes+'</a></div>');
    liked = "false";
  }
  //Increase number of likes if user is liking and send notification
  else {
    likes = likes + 1;
    $(this).replaceWith('<div class="likeButton"><a href="#" class="active"><i class="fa fa-heart"></i> '+likes+'</a></div>');
    liked = "true";
  
    //Get the title of the user's current tab
    chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
      var activeTab = arrayOfTabs[0];
      pageTitle = activeTab.title;
    });

    chrome.extension.sendMessage({type : "like", userName : userName, userID : userID, id : id, liked : liked, picture : picture, pageTitle : pageTitle});
  }
});


$(document).on("click", "#notificationsBell", function(){

  chrome.storage.local.set({notifications : 0});

  $.post("http://pickle-server-183401.appspot.com/reset", {"id" : userID});

});

//Listen for incoming new comments or notifications
chrome.gcm.onMessage.addListener(function(payload) {

  var profilePic = payload.data.pic;
  var user = payload.data.first;
  var comment = payload.data.comment;
  var commentUrl = payload.data.url;
  var notification = payload.data.status;
  var idsString = payload.data.ids;
  var namesString = payload.data.names;
  var pageTitle = payload.data.pageTitle;
  var all = payload.data.all;
  var tagsHtml = payload.data.tagsHtml;

  //Append incoming comment when user is on same url with comment tab opened
  if (window.location.href == chrome.extension.getURL('popup.html') || window.location.href == chrome.extension.getURL('popup.html#')) {

    // connect("first"); 

    if (commentUrl == url && comment != 'like') {

      appendComment(user, comment, profilePic, namesString, idsString, all, tagsHtml);
      //Hide the new comment if the user is in inside another group conversation
      if ($("#topNav").hasClass("replying") || $("#topNav").hasClass("replyingPrivate") ) {
        if ($(".temporaryComment").last().attr("class").split(' ')[1] !== $(".commentGroup").not(".hiddenComment").attr("class").split(' ')[1]) {
          $(".temporaryComment").last().hide();
          $(".temporaryComment").last().addClass("hiddenComment");
        }
      }

    }

    //Append incoming notification when user is in notification tab
  } else if (window.location.href == chrome.extension.getURL('notifications.html')) {
    
    $("#notifications").prepend('<a href="'+commentUrl+'" class="notificationTab"><div class="d-flex align-items-center"><div class="thumbnail mr-3"><img src='+profilePic+'></div><p class="notification"><strong>'+user+'</strong> '+notification+' '+pageTitle+'</p></div></a>');
  } 

});


//click notification to open tab with tagged url
$(document).on("click", ".notificationTab", function(event){ 
  url = $(event.target.closest("a")).attr("href");
  chrome.tabs.create({'url': url}, function(tab) {
          // Tab opened.
       });
  connect("first");
});


//gather data from local storage after background processing 
function connect(message) {
//Ask background if loading is done
chrome.extension.sendMessage({"handshake" : message},function(response){
  
  //Get data from storage if background is done loading
  if (response.done) {
    chrome.storage.local.get(['commentsHTML', 'userName', 'userEmail', 'friendsArray', 'session', 'url', 'picture', 'notifications', 
      'notificationsHTML', 'friendsHTML', 'userID', 'postsHTML'], function (result) {
      postsHTML = result['postsHTML']
      commentsHTML = result['commentsHTML'];
      userName = result['userName'];
      userEmail = result['userEmail'];
      friendsArray = result['friendsArray'];
      session = result['session'];
      url = result['url'];
      picture = result['picture'];
      notifications = result['notifications'];
      notificationsHTML = result['notificationsHTML'];
      friendsHTML = result['friendsHTML'];
      userID = result['userID'];
    if (commentsHTML != null) {
      $("#commentsBody").html(commentsHTML);
    } else {
      
      $("#commentsBody").html(' ');
    }
    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
                    })
    $(".containerComments .loadingSpinner").hide();
    scrollable($("#commentsBody"));
    //Convert all urls into links
    $('p').linkify();
    $("body").linkify({
      target: "_blank"
    });
    //Close tags dropdown when user scrolls
    $(".containerComments").bind("scroll", function(){
      if ($(".tagsDropdown .dropdown-menu").hasClass("show")) {
        $(".tagsDropdown .dropdown-menu").removeClass("show");
      }
    });

      if (notificationsHTML != null) { 
        $("#notifications").html(notificationsHTML);
      } else {
        $("#notifications").html(' ');
      }

      if (postsHTML != null) { 
        $("#posts").html(postsHTML);
      } else {
        $("#posts").html(' ');
      }
      $("#notificationsContainer .loadingSpinner").hide();
      $("#notificationsContainer .cardList").show();
      if (friendsHTML != null) {
        $("#friendListCheckboxes").html(friendsHTML);
      } else {
        $("#friendListCheckboxes").html(' ');
      }

      if (notifications == 0){
        $("#numNotifications").hide();
        chrome.browserAction.setBadgeText({text: ""});
      } else {
        if (document.getElementById("numNotifications")) {
          document.getElementById("numNotifications").innerHTML = notifications;
          $("#numNotifications").show();
          chrome.browserAction.setBadgeText({text: notifications.toString()});
        }
      }

    });
  // If background is not done loading, keep asking
  } else {
    connect("message");
  }
  
});

}


// if loading the popup page, load data via the background page
if (window.location.href == chrome.extension.getURL('popup.html')) {
  $("#numNotifications").hide();
  connect("first");
}

if (window.location.href == chrome.extension.getURL('newsfeed.html')) {
  connect("first");
}
// login facebook authentication
$(document).on("click", "#loginButton", function(event){ 
  url = "https://www.facebook.com/dialog/oauth?client_id=1430922756976623&response_type=token&scope=public_profile,email,user_friends&redirect_uri=http://www.facebook.com/connect/login_success.html";
  chrome.windows.create({'url': url, focused : false, width : 750, height : 750, type : "popup"}, function(tab) {
          // Tab opened.
  });
  $("#loginPicture").css("visibility", "hidden");
  $("#loginSpinner").show();
  $(".btn-facebook").addClass("disableClick");
});


// populate notifications tab
if (window.location.href == chrome.extension.getURL('notifications.html')) {
  chrome.storage.local.get(['notificationsHTML'], function(result) {
  notificationsHTML = result['notificationsHTML'];
  if (notificationsHTML != null) { 
        $("#notifications").html(notificationsHTML);
      } else {
        $("#notifications").html(' ');
      }
      $("#notificationsContainer .loadingSpinner").hide();
      $("#notificationsContainer .cardList").show();

  })
}

// populate account tab
if (window.location.href == chrome.extension.getURL('account.html')) {
  chrome.storage.local.get(['picture', 'userName'], function(result) {
  userName = result['userName'];
  picture = result['picture'];
  $("#accountName").append(userName);
  $("#accountProfilePicture").attr("src", picture);
});
}


// message listener for background communication
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.handshake == "login") {
      window.location.replace("popup.html");
    } else if (request.handshake == "retry") {
      connect("first");
    }
  });

//Append html of new comment to body of existing comments
function appendComment(user, value, picture, names, ids, all, tagsHtml) {
  //create css class for private comments
  var css = "";
  var tagsIcon = "fa-tag";
  if (all !== true) {
    css = "private";
    tagsIcon = "fa-user-secret";
  }
  $("#commentsBody").append('<div class="commentGroup '+ids+' temporaryComment"><div class="d-flex flex-nowrap align-items-center"><div class="thumbnail align-self-start"><img src='+picture+'></div><div class="chatBubble '+css+'"><strong>'+user+'</strong> '+value+' </div><div class="likeButton"><a href="#"><i class="fa fa-heart"></i> 0</a></div></div><div class="commentDetails d-flex justify-content-start align-items-center"><a class="replyBtn mb-0" href="#"><small>Reply</small></a><small class="ml-1 mr-1 mb-0">•</small><div class="tagsDropdown dropdown show"><a href="#" class="btn mb-0 tagsToggle" role="button" id="tags-temporary" "="" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><small><i class="fa '+tagsIcon+'"></i></small></a><div class="dropdown-menu" aria-labelledby="tagsToggle-temporary"><p class="mr-3 ml-3 mb-0"><small><strong>Tags</strong></small></p>'+tagsHtml+'</div></div><small class="ml-1 mr-1 mb-0">• Now</small></div><p style="display:none;">'+names+'</p></div>');
  //Show reply button if user is not in reply mode
  if ($("#topNav").hasClass("replying") || $("#topNav").hasClass("replyingPrivate")) {
    $(".commentDetails").children().hide();
  }
  $(".containerComments").scrollTop($(".containerComments")[0].scrollHeight); //Scroll to bottom of window
  $("#newComment").val(""); //Clear textarea
  autosize.update($("#newComment")); //Set height of comment input back to 1
  $('[data-toggle="tooltip"]').tooltip(); //Enable tooltip
  scrollable($("#commentsBody")); //Make container scrollable if enough comments are posted
  //Convert all urls into links
  $('p').linkify();
  $("body").linkify({
    target: "_blank"
  });
}

//makes a container scrollable after it reaches a certain height
function scrollable(container) {
  if (container.height() > 425) {
    container.removeClass("commentsNoScroll");
    container.addClass("commentsScroll");
    container.parent().scrollTop(container.parent()[0].scrollHeight);
  }
}

