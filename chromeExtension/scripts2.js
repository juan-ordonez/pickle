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

  var checked = document.querySelectorAll('input:checked');

  // Open dropdown with friends checkboxes if user submits comment without choosing any friends
  if (checked.length === 0) {

      e.stopPropagation();
      if ($("#friendsListDropdown").is(":hidden")){
      $('.dropdown-toggle').dropdown('toggle');
      }

  // Else proceed submitting the comment
  } 

  else {

    //Get string of comment submitted by user
    var value = $("#newComment").val();

    chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {

      //Get the url and title of the page on which the comment is being posted
      var activeTab = arrayOfTabs[0];
      url = activeTab.url;
      pageTitle = activeTab.title;

    });   

    var tags;
    var all;

    //Initialize arrays for ids and names of friends tagged in comment 
    ids = []; //moved out of else loop below
    names = []; //new, needed for grouping, added by Juan

    //If the user is tagging all friends in comment
    if (document.getElementById('checkFriends').checked) {

      // New, needed for grouping, added by Juan
      // Get ids and names of all the user's friends
      ids = friendsArray;
      $('#friends .form-check-input').get().forEach(function(element) {
        names.push($(element).parent().text().trim());
      });

      //store tags and public boolean (all friends tagged) in storage
      chrome.storage.local.set({'tags': JSON.stringify(friendsArray)});
      chrome.storage.local.set({'public' : true});

    } 
    //Else if user only tagging selected friends
    else {

      //Get ids and names of tagged friends
      $('.form-check-input:checkbox:checked').get().forEach(function(element) {
        ids.push(element.id);
        names.push($(element).parent().text().trim()); //new, needed for grouping, added by Juan
        console.log(ids);
      });

      //store tags and public boolean (empty because only select friends tagged) in storage
      chrome.storage.local.set({'tags': JSON.stringify(ids)});
      chrome.storage.local.set({'public' : ""})

    }

    chrome.storage.local.get(['tags', 'public'], function (result) {

      tags = result['tags'];

      console.log(tags);

      all = result['public'];

      console.log(userID);

      chrome.extension.sendMessage({type : "comment", userID : userID, url : url, value : value, tags : tags, all : all, 
        picture : picture, pageTitle : pageTitle, checked : document.getElementById('checkFriends').checked});

    });

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

    //Append new comment to html using javascript

    //Get user name
    var user = userName.split(" ")[0];
    
    //Check if comment is not empty
    if (value !== "") {
      //Append new comment
      $("#commentsBody").append('<div class="commentGroup '+idsString+' temporaryComment"><div class="d-flex flex-nowrap align-items-center"><div class="thumbnail align-self-start"><img src='+picture+'></div><div class="chatBubble" data-toggle="tooltip" data-placement="top" title="Viewable to: '+namesString+'"><strong>'+user+'</strong> '+value+' </div><div class="likeButton"><a href="#"><i class="fa fa-heart"></i> 0</a></div></div><a class="replyBtn mb-0" href="#" style="display:none;"><small>Reply</small></a><p style="display:none;">'+namesString+'</p></div>');
      //Show reply button if popup is showing all comments (user not in a conversation)
      if ($("#closeFriends").attr("style") == "display: none;") {
        $(".replyBtn").show();
      }
      //Scroll to bottom of window
      $(".containerComments").scrollTop($(".containerComments")[0].scrollHeight);
      //Clear textarea
      $("#newComment").val("");
      //Enable tooltip
      $('[data-toggle="tooltip"]').tooltip();
      //Make container scrollable if enough comments are posted
      if ($("#formNewComments").height() > 425) {
        $("#formNewComments").removeClass("commentsNoScroll");
        $("#formNewComments").addClass("commentsScroll");
        $(".containerComments").scrollTop($(".containerComments")[0].scrollHeight);
      }
    }

  }
  
}


//if (document.getElementById("loginButton")) {
  //document.getElementById("loginButton").addEventListener("click", login);
//}

//function login(e) {
  
  //e.preventDefault();
  //window.open("https://pickle-server-183401.appspot.com/login/");
  //window.location.replace("popup.html");
  //getUserData();

//}

// var iframeClick = function () {
//     var isOverIframe = false,
//     windowLostBlur = function () {
//         if (isOverIframe === true) {
//             // DO STUFF
//             $("#loginPicture").addClass("invisible");
//             $(".fa-circle-o-notch").show();
//             $(document).ready(function($) {
//               setTimeout(function() {
//                 window.location.replace("popup.html");
//               }, 5000);
//             });
            
//             isOverIframe = false;
//         }
//     };
//     jQuery(window).focus();
//     jQuery('#iframeFB').mouseenter(function(){
//         isOverIframe = true;
//         console.log(isOverIframe);
//     });
//     jQuery('#iframeFB').mouseleave(function(){
//         isOverIframe = false;
//         console.log(isOverIframe);
//     });
//     jQuery(window).blur(function () {
//         windowLostBlur();
//     });
// };
// iframeClick();


