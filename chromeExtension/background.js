var userID;
var userName;
var userEmail;
var friendsArray;
var session;
var url;
var picture;
var notifications;
var notificationsHTML;
var commentsHTML;
var friendsHTML;
var done = false;
var successURL = 'www.facebook.com/connect/login_success.html';


chrome.gcm.onMessage.addListener(function(payload) {

  done = false;
  chrome.storage.local.get(['accessToken'], function(data) {
    
  if (data['accessToken'] != null) { 

    
    session = data['accessToken'];
    console.log(session);

    var senderIds = ["511642730215"];
    chrome.gcm.register(senderIds, function (registrationID) {
    $.post("https://pickle-server-183401.appspot.com/token/", {"session" : session, "token" : registrationID});
    });

   
    
    $.get("https://pickle-server-183401.appspot.com/user/" + session, function(data){
      json = JSON.parse(data);
      if (json.status == false) {
        console.log("false");
        return;
      } else if (json.updated == false) {
        console.log("needs to be updated");
      } else {
          userName = json.name;
          userEmail = json.email;
          friendsArray = json.friends;
          userID = json.id;
          picture = json.picture;
          notifications = json.notifications;
          console.log(userID);

          $("body").load("http://pickle-server-183401.appspot.com/loadnotifications/ #notifications", {"id" : userID.toString()}, function () {
              notificationsHTML = $("#notifications").html();
              chrome.storage.local.set({"notificationsHTML" : notificationsHTML});
              
            });
         
          }

          });

  
    }

  });


chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {

     var activeTab = arrayOfTabs[0];
     url = activeTab.url;
 });

  console.log(payload.data);
  console.log(userID);
  
  var profilePic = payload.data.pic;
  var user = payload.data.first;
  var comment = payload.data.comment;
  //Added a variable for the page title to create the notification
  var page = payload.data.pageTitle;
  var commentUrl = payload.data.url;
  var notification = payload.data.status;

  var views = chrome.extension.getViews({type : "popup"});
  console.log(views.length);
  if (views.length == 0) {
    chrome.notifications.create({   
    type: 'basic', 
    iconUrl: 'iconBig.png', 
    //Added the page name to the notification (to be shown in the title of the notification) 
    title: user+' '+notification+' '+page, 
    //Show the actual comment in the message
    message: comment

    }, function (notif) {
      dict = {};
      dict[notif] = commentUrl;
      console.log(notif);
      chrome.storage.local.set(dict);
    });
    
  }
  
});


chrome.notifications.onClicked.addListener(function (id) {

	chrome.storage.local.get(id, function (result) {
        var redirect = result;
        var link = redirect[Object.keys(redirect)[0]];

        chrome.tabs.create({'url': link}, function(tab) {
    			// Tab opened.
 			 });
        
    });



});


function getUserData() {

  chrome.storage.local.get(['accessToken'], function(data) {
    
  if (data['accessToken'] != null) { 

    
    session = data['accessToken'];

    var senderIds = ["511642730215"];
    chrome.gcm.register(senderIds, function (registrationID) {
    $.post("https://pickle-server-183401.appspot.com/token/", {"session" : session, "token" : registrationID});
    });
    
    $.get("https://pickle-server-183401.appspot.com/user/" + session, function(data) {
      json = JSON.parse(data);
      console.log(session);
      if (json.status == false) {
        console.log("logged out");
        chrome.browserAction.setPopup({popup : "register.html"});
      } else if (json.updated == false) {
        var iframe;

        iframe = document.createElement('iframe');
        iframe.id = "iframe"
        iframe.src = "https://pickle-server-183401.appspot.com/connect/";
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
      } else {
          console.log("logged in");
          chrome.browserAction.setPopup({popup : "popup.html"});
          userName = json.name;
          userEmail = json.email;
          friendsArray = json.friends;
          userID = json.id;
          picture = json.picture;
          notifications = json.notifications;
          console.log(userID);
          //Set icon to active state
          chrome.browserAction.setIcon({path:"iconActive128.png"});

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

          
          chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {

          var activeTab = arrayOfTabs[0];


          $.post("https://pickle-server-183401.appspot.com/canonicalize/", {"url" : activeTab.url}, function(data) {
            url = data;
            // console.log(url);
            var d1 = $.Deferred(),
                d2 = $.Deferred();
            
            $("body").load("http://pickle-server-183401.appspot.com/loadComment/ #comments", {"userID" : userID.toString(), "url" : url.toString()}, function() {
              commentsHTML = $("#comments").html();
              console.log(commentsHTML);
              d1.resolve();
            });  
            // $("body").load("http://pickle-server-183401.appspot.com/loadnotifications/ #notifications", {"id" : userID.toString()}, function () {
            //   notificationsHTML = $("#notifications").html();
            //   d2.resolve();
            // });
            $("body").load("http://pickle-server-183401.appspot.com/friends/ #friends", {"id" : userID.toString(), "friends" : JSON.stringify(friendsArray)}, function () {
              friendsHTML = $("#friends").html();
              d2.resolve();
            });
            
            $.when(d1, d2).done(function () {
              
              done = true;
              chrome.storage.local.set({ "userID" : userID, 
                "userName" : userName,
                "userEmail" : userEmail,
                "friendsArray" : friendsArray,
                "session" : session,
                "url" : url,
                "picture" : picture,
                "notifications" : notifications,
                "notificationsHTML" : notificationsHTML,
                "commentsHTML" : commentsHTML,
                "friendsHTML" : friendsHTML});



            })

        });


          
        });
      }


    });




  

  } else {
    console.log("logged out");
    chrome.browserAction.setPopup({popup : "register.html"});
      
    }

  });

}



chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.storage.local.remove(['commentsHTML', 'friendsArray', 'notifications', 'friendsHTML']);
  done = false;

});

chrome.tabs.onUpdated.addListener(function(activeInfo) {
  onFacebookLogin();
  

});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) { 

    if (request.type == "comment") {
      comment(request.userID, request.url, request.value, request.tags, request.all, request.picture, request.pageTitle, request.checked);
      done = false;

    } else if (request.handshake == "first") {
        // chrome.storage.local.remove(['commentsHTML', 'friendsArray', 'notifications', 'friendsHTML']);
      getUserData();
      sendResponse({done : done});

  } else {
      sendResponse({done : done});
    }


});



function onFacebookLogin(){

  console.log("run");

chrome.storage.local.get(['accessToken'], function(result) {

  var token = result['accessToken'];
  if (!token) {
    chrome.tabs.query({}, function(tabs) { 
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].url.indexOf(successURL) != -1) {
          
          var params = tabs[i].url.split('#')[1];

          
          var accessToken = params.split('&')[0];
          accessToken = accessToken.split('=')[1];

          chrome.storage.local.set({'accessToken' : accessToken}, function() {
              $.get("https://graph.facebook.com/v2.11/me?fields=id,name,picture,friends,email&access_token=" + accessToken, function(api) {
                userID = api.id;
                userName = api.name;
                userEmail = api.email;
                friendsArray = api.friends.data;
                picture = api.picture.data.url;
                console.log(api);
                $.post('https://pickle-server-183401.appspot.com/register/', {"json" : JSON.stringify({"status" : true, "id" : userID, "name" : userName, "email" : userEmail, "friends" : friendsArray, "picture" : picture, "authToken" : accessToken})}, function() {
                  chrome.extension.sendMessage({handshake:"login"});
                  $("body").load("http://pickle-server-183401.appspot.com/loadnotifications/ #notifications", {"id" : userID.toString()}, function () {
                   notificationsHTML = $("#notifications").html();
                  chrome.storage.local.set({"notificationsHTML" : notificationsHTML});
              
            });

                });
              });
          });
          console.log("access Token: " + accessToken);
          chrome.tabs.remove(tabs[i].id);
          chrome.browserAction.setPopup({popup : "popup.html"});
        }
      }
    });
  } else {
    console.log(token);

  }

  

  });
}



function comment(userID, url, value, tags, all, picture, pageTitle, checked) {

  $.post('https://pickle-server-183401.appspot.com' + '/comment/', {"userId" : userID, "url" : url.toString(), "string" : value, "tags" : tags, "public" : all}, function(data) {
      console.log(data);
      data = JSON.parse(data);
      // data = ["eiB6FItN5Vw:APA91bExxxAVjVtcJMsj8Y61kygShgwnJ8uO-BwbG4JCYc98r6oDUY_a99LK6JuKcWklFTm9hljzQE-r_B15DSm5yDwfp6TmWcNXsKQoI4bpcwhmj_U8qg1oQBPdzcgd2SNIyx-9M8qn"];
      

        //If comment is for all friends, then notification should say that user left a comment on a page title
        if (checked) {
          var array = data.slice();

          json = JSON.stringify({ "data": {"status" : "left a comment on", "pic" : picture, "first" : userName.split(" ")[0], "comment" : value, "url" : url, "pageTitle" : pageTitle}, 
            "registration_ids": data });
          $.post("https://pickle-server-183401.appspot.com/notification/", {"picture" : picture, "user" : userName.split(" ")[0], "notification" : "left a comment on", "cookies" : tags, "url" : url, "page" : pageTitle});
        }
        //Else if comment is for specific friends, notification should say that the user tagged those users on a page pageTitle                   
        else {
          var array = data.slice();
          console.log(JSON.stringify(data));
          json = JSON.stringify({ "data": {"status" : "tagged you on", "pic" : picture, "first" : userName.split(" ")[0], "comment" : value, "url" : url, "pageTitle" : pageTitle}, 
            "registration_ids": data });
          $.post("https://pickle-server-183401.appspot.com/notification/", {"picture" : picture, "user" : userName.split(" ")[0], "notification" : "tagged you on", "cookies" : tags, "url" : url, "page" : pageTitle});
        

        }

        if (data.length > 0) {

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





   


