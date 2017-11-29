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
  var checked = document.querySelectorAll('input:checked');
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

    //If the user is tagging all friends in comment
    if (document.getElementById('checkFriends').checked) {

      ids = friendsArray;
      $('#friendListCheckboxes .form-check-input').get().forEach(function(element) {
        names.push($(element).parent().text().trim());
      });
      chrome.storage.local.set({'tags': JSON.stringify(friendsArray)});
      chrome.storage.local.set({'public' : true});

    } 
    //Else if user only tagging selected friends
    else {
      $('.form-check-input:checkbox:checked').get().forEach(function(element) {
        ids.push(element.id);
        names.push($(element).parent().text().trim()); 
        console.log(ids);
      });
      chrome.storage.local.set({'tags': JSON.stringify(ids)});
      chrome.storage.local.set({'public' : ""})

    }

    //Send all comment data to background page
    chrome.storage.local.get(['tags', 'public'], function (result) {
      tags = result['tags'];
      all = result['public'];
      chrome.extension.sendMessage({type : "comment", userID : userID, url : url, value : value, tags : tags, all : all, 
        picture : picture, pageTitle : pageTitle, checked : document.getElementById('checkFriends').checked});
    });

    //Append new comment to html using javascript

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
    console.log(namesString);
    console.log(idsString);
    
    //Append new comment
    if (value !== "") {
      appendComment(user, value, picture, namesString, idsString);
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

  console.log("received a new message!");

  var profilePic = payload.data.pic;
  var user = payload.data.first;
  var comment = payload.data.comment;
  var commentUrl = payload.data.url;
  var notification = payload.data.status;
  var idsString = payload.data.ids;
  var namesString = payload.data.names;

  console.log("message received 1");

  //Append incoming comment when user is on same url with comment tab opened
  if (window.location.href == chrome.extension.getURL('popup.html') || window.location.href == chrome.extension.getURL('popup.html#')) {

    // connect("first"); 

    if (commentUrl == url && comment != 'like') {

      console.log("message received 2");

      // appendComment(user, comment, profilePic, namesString, idsString);
      // $(".temporaryComment").last().addClass("hiddenComment");
      // $(".temporaryComment").last().hide();
      // if ($(".temporaryComment").last().attr("class").split(' ')[1] == $(".temporaryComment").last().prev().attr("class").split(' ')[1]) {
      //    $(".temporaryComment").last().show();
      // }

      //Append new comment
      $("#commentsBody").append('<div class="commentGroup '+idsString+' temporaryComment"><div class="d-flex flex-nowrap align-items-center"><div class="thumbnail align-self-start"><img src='+profilePic+'></div><div class="chatBubble data-toggle="tooltip" data-placement="top" title="Viewable to: '+namesString+'"><strong>'+user+'</strong> '+comment+' </div><div class="likeButton"><a href="#"><i class="fa fa-heart"></i> 0</a></div></div><a class="replyBtn mb-0" href="#" style="display:none;"><small>Reply</small></a><p style="display:none;">'+namesString+'</p></div>');
      if ($(".temporaryComment").last().attr("class").split(' ')[1] == $(".temporaryComment").last().prev().attr("class").split(' ')[1]) {
        $(".temporaryComment").last().show();
      }
      //Show reply button if popup is showing all comments (user not in a conversation)
      if ($("#closeFriends").attr("style") == "display: none;") {
        $(".replyBtn").show();
      }
      //Enable tooltip
      $('[data-toggle="tooltip"]').tooltip();
      //Scroll to bottom of window
      $(".containerComments").scrollTop($(".containerComments")[0].scrollHeight);

      }

    //Append incoming notification when user is in notification tab
  } else if (window.location.href == chrome.extension.getURL('notifications.html')) {
    console.log(commentUrl);
    $("#notifications").prepend('<a href="'+commentUrl+'" class="notificationTab"><div class="d-flex align-items-center"><div class="thumbnail mr-3"><img src='+profilePic+'></div><p class="notification"><strong>'+user+'</strong> '+notification+'</p></div></a>');
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
  console.log(response.done);
  //Get data from storage if background is done loading
  if (response.done) {
    chrome.storage.local.get(['commentsHTML', 'userName', 'userEmail', 'friendsArray', 'session', 'url', 'picture', 'notifications', 
      'notificationsHTML', 'friendsHTML', 'userID'], function (result) {

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
      console.log("null");
      $("#commentsBody").html(' ');
    }
    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
                    })
    $("#formNewComments .loadingSpinner").hide();
    scrollable($("#formNewComments"));
    //Convert all urls into links
    $('p').linkify();
    $("body").linkify({
      target: "_blank"
    });

      if (notificationsHTML != null) { 
        $("#notifications").html(notificationsHTML);
      } else {
        $("#notifications").html(' ');
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
    console.log(request.handshake);
    if (request.handshake == "login") {
      window.location.replace("popup.html");
    }
  });

//Append html of new comment to body of existing comments
function appendComment(user, value, picture, names, ids) {
  $("#commentsBody").append('<div class="commentGroup '+ids+' temporaryComment"><div class="d-flex flex-nowrap align-items-center"><div class="thumbnail align-self-start"><img src='+picture+'></div><div class="chatBubble" data-toggle="tooltip" data-placement="top" title="Viewable to: '+names+'"><strong>'+user+'</strong> '+value+' </div><div class="likeButton"><a href="#"><i class="fa fa-heart"></i> 0</a></div></div><div class="d-flex justify-content-start align-items-start"><a class="replyBtn mb-0" href="#" style="display:none;"><small>Reply</small></a></div><p style="display:none;">'+names+'</p></div>');
  //Show reply button if user is not in reply mode
  if ($("#closeFriends").attr("style") == "display: none;") {
    $(".replyBtn").show();
  }
  $(".containerComments").scrollTop($(".containerComments")[0].scrollHeight); //Scroll to bottom of window
  $("#newComment").val(""); //Clear textarea
  autosize.update($("#newComment")); //Set height of comment input back to 1
  $('[data-toggle="tooltip"]').tooltip(); //Enable tooltip
  scrollable($("#formNewComments")); //Make container scrollable if enough comments are posted
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