// function getUserData() {
  
//   cookie = chrome.cookies.getAll({ url: "https://pickle-server-183401.appspot.com"}, function(data) {
    
//   if (data.length >= 1) { 
//     if (window.location.href == chrome.extension.getURL('register.html')) {
//       return
//     }

//     session = data[0].value

//     var senderIds = ["511642730215"];
//     chrome.gcm.register(senderIds, function (registrationID) {
//     $.post("https://pickle-server-183401.appspot.com/token/", {"session" : session, "token" : registrationID});
//     });
    
//     $.get("https://pickle-server-183401.appspot.com/user/" + session, function(data){
//       json = JSON.parse(data);
//       if (json.status == false) {
//         window.location.replace("register.html");
//       } else if (json.updated == false) {
//         var iframe;

//         iframe = document.createElement('iframe');
//         iframe.id = "iframe"
//         iframe.src = "https://pickle-server-183401.appspot.com/connect/";
//         iframe.style.display = 'none';
//         document.body.appendChild(iframe);
//       } else {
//           userName = json.name;
//           userEmail = json.email;
//           friendsArray = json.friends;
//           userID = json.id;
//           picture = json.picture;
//           notifications = json.notifications;
//           console.log(userID);
//           //Set icon to active state
//           chrome.browserAction.setIcon({path:"iconActive128.png"});

//           if (notifications == 0){
//             $("#numNotifications").hide();
//             chrome.browserAction.setBadgeText({text: ""});
//           } else {
//             if (document.getElementById("numNotifications")) {
//               document.getElementById("numNotifications").innerHTML = notifications;
//               $("#numNotifications").show();
//               chrome.browserAction.setBadgeText({text: notifications.toString()});
//             }
//           }

          
//           chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {

//           var activeTab = arrayOfTabs[0];

//           $.post("https://pickle-server-183401.appspot.com/canonicalize/", {"url" : activeTab.url}, function(data) {
//             url = data;
//             console.log(url);

//             $("#commentsBody").load("http://localhost:5000/loadComment/ #comments", {"userID" : userID.toString(), "url" : url.toString()}, function(){
//                     //Enable tooltips
//                     $(function () {
//                       $('[data-toggle="tooltip"]').tooltip()
//                     })
//                     $("#formNewComments .loadingSpinner").hide();
//                     if ($("#formNewComments").height() > 425) {
//                       $("#formNewComments").removeClass("commentsNoScroll");
//                       $("#formNewComments").addClass("commentsScroll");
//                       $(".containerComments").scrollTop($(".containerComments")[0].scrollHeight);
//                     }
//                 });  
//             $("#notifications").load("http://pickle-server-183401.appspot.com/loadnotifications/ #notifications", {"id" : userID.toString()}, function(data) {
//               $("#notificationsContainer .loadingSpinner").hide();
//               $("#notificationsContainer .cardList").show();
//             });
//             $("#others").load("http://pickle-server-183401.appspot.com/domainComments #comments", {"user" : userID.toString(), "url" : url}, function(){
//               $("#otherPages .loadingSpinner").hide();
//               $("#otherPages .cardList").show();
//             });
//             $("#friendListCheckboxes").load("http://localhost:5000/friends/ #friends", {"id" : userID.toString(), "friends" : JSON.stringify(friendsArray)});
//             $("#accountName").append(userName);
//             $("#accountProfilePicture").attr("src", picture);



//         });


          
//         });
//       }


//     });

//   } else {
//   if (window.location.href != chrome.extension.getURL('register.html')) {
//     window.location.replace("register.html");
//       } 
//     }

//   });

// }


// if (window.location.href != chrome.extension.getURL('register.html')) {
//   getUserData();
// }

$("#iframe").on("load", function() {
  var iframe = document.getElementById("iframe");
  iframe.parentNode.removeChild(iframe);
});

