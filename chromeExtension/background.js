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
var permissions = [];


chrome.storage.local.get(['accessToken'], function(result) {

  var token = result['accessToken'];

  if (token) {
    chrome.browserAction.setPopup({popup : "popup.html"});

  }


});


chrome.gcm.onMessage.addListener(function(payload) {

  //done = true;
  var views = chrome.extension.getViews({type : "popup"});
  //console.log(views.length);

  done = false;
  chrome.storage.local.get(['accessToken'], function(data) {
    
  if (data['accessToken'] != null) { 

    
    session = data['accessToken'];
  
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
          notifications = notifications + 1;
          
          chrome.browserAction.setBadgeText({text: notifications.toString()});
            
          

          $("body").load("http://pickle-server-183401.appspot.com/loadnotifications/ #notifications", {"id" : userID.toString()}, function () {
              console.log("UPDATING HTML");
              notificationsHTML = $("#notifications").html();

              chrome.storage.local.set({"notificationsHTML" : notificationsHTML});
              // getUserData();
              

            });
         
          }

          });

  
    }

  });


if (views.length == 0) {
//console.log("popup is shut");

chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {

     var activeTab = arrayOfTabs[0];
     url = activeTab.url;
 });
  
  var profilePic = payload.data.pic;
  var user = payload.data.first;
  var comment = payload.data.comment;
  //Added a variable for the page title to create the notification
  var page = payload.data.pageTitle;
  var commentUrl = payload.data.url;
  var notification = payload.data.status;

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

  chrome.storage.local.remove(['commentsHTML', 'friendsArray', 'notifications', 'friendsHTML']);
  done = false;
  getUserData();



});


function getUserData() {

  chrome.storage.local.get(['accessToken', 'userName', 'userEmail', 'session', 'picture', 'userID'], function(data) {
    
  if (data['accessToken'] != null) { 


    
    session = data['accessToken'];
    
    $.get("https://pickle-server-183401.appspot.com/user/" + session, function(data) {
      json = JSON.parse(data);
      if (json.status == false) {
        chrome.browserAction.setPopup({popup : "register.html"});
    
      } else {
          chrome.browserAction.setPopup({popup : "popup.html"});
          userName = json.name;
          userEmail = json.email;
          friendsArray = json.friends;
          userID = json.id;
          picture = json.picture;
          notifications = json.notifications;
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
            

            $("body").load("https://pickle-server-183401.appspot.com/loadComment/ #comments", {"userID" : userID.toString(), "url" : url.toString()}, function() {

              commentsHTML = $("#comments").html();
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

chrome.tabs.onUpdated.addListener(function(activeInfo, load) {

  
  onFacebookLogin();
  if (load.status == "complete") {
    logData();
  }
  
  

});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) { 

    if (request.type == "comment") {
      comment(request.userID, request.url, request.value, request.tags, request.all, request.picture, request.pageTitle, request.names, request.ids, request.checked, request.tagsHtml);
      done = false;

    } 

    else if (request.type == "like"){

      like(request.userName, request.userID, request.id, request.liked, request.picture, request.pageTitle);

      done = false;
    }

    else if (request.handshake == "first") {
        // chrome.storage.local.remove(['commentsHTML', 'friendsArray', 'notifications', 'friendsHTML']);
        
      getUserData();
      sendResponse({done : done});

  } else {
      sendResponse({done : done});
    }


});



function onFacebookLogin(){

  

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
                $.post('https://pickle-server-183401.appspot.com/register/', {"json" : JSON.stringify({"status" : true, "id" : userID, "name" : userName, "email" : userEmail, "friends" : friendsArray, "picture" : picture, "authToken" : accessToken})}, function() {
                  chrome.extension.sendMessage({handshake:"login"});
                  $("body").load("http://pickle-server-183401.appspot.com/loadnotifications/ #notifications", {"id" : userID.toString()}, function () {
                   notificationsHTML = $("#notifications").html();
                  chrome.storage.local.set({"notificationsHTML" : notificationsHTML});
              
            });

                  var senderIds = ["511642730215"];
                  chrome.gcm.register(senderIds, function (registrationID) {
                  $.post("https://pickle-server-183401.appspot.com/token/", {"session" : accessToken, "token" : registrationID});
          });

                });
              });
$.post("https://graph.facebook.com/v2.11/?id=http://burymewithmymoney.com/?scrape=true&access_token=" + accessToken, function(api) {
    console.log(api);
});
          
          });
          chrome.tabs.remove(tabs[i].id);
          chrome.browserAction.setPopup({popup : "popup.html"});
        }
      }
    });
  } else {
    chrome.browserAction.setPopup({popup : "popup.html"});

  }

  

  });
}



