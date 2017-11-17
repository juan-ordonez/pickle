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

  // there are no checked checkboxes
  if (checked.length === 0) {

      // Kill click event:
      e.stopPropagation();
      // Toggle dropdown if not already visible:
      if ($("#friendsListDropdown").is(":hidden")){
        $('.dropdown-toggle').dropdown('toggle');
      }

  // there are some checked checkboxes
  } else {

      var value = $("#newComment").val();
      chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {

      var activeTab = arrayOfTabs[0];
      url = activeTab.url;
      //Get title of current chrome tab to show in notification (see below)
      pageTitle = activeTab.title;

      var tags;
      var all;

      if (document.getElementById('checkFriends').checked) {
        chrome.storage.local.set({'tags': JSON.stringify(friendsArray)});
        chrome.storage.local.set({'public' : true})
      } else {
      ids = []
      $('.form-check-input:checkbox:checked').get().forEach(function(element) {
        ids.push(element.id);
        console.log(ids);
        chrome.storage.local.set({'tags': JSON.stringify(ids)});
      });
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
    
  });

    //Append new comment to html using javascript

    var comment = $("#newComment").val();
    var user = userName.split(" ")[0];
    var profilePic = picture;
    //Check if comment is not empty
    if (comment !== "") {
      //Append new comment
      $("#commentsBody").append('<div class="commentGroup"><div class="d-flex flex-nowrap align-items-center"><div class="thumbnail align-self-start"><img src='+profilePic+'></div><div class="chatBubble"><strong>'+user+'</strong> '+comment+' </div><div class="likeButton"><a href="#"><i class="fa fa-heart"></i> 0</a></div></div></div>');
      //Scroll to bottom of window
      $(".containerComments").scrollTop($(".containerComments")[0].scrollHeight);
      //Clear textarea
      $("#newComment").val("");
    }
    //Make container scrollable if enough comments are posted
    if ($("#formNewComments").height() > 425) {
      $("#formNewComments").removeClass("commentsNoScroll");
      $("#formNewComments").addClass("commentsScroll");
      $(".containerComments").scrollTop($(".containerComments")[0].scrollHeight);
    }

  }
  
}


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

  connect("first");

  if (window.location.href == chrome.extension.getURL('popup.html')) {

    if (commentUrl == url && comment != 'like') {
    //Append new comment
    $("#commentsBody").append('<div class="commentGroup"><div class="d-flex flex-nowrap align-items-center"><div class="thumbnail align-self-start"><img src='+profilePic+'></div><div class="chatBubble"><strong>'+user+'</strong> '+comment+' </div><div class="likeButton"><a href="#"><i class="fa fa-heart"></i> 0</a></div></div></div>');
    //Scroll to bottom of window
    $(".containerComments").scrollTop($(".containerComments")[0].scrollHeight);
  } 

  } else if (window.location.href == chrome.extension.getURL('notifications.html')) {
    console.log(commentUrl);
    $("#notifications").prepend('<a href="'+commentUrl+'" class="notificationTab"><div class="d-flex align-items-center"><div class="thumbnail mr-3"><img src='+profilePic+'></div><p class="notification"><strong>'+user+'</strong> '+notification+'</p></div></a>');
    
  } 
})


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











      