//Like a comment
$(document).on("click", ".likeButton", function(){
  $likeButton = $(this).children("a");
  var likes = parseInt($likeButton.text());
  var id = decodeURIComponent($(this).closest(".commentGroup").attr('id'));

  if ($likeButton.hasClass("active") == true) {
    //Decrease number of likes
    likes = likes - 1;
    $(this).replaceWith('<div class="likeButton"><a href="#"><i class="fa fa-heart"></i> '+likes+'</a></div>');
    $.post("http://pickle-server-183401.appspot.com/unlike/", {"commentID" : id, "userID" : userID});
  }
  else {
    //Increment number of likes
    likes = likes + 1;
    $(this).replaceWith('<div class="likeButton"><a href="#" class="active"><i class="fa fa-heart"></i> '+likes+'</a></div>');
    $.post("http://pickle-server-183401.appspot.com/like/", {"commentID" : id, "userID" : userID});
  
    chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
      var activeTab = arrayOfTabs[0];
      pageTitle = activeTab.title;

      $.get("https://pickle-server-183401.appspot.com/commentUser/" + id, function(data) {
      data = JSON.parse(data);

        if (userName.split(" ")[0] != data['first']) {

          //pass in pageTitle="" temporarily so chrome.notifications doesn't print undefined
          json = JSON.stringify({ "data": {"status" : "liked your comment on", "pic" : picture, "first" : userName.split(" ")[0], "comment" : "", "url" : data['url'], "pageTitle" : pageTitle}, 
                "registration_ids": data['ids'] });
          var tags = '["'+data['id']+'"]';
          console.log(tags);
          $.post("https://pickle-server-183401.appspot.com/notification/", {"picture" : picture, "user" : userName.split(" ")[0], "notification" : "liked your comment on", "cookies" : tags, "url" : data['url'], "page" : pageTitle});
          //$.post("http://localhost:4000/notification/", {"picture" : picture, "user" : userName.split(" ")[0], "notification" : "tagged you on", "cookies" : tags, "url" : url, "page" : pageTitle});
          //$.post("http://localhost:4000/notification/", {"picture" : picture, "user" : userName.split(" ")[0], "notification" : "tagged you on", "cookies" : tags, "url" : url, "page" : pageTitle});
          $.ajax({
            url:"https://gcm-http.googleapis.com/gcm/send",
            type:"POST",
            data:json,
            beforeSend: function(request) {
                request.setRequestHeader("Authorization", "key=AAAAdyBIfuc:APA91bGa18Wj2BtOaqRPwHj6CNk5uAyDEU26dU07RoYCQuRe7PXoPTBdH-hv999B7giiqTd6FGlAx9lwKhqeJTFRtmDy-b7y6MGPwsYm3IQGwfFWGF8q7B_VEGp8yu7_P7YyvpGE4HLv");
            },
            contentType:"application/json; charset=utf-8",
            dataType:"json",
            success: function(){}
          });

        }

      });
    });
  }


});


$(document).on("click", "#notificationsBell", function(){

  chrome.storage.local.set({notifications : 0});

  $.post("http://pickle-server-183401.appspot.com/reset", {"id" : userID});

});



chrome.gcm.onMessage.addListener(function(payload) {

  var profilePic = payload.data.pic;
  var user = payload.data.first;
  var comment = payload.data.comment;
  var commentUrl = payload.data.url;
  var notification = payload.data.status;
  var idsString = payload.data.ids;
  var namesString = payload.data.names;
  console.log(window.location.href);
  if (window.location.href == chrome.extension.getURL('popup.html') || window.location.href == chrome.extension.getURL('popup.html#')) {
    console.log("messagwe received");

    connect("first"); 

    if (commentUrl == url && comment != 'like') {
    //Append new comment
    $("#commentsBody").append('<div class="commentGroup '+idsString+' temporaryComment hiddenComment" style="display:none;"><div class="d-flex flex-nowrap align-items-center"><div class="thumbnail align-self-start"><img src='+profilePic+'></div><div class="chatBubble data-toggle="tooltip" data-placement="top" title="Viewable to: '+namesString+'"><strong>'+user+'</strong> '+comment+' </div><div class="likeButton"><a href="#"><i class="fa fa-heart"></i> 0</a></div></div><a class="replyBtn mb-0" href="#" style="display:none;"><small>Reply</small></a><p style="display:none;">'+namesString+'</p></div>');
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

  } else if (window.location.href == chrome.extension.getURL('notifications.html')) {
    console.log(commentUrl);
    $("#notifications").prepend('<a href="'+commentUrl+'" class="notificationTab"><div class="d-flex align-items-center"><div class="thumbnail mr-3"><img src='+profilePic+'></div><p class="notification"><strong>'+user+'</strong> '+notification+'</p></div></a>');
    
  } 

});


//click notification to lead to tagged url
$(document).on("click", ".notificationTab", function(event){ 

  url = $(event.target.closest("a")).attr("href");

  chrome.tabs.create({'url': url}, function(tab) {
          // Tab opened.
       });


});


//gather data from local storage after background processing 
function connect(message) {
chrome.extension.sendMessage({"handshake" : message},function(response){
  console.log(response.done);
  if (response.done) {
    chrome.storage.local.get(['commentsHTML', 'userName', 'userEmail', 'friendsArray', 'session', 'url', 'picture', 'notifications', 
      'notificationsHTML', 'friendsHTML', 'userID'], function (result) {

      commentsHTML = result['commentsHTML'];
      userName = result['userName'];
      userEmail = result['userEmail'];
      friendsArray = result['friendsArray'];
      session = result['session'];
      url = result['url'];
      console.log(url);
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
    if ($("#formNewComments").height() > 425) {
      $("#formNewComments").removeClass("commentsNoScroll");
      $("#formNewComments").addClass("commentsScroll");
      $(".containerComments").scrollTop($(".containerComments")[0].scrollHeight);
    }

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











      












