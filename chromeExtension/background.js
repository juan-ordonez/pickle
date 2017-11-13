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


chrome.gcm.onMessage.addListener(function(payload) {


  cookie = chrome.cookies.getAll({ url: "https://pickle-server-183401.appspot.com"}, function(data) {
    
  if (data.length >= 1) { 
    
    

    session = data[0].value

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
        // var iframe;

        // iframe = document.createElement('iframe');
        // iframe.id = "iframe"
        // iframe.src = "https://pickle-server-183401.appspot.com/connect/";
        // iframe.style.display = 'none';
        // document.body.appendChild(iframe);
        console.log("needs to be updated");
      } else {
          userName = json.name;
          userEmail = json.email;
          friendsArray = json.friends;
          userID = json.id;
          picture = json.picture;
          notifications = json.notifications;
          console.log(userID);
         
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


function getUserData(callback) {
  
  cookie = chrome.cookies.getAll({ url: "https://pickle-server-183401.appspot.com"}, function(data) {
    
  if (data.length >= 1) { 

    session = data[0].value

    var senderIds = ["511642730215"];
    chrome.gcm.register(senderIds, function (registrationID) {
    $.post("https://pickle-server-183401.appspot.com/token/", {"session" : session, "token" : registrationID});
    });
    
    $.get("https://pickle-server-183401.appspot.com/user/" + session, function(data) {
      json = JSON.parse(data);
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

          console.log(activeTab);

          $.post("https://pickle-server-183401.appspot.com/canonicalize/", {"url" : activeTab.url}, function(data) {
            url = data;
            // console.log(url);
            
            $("body").load("http://pickle-server-183401.appspot.com/loadComment/ #comments", {"userID" : userID.toString(), "url" : url.toString()}, function(data){
                    //Enable tooltips
                    // $(function () {
                    //   $('[data-toggle="tooltip"]').tooltip()
                    // })
                    // $("#formNewComments .loadingSpinner").hide();
                    // if ($("#formNewComments").height() > 425) {
                    //   $("#formNewComments").removeClass("commentsNoScroll");
                    //   $("#formNewComments").addClass("commentsScroll");
                    //   $(".containerComments").scrollTop($(".containerComments")[0].scrollHeight);
                    // }
                    // console.log("comments html: " + $("#comments").html());
                    commentsHTML = $("#comments").html();

                });  
            $("body").load("http://pickle-server-183401.appspot.com/loadnotifications/ #notifications", {"id" : userID.toString()}, function(data) {
              // $("#notificationsContainer .loadingSpinner").hide();
              // $("#notificationsContainer .cardList").show();
              // console.log("notifications html: " + $("#notifications").html());
              notificationsHTML = $("#notifications").html();
            });
            $("body").load("http://pickle-server-183401.appspot.com/friends/ #friends", {"id" : userID.toString(), "friends" : JSON.stringify(friendsArray)}, function(data) {
              // console.log("friends html: " + $("#friends").html());
              friendsHTML = $("#friends").html();
            });
            // $("#accountName").append(userName);
            // $("#accountProfilePicture").attr("src", picture);



        });


          
        });
      }


    });


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
"friendsHTML" : friendsHTML}, function() {
  console.log("saved data in storage");
  chrome.storage.local.get(['commentsHTML'], function(result) {
      console.log(result['commentsHTML']);
    });
});

  } else {
    console.log("logged out");
    chrome.browserAction.setPopup({popup : "register.html"});
      
    }

  });

}



chrome.tabs.onActivated.addListener(function(activeInfo) {

  getUserData();

});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    sendResponse({commentsHTML : commentsHTML});
  });

chrome.storage.onChanged.addListener(function(changes, areaName) {
    console.log("changed");
    });




   






































