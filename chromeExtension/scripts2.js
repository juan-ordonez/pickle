var userID;
var userName;
var userEmail;
var friendsArray;
var session;
var url;
var picture;
var notifications;


if (document.getElementById("logoutButton")) {
  document.getElementById("logoutButton").addEventListener("click", logout);
}

function logout(e) {
  
  e.preventDefault();
  if (session) {
    $.get("https://pickle-server-183401.appspot.com/logout/" + session, function(data){
      getUserData();
      });
    }
  }


if (document.getElementById("submitComment")) {
  document.getElementById("submitComment").addEventListener("click", comment);
}

function comment(e) {

  e.preventDefault();
  var value = $("#newComment").val();
  chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {

     var activeTab = arrayOfTabs[0];
     url = activeTab.url;

     var tags;

     if (document.getElementById('checkFriends').checked) {
      tags = JSON.stringify(friendsArray);
     } else {
      tags = []
      $('.form-check-input:checkbox:checked').get().forEach(function(element) {
        tags.push(element.id);
        });
     }
     
    $.post('http://pickle-server-183401.appspot.com' + '/comment/', {"userId" : userID, "url" : url.toString(), "string" : value, "tags" : tags}, function(data) {
      console.log(data);
      data = JSON.parse(data);
      // data = ["eiB6FItN5Vw:APA91bExxxAVjVtcJMsj8Y61kygShgwnJ8uO-BwbG4JCYc98r6oDUY_a99LK6JuKcWklFTm9hljzQE-r_B15DSm5yDwfp6TmWcNXsKQoI4bpcwhmj_U8qg1oQBPdzcgd2SNIyx-9M8qn"];
      if (data.length > 0) {
      json = JSON.stringify({ "data": {"status" : "tagged you in a comment", "pic" : picture, "first" : userName.split(" ")[0], "comment" : value, "url" : url}, 
        "registration_ids": data });
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


if (document.getElementById("loginButton")) {
  document.getElementById("loginButton").addEventListener("click", login);
}

function login(e) {
  
  e.preventDefault();
  window.open("https://pickle-server-183401.appspot.com/login/");
  window.location.replace("popup.html");
  getUserData();

}


function getUserData() {
  
  cookie = chrome.cookies.getAll({ url: "https://pickle-server-183401.appspot.com"}, function(data) {
    
  if (data.length >= 1) { 
    if (window.location.href == chrome.extension.getURL('register.html')) {
      return
    }

    session = data[0].value

    var senderIds = ["511642730215"];
    chrome.gcm.register(senderIds, function (registrationID) {
    $.post("https://pickle-server-183401.appspot.com/token/", {"session" : session, "token" : registrationID});
    });
    
    $.get("https://pickle-server-183401.appspot.com/user/" + session, function(data){
      json = JSON.parse(data);
      if (json.status == false) {
        window.location.replace("register.html");
      } else if (json.updated == false) {
        var iframe;

        iframe = document.createElement('iframe');
        iframe.id = "iframe"
        iframe.src = "https://pickle-server-183401.appspot.com/connect/";
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
      } else {
          userName = json.name;
          userEmail = json.email;
          friendsArray = json.friends;
          userID = json.id;
          picture = json.picture;
          notifications = json.notifications;
          console.log(userID);
          if (notifications == 0){
            $("#numNotifications").hide();
          } else {
            if (document.getElementById("numNotifications")) {
              document.getElementById("numNotifications").innerHTML = notifications;
              $("#numNotifications").show();
            }
          }

          chrome.storage.local.set({'id': userID});
          chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {

          var activeTab = arrayOfTabs[0];
          url = activeTab.url;
          $("#commentsBody").load("http://pickle-server-183401.appspot.com/loadComment/ #comments", {"userID" : userID.toString(), "url" : url.toString()}, function(){
                  if ($("#formNewComments").height() > 425) {
                    $("#formNewComments").removeClass("commentsNoScroll");
                    $("#formNewComments").addClass("commentsScroll");
                    $(".containerComments").scrollTop($(".containerComments")[0].scrollHeight);
                  }
              });  
          $("#notifications").load("http://pickle-server-183401.appspot.com/loadnotifications/ #notifications", {"id" : userID.toString()});
          $("#others").load("http://pickle-server-183401.appspot.com/domainComments #comments", {"user" : userID.toString(), "url" : url});
          $("#friendListCheckboxes").load("http://pickle-server-183401.appspot.com/friends/ #friends", {"id" : userID.toString(), "friends" : JSON.stringify(friendsArray)});
          
        });
      }


    });

  } else {
  if (window.location.href != chrome.extension.getURL('register.html')) {
    window.location.replace("register.html");
      } 
    }

  });

}


if (window.location.href != chrome.extension.getURL('register.html')) {
  getUserData();
}

$("#iframe").on("load", function() {
  var iframe = document.getElementById("iframe");
  iframe.parentNode.removeChild(iframe);
});


//Post new comment 
$(document).on("click", "#submitComment", function(){
  //Retrieve comment entered by user
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
});


//Like a comment
$(document).on("click", ".likeButton", function(){
  var likes = 0;
  var id = decodeURIComponent($(this).closest(".commentGroup").attr('id'));
  
  $likeButton = $(this).children("a");
  if ($likeButton.hasClass("active") !== false) {
    //Decrease number of likes
    likes = likes;
    $(this).replaceWith('<div class="likeButton"><a href="#"><i class="fa fa-heart"></i> '+likes+'</a></div>');
    $.post("http://pickle-server-183401.appspot.com/unlike/", {"commentID" : id, "userID" : userID});
  }
  else {
    //Increment number of likes
    likes = likes + 1;
    $(this).replaceWith('<div class="likeButton"><a href="#" class="active"><i class="fa fa-heart"></i> '+likes+'</a></div>');
    $.post("http://pickle-server-183401.appspot.com/like/", {"commentID" : id, "userID" : userID});
  

  $.get("http://pickle-server-183401.appspot.com/commentUser/" + id, function(data) {
    data = JSON.parse(data);

  if (userName.split(" ")[0] != data['first']) {




  json = JSON.stringify({ "data": {"status" : "liked your comment", "pic" : data['picture'], "first" : data['first'], "comment" : "like", "url" : data['url']}, 
        "registration_ids": data['ids'] });
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


}


});


$(document).on("click", "#notificationsBell", function(){

  $.post("http://pickle-server-183401.appspot.com/reset", {"id" : userID});

});


// chrome.gcm.onMessage.addListener(function(message) {

//   console.log(message)
// });

chrome.gcm.onMessage.addListener(function(payload) {

  var profilePic = payload.data.pic;
  var user = payload.data.first;
  var comment = payload.data.comment;
  var commentUrl = payload.data.url;
  var notification = payload.data.status;

  if (window.location.href == chrome.extension.getURL('popup.html')) {
    //Append new comment
    $("#commentsBody").append('<div class="commentGroup"><div class="d-flex flex-nowrap align-items-center"><div class="thumbnail align-self-start"><img src='+profilePic+'></div><div class="chatBubble"><strong>'+user+'</strong> '+comment+' </div><div class="likeButton"><a href="#"><i class="fa fa-heart"></i> 0</a></div></div></div>');
    //Scroll to bottom of window
    $(".containerComments").scrollTop($(".containerComments")[0].scrollHeight);

  } else if (window.location.href == chrome.extension.getURL('notifications.html')) {
    $("#notifications").prepend('<a onclick=open('+commentUrl+')><div class="d-flex align-items-center"><div class="thumbnail mr-3"><img src='+profilePic+'></div><p class="notification"><strong>'+user+'</strong> '+notification+'</p></div></a>');
    $.post("http://pickle-server-183401.appspot.com/notification/", {"picture" : profilePic, "user" : user, "notification" : notification, "id" : userID, "url" : url});
  }
})

function open(url) {

chrome.tabs.create({'url': url}, function(tab) {
    // Tab opened.
});

}


      











