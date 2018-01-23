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
var friendsHTMLGroup;
var friendsHTMLDirect;
var done = false;
var successURL = 'www.facebook.com/connect/login_success.html';
var permissions = [];
var postsHTML;
var groupsHTML;
var commentsJSON;
var notificationsJSON = {};

chrome.storage.local.get(['accessToken'], function(result) {

  var token = result['accessToken'];

  if (token) {
    chrome.browserAction.setPopup({popup : "newsfeed.html"});
  }


});


chrome.gcm.onMessage.addListener(function(payload) {
  console.log("RECEIVED MESSAGE");
  var type = payload.data.type;
  var groupID = payload.data.groupID;
  //done = true;
  var views = chrome.extension.getViews({type : "popup"});
  //console.log(views.length);

  done = false;
  chrome.storage.local.get(['accessToken'], function(data) {
    
  if (data['accessToken'] != null) { 

    
    session = data['accessToken'];
  
    $.get("https://pickle-server-183401.appspot.com/user/" + session, function(data){
      var json = JSON.parse(data);
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

          if (type == "leave") {
            $.post("http://pickle-server-183401.appspot.com/loadGroupData/", {"id" : userID.toString()}, function (data) {
                    
                  chrome.storage.local.set({"groupInfo" : JSON.parse(data)});
                  console.log(JSON.parse(data));
                  });

          }
          
          if (type == "notification") {
            $("body").load("http://pickle-server-183401.appspot.com/loadnotifications/ #notifications", {"id" : userID.toString()}, function () {
              notificationsHTML = $("#notifications").html();
              chrome.storage.local.set({"notificationsHTML" : notificationsHTML});
              console.log("updating notifications");
              // getUserData()
            });

            $.post("http://pickle-server-183401.appspot.com/loadPosts/", {"id" : userID.toString(), "groupID" : groupID}, function (groupsHTML) {
               var json = {};
               json[groupID] = groupsHTML;
               chrome.storage.local.set(json);
               console.log("updating newsfeed");
               // getUserData();
            });

            $.post("http://pickle-server-183401.appspot.com/loadPosts/", {"id" : userID.toString(), "groupID" : "general"}, function (groupsHTML) {
               var json = {};
               json["general"] = groupsHTML;
               chrome.storage.local.set(json);
               console.log("updating newsfeed");
               // getUserData();
            });

            chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
              var activeTab = arrayOfTabs[0];
              url = activeTab.url;
            });

            var profilePic = payload.data.pic;
            var user = payload.data.first;
            var comment = payload.data.comment;
            var commentID = payload.data.commentID;
            //Added a variable for the page title to create the notification
            var page = payload.data.pageTitle;
            var commentUrl = payload.data.url;
            var notification = payload.data.status;
            var groupName = payload.data.currentGroupName;
            var groupID = payload.data.groupID;
            var pageImage = payload.data.pageImage;

            chrome.storage.local.get(['lastComment'], function(result) {
              //Account for multiple gcm messages
              if(commentID != result['lastComment']) {
                chrome.storage.local.set({"lastComment" : commentID});
                chrome.notifications.create({   
                type: 'basic', 
                iconUrl: 'iconBig.png',
                imageUrl: pageImage, 
                //Added the page name to the notification (to be shown in the title of the notification) 
                title: groupName+": "+user+' '+notification, 
                //Show the actual comment in the message
                message: comment

                }, function (notif) {
                  dict = {};
                  dict[notif] = commentUrl;
                  chrome.storage.local.set(dict);
                });
              }

              //update notification badges
              chrome.storage.local.get(['notificationsJSON'], function(data) {
                notificationsJSON = data['notificationsJSON'];
                if (!(notificationsJSON[groupID])) {
                  notificationsJSON[groupID] = 1;
                }
                else {
                  notificationsJSON[groupID] += 1;
                  chrome.storage.local.set({"notificationsJSON" : notificationsJSON});
                }
                //Update extension icon badge
                updateBadge(notificationsJSON);
              });
            });
          }

        if (type == "postGeneral") {
          console.log("message postGeneral");
          $.post("http://pickle-server-183401.appspot.com/loadPosts/", {"id" : userID.toString(), "groupID" : "general"}, function (groupsHTML) {
            var json = {};
            json["general"] = groupsHTML;
            chrome.storage.local.set(json);
            console.log("updating General newsfeed");
            // getUserData();
          });

          //Update notification badges
          var commentID = payload.data.commentID;
          chrome.storage.local.get(['lastComment'], function(result) {
            //Account for multiple gcm messages
            if(commentID != result['lastComment']) {
              chrome.storage.local.set({"lastComment" : commentID});
              chrome.storage.local.get(['notificationsJSON'], function(data) {
                notificationsJSON = data['notificationsJSON'];
                if (!(notificationsJSON['general'])) {
                  notificationsJSON['general'] = 1;
                }
                else {
                  notificationsJSON['general'] += 1;
                }
                chrome.storage.local.set({"notificationsJSON" : notificationsJSON});
                //Update extension icon badge
                updateBadge(notificationsJSON);
              });
            }
          });
        }


          if (type == "deletePost") {
            $.post("http://pickle-server-183401.appspot.com/loadPosts/", {"id" : userID.toString(), "groupID" : groupID}, function (groupsHTML) {
               var json = {};
               json[groupID] = groupsHTML;
               chrome.storage.local.set(json);
               console.log("updating newsfeed");
               // getUserData();
              });

              $.post("http://pickle-server-183401.appspot.com/loadPosts/", {"id" : userID.toString(), "groupID" : "general"}, function (groupsHTML) {
               var json = {};
               json["general"] = groupsHTML;
               chrome.storage.local.set(json);
               console.log("updating newsfeed");
               // getUserData();
              });


          }

          if (type == "deleteGeneral") {

              $.post("http://pickle-server-183401.appspot.com/loadPosts/", {"id" : userID.toString(), "groupID" : "general"}, function (groupsHTML) {
               var json = {};
               json["general"] = groupsHTML;
               chrome.storage.local.set(json);
               console.log("updating newsfeed");
               // getUserData();
              });


          }



          if (type == "post") {
              
              console.log("message post");

              var poster = payload.data.poster;
              var groupName = payload.data.currentGroupName;
              var groupID = payload.data.groupID;
              var comment = payload.data.comment;
              var commentID = payload.data.commentID;
              var commentUrl = payload.data.url;
              var pageTitle = payload.data.pageTitle;
              var tags = payload.data.tags;

              console.log(groupID)
              console.log(commentID)

              $.post("http://pickle-server-183401.appspot.com/loadPosts/", {"id" : userID.toString(), "groupID" : groupID}, function (groupsHTML) {
               var json = {};
               json[groupID] = groupsHTML;
               chrome.storage.local.set(json);
               console.log("updating newsfeed");
               // getUserData();
              });

              $.post("http://pickle-server-183401.appspot.com/loadPosts/", {"id" : userID.toString(), "groupID" : "general"}, function (groupsHTML) {
               var json = {};
               json["general"] = groupsHTML;
               chrome.storage.local.set(json);
               console.log("updating newsfeed");
               // getUserData();
              });

              chrome.storage.local.get(['lastComment'], function(result) {
                console.log(result['lastComment']);
                //Account for multiple gcm messages
                if(commentID != result['lastComment']) {

                  chrome.storage.local.set({"lastComment" : commentID});
                  var notificationTitle = poster + " @ " + groupName; 

                  if (groupName.charAt(0) == '@') {
                    notificationTitle = poster;
                  }

                  //update notification badges
                  chrome.storage.local.get(['notificationsJSON'], function(data) {
                    notificationsJSON = data['notificationsJSON'];
                    if (!(notificationsJSON[groupID])) {
                      notificationsJSON[groupID] = 1;
                    }
                    else {
                      notificationsJSON[groupID] += 1;
                    }
                    chrome.storage.local.set({"notificationsJSON" : notificationsJSON});
                    //Update extension icon badge
                    updateBadge(notificationsJSON);
                  });
                  
                  //Create notification only if user is not directly tagged
                  if (tags.indexOf(userID) == -1) {
                    console.log("User not tagged!");
                    chrome.notifications.create({   
                      type: 'basic', 
                      iconUrl: 'iconBig.png', 
                      title: notificationTitle, 
                      message: comment

                      }, function (notif) {
                        dict = {};
                        dict[notif] = commentUrl;
                        chrome.storage.local.set(dict);
                      });
                  }
                }
              });

          }

          //Reload groups and create notification when user is added to a new group
          if (type == "newGroup") {

              var l1 = $.Deferred(),
                  l2 = $.Deferred(),
                  l3 = $.Deferred(),
                  l4 = $.Deferred(),
                  l5 = $.Deferred();

            $("body").load("http://pickle-server-183401.appspot.com/groupNames/ #groups", {"id" : userID.toString()}, function () {
              groupsHTML = $("#groups").html();
              chrome.storage.local.set({groupsHTML : groupsHTML});
              l1.resolve();
            });

            $.post("http://pickle-server-183401.appspot.com/loadGroupData/", {"id" : userID.toString()}, function (data) {
              chrome.storage.local.set({"groupInfo" : JSON.parse(data)});
              l2.resolve();
            });

            var friendIds = friendsArray.map(function(value,index) { return value[0]; });
            $.post("http://pickle-server-183401.appspot.com/addMembersList/", {"id" : userID.toString(), "friends" : JSON.stringify(friendIds)}, function (data) {
              chrome.storage.local.set({"addMembersHTML" : JSON.parse(data)});
              l3.resolve();
            });

            $.post("http://pickle-server-183401.appspot.com/loadPosts/", {"id" : userID.toString(), "groupID" : payload.data.groupID}, function (groupsHTML) {
               var json = {};
               json[groupID] = groupsHTML;
               chrome.storage.local.set(json);
               console.log("updating new group newsfeed");
               l4.resolve();
               // getUserData();
            });

            $.post("http://pickle-server-183401.appspot.com/loadPosts/", {"id" : userID.toString(), "groupID" : "general"}, function (groupsHTML) {
              var json = {};
              json["general"] = groupsHTML;
              chrome.storage.local.set(json);
              console.log("updating general feed");
              l5.resolve();
              // getUserData();
            });

            $.when(l1, l2, l3, l4, l5).done(function (){
              var poster = payload.data.poster;
              var groupName = payload.data.groupName;

              chrome.notifications.create({   
                type: 'basic', 
                iconUrl: 'iconBig.png', 
                title: poster + " added you to a group ", 
                message: groupName
              });
            });

          }
         
          }

          });

  
    }

  });  
  
});