function comment(userID, url, value, tags, all, picture, pageTitle, names, ids, checked, tagsHtml) {
  console.log(tags);

  $.post('https://pickle-server-183401.appspot.com' + '/comment/', {"userId" : userID, "url" : url.toString(), "string" : value, "tags" : tags, "public" : all}, function(data) {
      
      data = JSON.parse(data);
      // data = ["eiB6FItN5Vw:APA91bExxxAVjVtcJMsj8Y61kygShgwnJ8uO-BwbG4JCYc98r6oDUY_a99LK6JuKcWklFTm9hljzQE-r_B15DSm5yDwfp6TmWcNXsKQoI4bpcwhmj_U8qg1oQBPdzcgd2SNIyx-9M8qn"];
      
        //If comment is public, then notification should say that user tagged the recipient
        if (checked) {
          var array = data.slice();
          console.log("PUBLIC");

          json = JSON.stringify({ "data": {"status" : "tagged you on", "pic" : picture, "first" : userName.split(" ")[0], "comment" : value, "url" : url, "pageTitle" : pageTitle, "names" : names, "ids" : ids, "tagsHtml" : tagsHtml}, 
            "registration_ids": data });
          $.post("https://pickle-server-183401.appspot.com/notification/", {"picture" : picture, "user" : userName.split(" ")[0], "notification" : "left a comment on", "cookies" : tags, "url" : url, "page" : pageTitle}, function(notif) {
            notify(data, json);
          });
        }
        //Else if comment is private, notification should say that the user sent a secret message to recipient                 
        else {
          console.log("SECRET");
          var array = data.slice();
          

          json = JSON.stringify({ "data": {"status" : "sent you a secret message on", "pic" : picture, "first" : userName.split(" ")[0], "comment" : value, "url" : url, "pageTitle" : pageTitle, "names" : names, "ids" : ids, "tagsHtml" : tagsHtml}, "registration_ids": data });
          $.post("https://pickle-server-183401.appspot.com/notification/", {"picture" : picture, "user" : userName.split(" ")[0], "notification" : "tagged you on", "cookies" : tags, "url" : url, "page" : pageTitle}, function(notif) {
                notify(data, json);
          });
        

        }

        
  
    });
}

function like(userName, userID, id, liked, picture, pageTitle){

  if (liked == "false") {
    $.post("http://pickle-server-183401.appspot.com/unlike/", {"commentID" : id, "userID" : userID});
  }
  else {
    $.post("http://pickle-server-183401.appspot.com/like/", {"commentID" : id, "userID" : userID});
  }

  //Get data about comment being liked
  $.get("https://pickle-server-183401.appspot.com/commentUser/" + id, function(data) {
  data = JSON.parse(data);

    //Send notification if user is not liking his own comment
    if (userName.split(" ")[0] != data['first']) {

      //post notification to db
      var tags = '["'+data['id']+'"]';
      $.post("https://pickle-server-183401.appspot.com/notification/", {"picture" : picture, "user" : userName.split(" ")[0], "notification" : "liked your comment on", "cookies" : tags, "url" : data['url'], "page" : pageTitle});
      //Send push message for chrome notification
      json = JSON.stringify({ "data": {"status" : "liked your comment on", "pic" : picture, "first" : userName.split(" ")[0], "comment" : "", "url" : data['url'], "pageTitle" : pageTitle}, 
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

function logData() {
  chrome.storage.local.get(['userID'], function(data) {
    var id = data['userID'];
    if (permissions.indexOf(id) != -1) {
    chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {

       var activeTab = arrayOfTabs[0];
       url = activeTab.url;
       $.post("https://pickle-server-183401.appspot.com/history/", {"url" : url, "user" : id});
   });
  }

  });

}

function notify(data, json) {
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
}






   