chrome.notifications.onClicked.addListener(function (id) {

	chrome.storage.local.get(id, function (result) {
        var redirect = result;
        var link = redirect[Object.keys(redirect)[0]];

        chrome.tabs.create({'url': link}, function(tab) {
    			// Tab opened.
 			 });
        
    });

  //chrome.storage.local.remove(['commentsHTML', 'friendsArray', 'notifications', 'friendsHTML']);
  chrome.storage.local.remove(['commentsHTML', 'notifications']);
  done = false;
  getUserData();

  chrome.browserAction.setPopup({popup : "popup.html"});

});


function getUserData() {


  chrome.storage.local.get(['accessToken', 'userName', 'userEmail', 'session', 'picture', 'userID', 'defaultPopup'], function(data) {
    
  var popup = data['defaultPopup'];

  if (data['accessToken'] != null) { 

    session = data['accessToken'];
    
    $.get("http://pickle-server-183401.appspot.com/user/" + session, function(data) {
      var json = JSON.parse(data);
      if (json.status == false) {
        chrome.browserAction.setPopup({popup : "register.html"});
    
      } else { 
          // chrome.browserAction.setPopup({popup : popup});
          userName = json.name;
          userEmail = json.email;
          friendsArray = json.friends;
          userID = json.id;
          picture = json.picture;
          notifications = json.notifications;
          var groups = json.groups;
          //Set icon to active state
          chrome.browserAction.setIcon({path:"iconActive128.png"});


          chrome.storage.local.get(['currentGroup'], function (data){
            if (data['currentGroup'] === null) {
              chrome.storage.local.set({"currentGroup" : "general"});
            }
          });
          
          chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {

          var activeTab = arrayOfTabs[0];

          $.post("https://pickle-server-183401.appspot.com/canonicalize/", {"url" : activeTab.url}, function(data) {
            
            url = data;
            // console.log(url);
            var d1 = $.Deferred(),
                d2 = $.Deferred(),
                d3 = $.Deferred(),
                d4 = $.Deferred(),
                d5 = $.Deferred(),
                d6 = $.Deferred();
            
            $.post("http://localhost:5000/loadComment/", {"userID" : userID.toString(), "url" : url.toString()}, function(data) {
              var groupsComments = JSON.parse(data);
              commentsJSON = groupsComments;
              d1.resolve();
            });  
            // $("body").load("http://pickle-server-183401.appspot.com/loadnotifications/ #notifications", {"id" : userID.toString()}, function () {
            //   notificationsHTML = $("#notifications").html();
            //   d2.resolve();
            // });
            var friendIds = friendsArray.map(function(value,index) { return value[0]; });
            // console.log(friendIds);
            $("body").load("http://pickle-server-183401.appspot.com/friends/ #friends", {"id" : userID.toString(), "friends" : JSON.stringify(friendIds), "direct" : ''}, function () {
              friendsHTMLGroup = $("#friends").html();
              d2.resolve();
            });

            $("body").load("http://pickle-server-183401.appspot.com/friends/ #friends", {"id" : userID.toString(), "friends" : JSON.stringify(friendIds), "direct" : 'direct'}, function () {
              friendsHTMLDirect = $("#friends").html();
              d3.resolve();
            });

            $("body").load("http://pickle-server-183401.appspot.com/groupNames/ #groups", {"id" : userID.toString()}, function () {
              groupsHTML = $("#groups").html();
              d4.resolve();
            });

            $.post("http://pickle-server-183401.appspot.com/loadGroupData/", {"id" : userID.toString()}, function (data) {
              chrome.storage.local.set({"groupInfo" : JSON.parse(data)});
              d5.resolve();
            });

            $.post("http://pickle-server-183401.appspot.com/addMembersList/", {"id" : userID.toString(), "friends" : JSON.stringify(friendIds)}, function (data) {
              chrome.storage.local.set({"addMembersHTML" : JSON.parse(data)});
              d6.resolve();
            });
            
            $.when(d1, d2, d3, d4, d5, d6).done(function () {
              
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
                "commentsJSON" : commentsJSON,
                "friendsHTMLGroup" : friendsHTMLGroup,
                "friendsHTMLDirect" : friendsHTMLDirect,
                "postsHTML" : postsHTML, 
                "groupsHTML" : groupsHTML});
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
  // chrome.storage.local.remove(['commentsHTML', 'friendsArray', 'notifications', 'friendsHTML']);
  chrome.storage.local.remove(['commentsHTML', 'notifications', 'friendsHTML']);
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
      comment(request.userID, request.url, request.value, request.tags, request.all, request.picture, request.pageTitle, request.checked, request.currentGroup, request.currentGroupName);
      done = false;

    } 

    else if (request.type == "like"){

      like(request.userName, request.userID, request.id, request.liked, request.picture, request.pageTitle);

      done = false;
    }

    //Create a new group upon receiving message from scripts2
    else if (request.type == "createGroup") {

      $.post("http://pickle-server-183401.appspot.com/createGroup/", {"id" : userID.toString(), "name" : request.groupName, "ids" : JSON.stringify(request.ids), "users" : JSON.stringify(request.users), 'direct' : ''}, function(groupID) {
        chrome.storage.local.set({"currentGroup" : groupID}, function () {
          
          var l1 = $.Deferred(),
              l2 = $.Deferred();
              l3 = $.Deferred();
          
          $.post("http://pickle-server-183401.appspot.com/loadGroupData/", {"id" : userID.toString()}, function (data) {         
            chrome.storage.local.set({"groupInfo" : JSON.parse(data)});
            l1.resolve();              
          });

          $("body").load("http://pickle-server-183401.appspot.com/groupNames/ #groups", {"id" : userID.toString()}, function () {
            chrome.storage.local.set({groupsHTML : $("#groups").html()});
            l2.resolve();
          });
          var friendIds = friendsArray.map(function(value,index) { return value[0]; });
          if (friendIds) {
            $.post("http://pickle-server-183401.appspot.com/addMembersList/", {"id" : userID.toString(), "friends" : JSON.stringify(friendIds)}, function (data) {
              chrome.storage.local.set({"addMembersHTML" : JSON.parse(data)});
              l3.resolve();
            });
          }

          $.when(l1, l2, l3).done(function (){
            notifyNewGroup(request.groupName, groupID, request.ids, userName);
            sendResponse({newsfeed : "newsfeed.html"});
          });
        });
      });
      return true;
    }

    //Add new members to existing group upon receiving message from scripts2
    else if (request.type == "addGroupMembers") {
      $.post("http://pickle-server-183401.appspot.com/addGroupMembers/", {"groupID" : request.groupID, "users" : JSON.stringify(request.users)}, function() {
        var l1 = $.Deferred(),
            l2 = $.Deferred();
        var friendIds = friendsArray.map(function(value,index) { return value[0]; });
        if (friendIds) {
          $.post("http://pickle-server-183401.appspot.com/addMembersList/", {"id" : userID.toString(), "friends" : JSON.stringify(friendIds)}, function (data) {
            chrome.storage.local.set({"addMembersHTML" : JSON.parse(data)});
            l1.resolve();
          });
        }
        $.post("http://pickle-server-183401.appspot.com/loadGroupData/", {"id" : userID.toString()}, function (data) {   
          chrome.storage.local.set({"groupInfo" : JSON.parse(data)});
          l2.resolve();
        });
        $.when(l1, l2).done(function (){
          notifyNewGroup(request.groupName, request.groupID, request.users, userName);
          sendResponse({groupDetails : "groupDetails.html"});
        });
      });
      return true;
    }

    else if (request.type == "deletePost") {
      deletePost(request.postID);
      
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

chrome.storage.local.get(['accessToken', 'userID'], function(result) {

  var token = result['accessToken'];
  var id = result['userID'];
  var popup = result['defaultPopup'];
  // console.log(!token);
  if (!token) {
    console.log("LOGIN");
    chrome.tabs.query({}, function(tabs) { 
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].url.indexOf(successURL) != -1) {
          
          var params = tabs[i].url.split('#')[1];

          
          var accessToken = params.split('&')[0];
          accessToken = accessToken.split('=')[1];

          chrome.storage.local.set({'accessToken' : accessToken}, function() {
              $.get("https://graph.facebook.com/v2.11/me?fields=id,name,picture,friends.limit(5000),email&access_token=" + accessToken, function(api) {
                userID = api.id;
                userName = api.name;
                userEmail = api.email;
                picture = api.picture.data.url;
                $.post('http://pickle-server-183401.appspot.com/register/', {"json" : JSON.stringify({"status" : true, "id" : userID, "name" : userName, "email" : userEmail, "friends" : api.friends.data, "picture" : picture, "authToken" : accessToken})}, function() {

                  $.post("http://pickle-server-183401.appspot.com/getGroups/", {"id" : userID.toString()}, function(array) {
                    var groupsIDs = JSON.parse(array);
                    groupsIDs.forEach(function(element) {

                      $.post("http://pickle-server-183401.appspot.com/loadPosts/", {"id" : userID.toString(), "groupID" : element}, function (data) {
                        var json = {};
                        json[element] = data;
                        chrome.storage.local.set(json);
                      });

                    });

                    
                    
                    $.post("http://pickle-server-183401.appspot.com/loadPosts/", {"id" : userID.toString(), "groupID" : "general"}, function (data) {   
                      chrome.storage.local.set({"general" : data});
                      chrome.extension.sendMessage({handshake:"login"});
                    });

                  });
              
                  $("body").load("http://pickle-server-183401.appspot.com/loadnotifications/ #notifications", {"id" : userID.toString()}, function () {
                   notificationsHTML = $("#notifications").html();
                  chrome.storage.local.set({"notificationsHTML" : notificationsHTML});

            });

                $.post("http://pickle-server-183401.appspot.com/loadGroupData/", {"id" : userID.toString()}, function (data) {
                    
                  chrome.storage.local.set({"groupInfo" : JSON.parse(data)});
                  });

                  $.get("http://pickle-server-183401.appspot.com/getNotificationsDict/", {"id" : userID.toString()}, function (data) {
                  chrome.storage.local.set({"notificationsJSON" : JSON.parse(data)});
                  updateBadge(JSON.parse(data));
              
                  });

                  var l1 = $.Deferred(),
                      l2 = $.Deferred(),
                      l3 = $.Deferred();

                  $("body").load("http://pickle-server-183401.appspot.com/groupNames/ #groups", {"id" : userID.toString()}, function () {
                    groupsHTML = $("#groups").html();
                    l1.resolve();
              
                  })

                  chrome.storage.local.set({"currentGroup" : "general"}, function () {
                      l2.resolve();
                  });

                  $.when(l1, l2, l3).done(function (){
                      // chrome.extension.sendMessage({handshake:"login"});
                  });


                  var senderIds = ["511642730215"];
                  chrome.gcm.register(senderIds, function (registrationID) {
                  $.post("https://pickle-server-183401.appspot.com/token/", {"session" : accessToken, "token" : registrationID});
          });

                });
              });     
          });
          chrome.tabs.remove(tabs[i].id);
          chrome.browserAction.setPopup({popup : "newsfeed.html"});
        }
      }
    });
  } else {
    // chrome.browserAction.setPopup({popup : "newsfeed.html"});
  }

  

  });
}



function comment(userID, url, value, tags, all, picture, pageTitle, checked, currentGroup, currentGroupName) {
  console.log(picture);
  var d1 = $.Deferred();
  var storage = chrome.storage.local.get(['accessToken'], function(data) {
  var image = "", description = "", title = "";

  if (data['accessToken'] != null) { 
    
    session = data['accessToken'];

      var fbPost = $.post("https://graph.facebook.com/v2.11/?id=" + encodeURIComponent(url) + "?scrape=true&access_token=" + session, function(api) {
        console.log(api);
        if (api.image != null) {
          image = api.image[0].url;
          console.log(image);
        } 

        if (api.description != null) {
          description = api.description;
          console.log(api.description);
        } 
        if (api.title != null) {
          console.log(api.title);
          title = api.title;
        } 

        var length = 80;
        var trimmedString = description.length > length ? description.substring(0, length - 3) + "..." : description;
        chrome.storage.local.set({"pageTitle" : title, "pageImage" : image, "pageDescription" : trimmedString});

        d1.resolve();
      });

      fbPost.fail(
        function(jqXHR, textStatus, errorThrown) {
          chrome.storage.local.set({"pageTitle" : pageTitle, "pageImage" : image, "pageDescription" : description});
          console.log("FB SCRAPER FAILED");
          d1.resolve();
        });

    }
  });

  $.when(d1).done(function () {

    //Send post to server for processing and reload all feeds when posting is complete
    chrome.storage.local.get(['pageTitle', 'pageImage', 'pageDescription', 'currentGroup'], function(store) {

      //Append outgoing post to chrome storage and send message to scripts to append it to DOM
      var outgoingCurrentString = "outgoing-" + currentGroup;
      var outgoingCurrent;
      var outgoingGeneral;
      chrome.storage.local.get([outgoingCurrentString], function(result) {
        domain = url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
        if (result[outgoingCurrentString]) {
          console.log(picture);
          outgoingCurrent = result[outgoingCurrentString];
          outgoingCurrent.push('<div class="card cardNewsfeed mb-3"><p class="postDescription"><i class="fa fa-spinner fa-spin mr-2"></i>Yipping this page</p><div class="message d-flex flex-nowrap align-items-start"><div class="thumbnail"><img src='+picture+'></div><p class="chatBubble mb-0">'+value+'</p></div><div class="pageImg d-flex align-items-center"><a href='+url+' class="notificationTab"><img src='+store['pageImage']+'></a></div><div class="pageInfo"><a href='+url+' class="notificationTab pageTitle"><h1>'+store['pageTitle']+'</h1></a><p class="pageDescription">'+store['pageDescription']+'</p><p class="pageDomain">'+domain+'</p></div></div>');
        }
        else {
          console.log(picture);
          outgoingCurrent = ['<div class="card cardNewsfeed mb-3"><p class="postDescription"><i class="fa fa-spinner fa-spin mr-2"></i>Yipping this page</p><div class="message d-flex flex-nowrap align-items-start"><div class="thumbnail"><img src='+picture+'></div><p class="chatBubble mb-0">'+value+'</p></div><div class="pageImg d-flex align-items-center"><a href='+url+' class="notificationTab"><img src='+store['pageImage']+'></a></div><div class="pageInfo"><a href='+url+' class="notificationTab pageTitle"><h1>'+store['pageTitle']+'</h1></a><p class="pageDescription">'+store['pageDescription']+'</p><p class="pageDomain">'+domain+'</p></div></div>'];
        }
        chrome.storage.local.set({[outgoingCurrentString] : outgoingCurrent});
      });
      chrome.extension.sendMessage({type : "cardInfoReady", value : value, url : url, currentGroup : currentGroup});

      var comPost = $.post('http://localhost:5000' + '/comment/', {"userId" : userID, "url" : url.toString(), "string" : value, "tags" : tags, "public" : all, "pageTitle" : store['pageTitle'], 
        "pageImage" : store['pageImage'], "pageDescription" : store['pageDescription'], "groupID" : currentGroup}, function(data) {
          // var feeds = JSON.parse(JSON.parse(data)[0]);
          var groupID = JSON.parse(data)[2];
          var userID = JSON.parse(data)[3];
          var comment = JSON.parse(data)[4];
          var feed = JSON.parse(data)[5];
          var friendsof = JSON.parse(JSON.parse(data)[6]); //friends of all friends of users
          data = JSON.parse(JSON.parse(data)[1]); // users directly tagged

        if (feed != null) {
          $.post("http://pickle-server-183401.appspot.com/friendsOfFriends/", {"groupID" : groupID, "userID" : userID, "comment" : comment, "feed" : feed}, function(friendsData){
            console.log("friendsOfFriends");
            var feeds = JSON.parse(friendsData);
            var feedJSON = JSON.stringify({ "data": {"type" : "post", "groupID" : currentGroup, "poster": userName, "currentGroupName": currentGroupName, "comment" : value, "commentID" : comment, "url" : url, "pageTitle": pageTitle, "tags" : tags}, "registration_ids": feeds});
            console.log(currentGroup);
            notify(feeds, feedJSON);
          });
        }
          
          var d1 = $.Deferred(),
              d2 = $.Deferred();

          $.post("http://pickle-server-183401.appspot.com/loadPosts/", {"id" : userID.toString(), "groupID" : currentGroup}, function (response, status, xhr) {
            var json = {};
            console.log(currentGroup);
            json[currentGroup] = response;
            chrome.storage.local.set(json);
            console.log("group newsfeed updated");
            d1.resolve();
          });

          $.post("http://pickle-server-183401.appspot.com/loadPosts/", {"id" : userID.toString(), "groupID" : "general"}, function (html) {
            var json = {};
            json["general"] = html;
            chrome.storage.local.set(json);
            console.log("general newsfeed updated");
            d2.resolve();          
          });

          $.when(d1).done(function() {
  
            //When posting is done, remove pending post from container with outgoing posts
            var outgoingCurrentString = "outgoing-" + currentGroup;
            chrome.storage.local.get([outgoingCurrentString], function(result) {
              var outgoingCurrent = result[outgoingCurrentString];
              if (outgoingCurrent) {
                outgoingCurrent.shift();
              }
              chrome.storage.local.set({[outgoingCurrentString] : outgoingCurrent});
            });

            //Send message to scripts2 to refresh newsfeed after posting is done
            chrome.extension.sendMessage({type : "yippPostedCurrent"});

          });

          $.when(d2).done(function() {
            // chrome.extension.sendMessage({type : "yippPostedGeneral"});
            // chrome.storage.local.get(['outgoing-general'], function(result) {
            //   var outgoingGeneral = result["outgoing-general"];
            //   outgoingGeneral.shift();
            //   chrome.storage.local.set({"outgoing-general" : outgoingGeneral});
            // });
          });

          var genJSON = JSON.stringify({ "data": {"type" : "postGeneral", "commentID" : comment, "pageTitle": pageTitle,}, "registration_ids": friendsof});
          notify(friendsof, genJSON);

          //Send notification to tagged users
          if (checked) {
            var array = data.slice();
            console.log("PUBLIC");
            var json = JSON.stringify({"data" : {"status" : "tagged you", "pic" : picture, "first" : userName, "comment" : value, "commentID" : comment, "url" : url, "pageTitle" : pageTitle, "type" : "notification", "groupID" : currentGroup, "currentGroupName": currentGroupName, "pageImage" : store['pageImage']}, "registration_ids": data });
          
            $.post("http://pickle-server-183401.appspot.com/notification/", {"picture" : picture, "user" : userName.split(" ")[0], "notification" : "tagged you on", "cookies" : tags, "url" : url, "page" : pageTitle}, function(notif) {
              // console.log("notify", data, json);
              notify(data, json);
            });
          }

        });

      comPost.fail(function(jqXHR, textStatus, errorThrown) {
        //If posting fails, remove pending post from container with outgoing posts  
        console.log(jqXHR.responseText);   
        var outgoingCurrentString = "outgoing-" + currentGroup;
        chrome.storage.local.get([outgoingCurrentString], function(result) {
          var outgoingCurrent = result[outgoingCurrentString];
          outgoingCurrent.shift();
          chrome.storage.local.set({[outgoingCurrentString] : outgoingCurrent});
        });
        chrome.extension.sendMessage({type : "commentError"});

      });

    });

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

function notifyNewGroup(groupName, groupID, newUsers, posterName) {
  $.post("http://pickle-server-183401.appspot.com/friendstokens/", {"friends" : "["+newUsers.toString()+"]"}, function (data) {
    var sessions = JSON.parse(data);
    json = JSON.stringify({ "data": {"type" : "newGroup", "groupName" : groupName, "groupID" : groupID, "poster" : posterName}, "registration_ids": sessions });
    notify(sessions, json);
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
            success: function(){},
            error: function (jqXHR, exception) {console.log(jqXHR.responseText);}
              });

      }
}

//This function allows for trimming of strings
String.prototype.trimToLength = function(m) {
  return (this.length > m) 
    ? jQuery.trim(this).substring(0, m).split(" ").slice(0, -1).join(" ") + "..."
    : this;
};

//This function updates the extension icon badge for notifications
function updateBadge(notificationsJSON) {
  var total = 0;
  Object.keys(notificationsJSON).forEach(function(key) {
    total += notificationsJSON[key];
  });
  if (total == 0) {
    chrome.browserAction.setBadgeText({text: ""});
  }
  else {
  chrome.browserAction.setBadgeText({text: total.toString()});
  }
}

function deletePost(postID) {
  $.post("http://pickle-server-183401.appspot.com/deletePost/", {feed : postID}, function(groupData) {

    var group = JSON.parse(groupData)[0];
    var memberSet = JSON.parse(JSON.parse(groupData)[1]);
    var generalSet = JSON.parse(JSON.parse(groupData)[2]);

    if (group) {

      var memberJSON = JSON.stringify({ "data": {"type" : "deletePost", "groupID" : group}, "registration_ids": memberSet });
      notify(memberSet, memberJSON);

  }

    var generalJSON = JSON.stringify({ "data": {"type" : "deleteGeneral"}, "registration_ids": generalSet});
    notify(generalSet, generalJSON);


    chrome.storage.local.get(['currentGroup', 'userID'], function(result) {
      $.post("http://pickle-server-183401.appspot.com/loadPosts/", {"id" : result.userID.toString(), "groupID" : result['currentGroup']}, function (groupsHTML) {
        var json = {};
        json[result['currentGroup']] = groupsHTML;
        chrome.storage.local.set(json);
        console.log("updating group newsfeed");
        // getUserData();
        });
    
    $.post("http://pickle-server-183401.appspot.com/loadPosts/", {"id" : result.userID.toString(), "groupID" : "general"}, function (groupsHTML) {
      var json = {};
      json["general"] = groupsHTML;
      chrome.storage.local.set(json);
      console.log("updating general newsfeed");
      // getUserData();
      });

    });
  });
}
