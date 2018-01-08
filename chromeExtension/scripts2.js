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
var postsHTML;
var groupsHTML;
var friendsHTMLDirect;
var friendsHTMLGroup;

chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
  
  var activeTab = arrayOfTabs[0];
  url = activeTab.url;
  var domain = url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
  pageTitle = activeTab.title;

  //Populate active tab card in newsfeed
  if ($("#activePageCard")) {
    $("#activePageTitle").text(pageTitle.trimToLength(80));
    $("#activePageUrl").text(domain);
    $(document).on("click", "#viewComments", function(){
      window.location.href = chrome.extension.getURL('popup.html');
    });
  }

  //Submit comments
  if (document.getElementById("submitComment")) {
    $(document).on("click", "#submitComment", comment);
  }

  //Submit Yipp
  if ($("#submitYipp")) {
    $(document).on("click", "#submitYipp", yippIt);
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
      // chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
      //   var activeTab = arrayOfTabs[0];
      //   pageTitle = activeTab.title;
      // });

      chrome.extension.sendMessage({type : "like", userName : userName, userID : userID, id : id, liked : liked, picture : picture, pageTitle : pageTitle});
    }
  });
}); 

//Log out on click
if (document.getElementById("logoutButton")) {
  document.getElementById("logoutButton").addEventListener("click", logout);
}


$(document).on("click", "#notificationsBell", function(){

  chrome.storage.local.set({notifications : 0});

  $.post("http://pickle-server-183401.appspot.com/reset", {"id" : userID});

});

//Clicking on user names
$(document).on("click", ".userProfile", function(){
  var previousPage = $("#bottomNav .active").attr('id');
  chrome.storage.local.set({"previousPage" : previousPage, "previousUrl" : window.location.href});
  var profileID = $(this).attr("id");
  var profileName = $(this).text();
  // var profilePic = $(this).attr("id");
  chrome.extension.sendMessage({type : "loadUser", profileID : profileID, profileName : profileName});
  window.location.href = chrome.extension.getURL('userProfile.html');
});

//Clicking on group details
$(document).on("click", ".groupDetailsBtn", function(){
  var previousPage = $("#bottomNav .active").attr('id');
  var currentGroupName = $(".drawer .active").text();
  chrome.storage.local.set({"previousPage" : previousPage, "previousUrl" : window.location.href, "currentGroupName" : currentGroupName});
});

$(document).on("click", "#createGroupBtn", function(event){ 
  var name = $('#groupNameInput').val()
  console.log(name);
  var ids = [];
  var users = [];
  $('.form-check-input:checkbox:checked').get().forEach(function(element) {
      ids.push(element.id);
      users.push($(element).parent().text().trim());
    });
  console.log(ids);
  console.log(users);

  chrome.storage.local.get(['userID'], function(data) {

    $.post("http://localhost:5000/createGroup/", {"id" : data['userID'], "name" : name, "ids" : JSON.stringify(ids), "users" : JSON.stringify(users), 'direct' : ''}, function(groupID) {
      chrome.storage.local.set({"currentGroup" : groupID}, function () {
        
        $("body").load("http://localhost:5000/groupNames/ #groups", {"id" : data['userID'].toString()}, function () {
              chrome.storage.local.set({groupsHTML : $("#groups").html()});
              console.log(groupsHTML);
              window.location.replace("newsfeed.html");
          
            });
      });
    });
  });
});

$(document).on("click", "#createDirectBtn", function(event){ 
  
  var ids = [];
  var users = [];
  $('.form-check-input:radio:checked').get().forEach(function(element) {
      ids.push(element.id);
      users.push($(element).parent().text().trim());
    });
  console.log(ids);
  console.log(users);

  chrome.storage.local.get(['userID'], function(data) {

    $.post("http://localhost:5000/createGroup/", {"id" : data['userID'], "name" : '', "ids" : JSON.stringify(ids), "users" : JSON.stringify(users), 'direct' : 'direct'}, function(groupID) {
      chrome.storage.local.set({"currentGroup" : groupID}, function () {
        
        $("body").load("http://localhost:5000/groupNames/ #groups", {"id" : data['userID'].toString()}, function () {
              chrome.storage.local.set({groupsHTML : $("#groups").html()});
              console.log(groupsHTML);
              window.location.replace("newsfeed.html");
          
            });
      });
    });
  });
});

//Loading user profiles
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.type == "userLoaded") {
      if (window.location.href == chrome.extension.getURL('userProfile.html')) {
        $("#posts").hide(); 
        chrome.storage.local.get(['userPostsHTML'], function(result) {
        userPostsHTML = result['userPostsHTML'];
        if (userPostsHTML != null) {
              $("#posts").html(userPostsHTML);
              $("#posts .postDescription").each(function(){
                var htmlDescriptionUser = $(this).text();
                $(this).empty();
                $(this).html(htmlDescriptionUser);
              });
              $("#posts").show();
            } else {
              $("#posts").html(' ');
            }
        });
      }
    }
    // When user Yipps from the newsfeed, append yipp to newsfeed
    else if(request.type == "cardInfoReady"){

      chrome.storage.local.get(['pageTitle', 'pageImage', 'pageDescription'], function(result) {

        domain = request.url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];

        if (window.location.href == chrome.extension.getURL('newsfeed.html')) {
          $("#outgoingPosts").prepend('<div class="yippContainer" style="display:none; opacity:0;"></div>');
          $(".yippContainer").first().prepend('<div class="card cardNewsfeed mb-3"><p class="postDescription"><i class="fa fa-spinner fa-spin mr-2"></i>Yipping this page</p><div class="message d-flex flex-nowrap align-items-start"><div class="thumbnail"><img src='+picture+'></div><p class="chatBubble mb-0">'+request.value+'</p></div><div class="pageImg d-flex align-items-center"><a href='+request.url+' class="notificationTab"><img src='+result.pageImage+'></a></div><div style="padding: 1rem;"><a href='+request.url+' class="notificationTab pageTitle"><h1>'+result.pageTitle+'</h1></a><p class="pageDescription">'+result.pageDescription+'</p><p class="pageDomain">'+domain+'</p></div>');
          $(".yippContainer").first().slideToggle(function(){
            $(".yippContainer").first().animate({opacity: 1});
          });
          //Change styling of activeTab card
          $("#activePageCard").removeClass("inactive");
          $("#submitYipp").removeAttr("disabled");
        }

      });
    }

    //Refresh newfeed page when a new yipp is done posting
    else if(request.type == "yippPostedCurrent") {
      console.log("Current Yipp Posted!");
      if (window.location.href == chrome.extension.getURL('newsfeed.html')) {
        window.location.replace("newsfeed.html");
      }
    }
});

//Listen for incoming new comments or notifications
chrome.gcm.onMessage.addListener(function(payload) {

  if (payload.data.type == "notification") {

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

      appendComment(user, comment, profilePic, all);
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


// if loading the popup page, load data via the background page
if (window.location.href == chrome.extension.getURL('popup.html')) {
  $("#numNotifications").hide();
  connect("first");
}

// chrome.storage.local.remove(['outgoing-general', "outgoing-90281c92-b1de-4fd3-94bd-ab8b1de649eb"]);
//Load newsfeed posts
if (window.location.href == chrome.extension.getURL('newsfeed.html')) {
  $("#posts").hide();
  chrome.storage.local.get(['currentGroup'], function(result) {
  var group = result['currentGroup'];
  var outgoingGroup = "outgoing-" + group;

  if (group != null) { 
      chrome.storage.local.get([group, outgoingGroup], function(data) {
        postsHTML = data[group];
        $("#posts").append(postsHTML);
        $("#posts .postDescription").each(function(){
          var htmlDescriptionNewsfeed = $(this).text();
          $(this).empty();
          $(this).html(htmlDescriptionNewsfeed);
        });
        
        if (data[outgoingGroup]) {
          var outgoingPosts = data[outgoingGroup];
          for (var i = 0; i < outgoingPosts.length; i++ ) {
            $("#outgoingPosts").prepend(outgoingPosts[i]);
          }
        }

        $("#posts").show();
        console.log("loaded");

      });
      } else {
        $("#posts").html(' ');
        console.log("not loaded");
      }
      // $("#notificationsContainer .loadingSpinner").hide();
      // $("#notificationsContainer .cardList").show();

  });
  connect("first");
}

//Load profile posts
if (window.location.href == chrome.extension.getURL('account.html')) {
  
  $("#postsProfile").hide();

  //add any outgoing posts
  // chrome.storage.local.get(['currentGroup'], function(result) {
  //   var group = result['currentGroup'];
  //   var outgoingGroup = "outgoing-" + group;
  //   if (group != null) { 
  //     chrome.storage.local.get([outgoingGroup], function(data) {
  //       if (data[outgoingGroup]) {
  //         var outgoingPosts = data[outgoingGroup];
  //         for (var i = 0; i < outgoingPosts.length; i++ ) {
  //           $("#outgoingPosts").prepend(outgoingPosts[i]);
  //         }
  //       }
  //     });
  //   }
  // });

  chrome.storage.local.get(['profilePostsHTML'], function(result) {
  profilePostsHTML = result['profilePostsHTML'];
  if (profilePostsHTML != null) {
        $("#postsProfile").html(profilePostsHTML);
        $("#postsProfile .postDescription").each(function(){
          var htmlDescriptionProfile = $(this).text();
          $(this).empty();
          $(this).html(htmlDescriptionProfile);
        });
        $("#postsProfile").show();
      } else {
        $("#postsProfile").html(' ');
      }

  });

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

  });
  chrome.browserAction.setBadgeText({text: ""});
  chrome.storage.local.set({"notifications" : 0});
}


if (window.location.href == chrome.extension.getURL('groupDetails.html')) {
  chrome.storage.local.get(['currentGroup', 'groupInfo'], function(result) {
  var groupInfo = result['groupInfo'];
  if (groupInfo != null) { 
        $("#groupMembers").html(groupInfo[result['currentGroup']]);
      } else {
        $("#groupMembers").html(' ');
      }

  });
}

// populate account tab
if (window.location.href == chrome.extension.getURL('account.html')) {
  chrome.storage.local.get(['picture', 'userName'], function(result) {
  userName = result['userName'];
  picture = result['picture'];
  $(".accountName").append(userName);
  $("#accountProfilePicture").attr("src", picture);
});
}

//Populate createGroup page
if (window.location.href == chrome.extension.getURL("createGroup.html")) {
  chrome.storage.local.get(['friendsHTMLGroup'], function(result) {
    var friendsHTML = result.friendsHTMLGroup;
    $(".friendList").html(friendsHTML);
  });
}

if (window.location.href == chrome.extension.getURL("createDirect.html")) {
  chrome.storage.local.get(['friendsHTMLDirect'], function(result) {
    var friendsHTML = result.friendsHTMLDirect;
    $(".friendList").html(friendsHTML);
  });
}
// message listener for background communication
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.handshake == "login") {
      window.location.replace("newsfeed.html");
    } else if (request.handshake == "retry") {
      connect("first");
    }
  });

$(document).on("click", "#newsfeedNav", function(){
  chrome.extension.sendMessage({type : "popupNewsfeed"});
});

$(document).on("click", "#commentsNav", function(){
  chrome.extension.sendMessage({type : "popupComments"});
});

$(document).on("click", "#notificationsNav", function(){
  chrome.extension.sendMessage({type : "popupNotifications"});
});

$(document).on("click", "#accountNav", function(){
  chrome.extension.sendMessage({type : "popupAccount"});
});

$(document).on("click", "#notifications a, .cardNewsfeed a", function(){
  chrome.extension.sendMessage({type : "popupComments"});
});

$(document).on("click", "#confirmLeaveGroup", function(){
    chrome.storage.local.get(['currentGroup', 'userID'], function(result) {
      var id = result['userID'];
      $.post("http://localhost:5000/leaveGroup/", {"id" : id, "currentGroup" : result['currentGroup']}, function(data) {
        
        chrome.storage.local.set({"currentGroup" : "general"}, function () {
          $("body").load("http://localhost:5000/groupNames/ #groups", {"id" : id}, function () {
              chrome.storage.local.set({groupsHTML : $("#groups").html()});
              console.log(groupsHTML);
              window.location.replace("newsfeed.html");
          
            });
        });

        var json = JSON.stringify({ "data": {"type" : "leave"}, 
            "registration_ids": JSON.parse(data)['ids'] });
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


      });

    });
  });

function comment(e) {

  e.preventDefault();

  //Get string of comment submitted by user
  var value = $("#newComment").val(); 
  
  //Append new comment to html using javascript
  if (value) {

    //Get the following comment data
    ids = []; //Array of ids tagged in comment
    var tags; // String with ids tagged in comment
    var all; // Boolean for whether the comment is for all friends or not

    $('textarea.mention').mentionsInput('val', function(taggedIds) {
      if(jQuery.type(taggedIds)=="array"){
        console.log(taggedIds);
        ids = taggedIds;
        $(".mentions div").empty();
      }
    });

    chrome.storage.local.set({'tags': JSON.stringify(ids)});
    chrome.storage.local.set({'public' : true});
    all = true;

    //Get user name
    var user = userName.split(" ")[0];
    
    chrome.storage.local.get(['currentGroup'], function(result) {
      //Get current group
      var currentGroup = result['currentGroup'];
        //Send all comment data to background page
      chrome.storage.local.get(['tags', 'public'], function (result) {
        tags = result['tags'];
        all = result['public'];
        chrome.extension.sendMessage({type : "comment", userID : userID, url : url, value : value, tags : tags, all : all, 
        picture : picture, pageTitle : pageTitle, checked : true, currentGroup : currentGroup});
      });
    });

    //Append comment to current window
    appendComment(user, value, picture, all);
  }
}
  



function yippIt(e) {
  
  //Get string of comment submitted by user
  if (!$("#newComment").val()) {
    var value = "Yipp Yipp!"
  }
  else {
    var value = $("#newComment").val();
  } 

  //Get the following comment data
  var ids = [];
  var tags; // String with ids tagged in comment
  var all; // Boolean for whether the comment is for all friends or not

  $('textarea.mention').mentionsInput('val', function(taggedIds) {
       if(jQuery.type(taggedIds)=="array"){
        ids = taggedIds;
        $(".mentions div").empty();
      }
  });

  chrome.storage.local.set({'tags': JSON.stringify(ids)});
  chrome.storage.local.set({'public' : true});

  //Get user name
  var user = userName.split(" ")[0];
  //Get current group
  var currentGroup = $(".drawer .active").attr("id");

  //Send all comment data to background page
  chrome.storage.local.get(['tags', 'public'], function (result) {
    tags = result['tags'];
    all = result['public'];
    chrome.extension.sendMessage({type : "comment", userID : userID, url : url, value : value, tags : tags, all : all, 
      picture : picture, pageTitle : pageTitle, checked : true, currentGroup : currentGroup});
  });

  //Change styling of activeTab card
  $("#activePageCard").addClass("inactive");
  $("#submitYipp").prop("disabled", "true");

}

function logout(e) {
  
  e.preventDefault();

  chrome.storage.local.get(['session', 'userID', 'notificationsJSON'], function(response) {

    session = response['session'];
    userID = response['userID'];
    var notificationsJSON = response['notificationsJSON'];
  
    if (session) {

      $.post("http://localhost:5000/postNotificationsDict", {"id" : userID, "json" : JSON.stringify(notificationsJSON)});

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

//gather data from local storage after background processing 
function connect(message) {
  //Ask background if loading is done
  chrome.extension.sendMessage({"handshake" : message},function(response){
    
    //Get data from storage if background is done loading
    if (response.done) {
      chrome.storage.local.get(['commentsJSON', 'userName', 'userEmail', 'friendsArray', 'session', 'url', 'picture', 'notifications', 
        'notificationsHTML', 'friendsHTMLGroup', 'friendsHTMLDirect', 'userID', 'postsHTML', 'profilePostsHTML', 'groupsHTML', 'currentGroup', 'notificationsJSON'], function (result) {
        // console.log(result['commentsJSON']);
        var commentsJSON = result['commentsJSON'];
        userName = result['userName'];
        userEmail = result['userEmail'];
        friendsArray = result['friendsArray'];
        session = result['session'];
        url = result['url'];
        picture = result['picture'];
        notifications = result['notifications'];
        notificationsHTML = result['notificationsHTML'];
        friendsHTMLGroup = result['friendsHTMLGroup'];
        friendsHTMLDirect = result['friendsHTMLDirect']
        userID = result['userID'];
        postsHTML = result['postsHTML'];
        profilePostsHTML = result['profilePostsHTML'];
        groupsHTML = result['groupsHTML'];
        var currentGroup = result['currentGroup'];
        var notificationsJSON = result['notificationsJSON'];
      
    // if (groupsHTML != null) {
    //       // console.log(groupsHTML);
    //       $("#groupsHTML").html(groupsHTML);
          
    //       var group = $('#' + currentGroup);
    //       group.addClass("active");
    //       $(".groupTitle").text(group.text());
          
    //     } else {
    //       $("#groupsHTML").html('<div class="d-flex flex-row flex-nowrap justify-content-between"><small>GROUPS</small><a href="createGroup.html"><i class="far fa-plus-square"></i></a></div>');
    //     }


      if (commentsJSON != null) {
        $("#commentsBody").html(commentsJSON[currentGroup]);
      } else {
        
        $("#commentsBody").html(' ');
      }
      $(function () {
          $('[data-toggle="tooltip"]').tooltip()
                      })
      $(".loadingSpinner").hide();
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
        $("#notificationsContainer .loadingSpinner").hide();
        $("#notificationsContainer .cardList").show();
        
        // $("#posts").hide();
        // if (postsHTML != null) { 
        //   $("#posts").append(postsHTML);
        //   $("#posts .postDescription").each(function(){
        //     var htmlDescriptionNewsfeed = $(this).text();
        //     $(this).empty();
        //     $(this).html(htmlDescriptionNewsfeed);
        //   });
        //   $("#posts").show();
        // } else {
        //   $("#posts").html(' ');
        // }

        if (groupsHTML != null) {
          $(".groupsDrawer").html(groupsHTML);
          chrome.storage.local.get(['currentGroup'], function(data) {
            var group = $('#' + data['currentGroup']);
            group.addClass("active");
            $(".groupTitle").text(group.text());
          });
        }


        var total = 0;
        Object.keys(notificationsJSON).forEach(function(key) {
            var span = $("#" + key).find("span");
            total += notificationsJSON[key];
            if (notificationsJSON[key] == 0) {
              span.hide();
            } else {
              span.innerHTML = notificationsJSON[key];
              span.show();
            }
            console.log(span);
        });

        if (total == 0) {
          $("#general").find("span").hide();
        } else {
          $("#general").find("span").innerHTML = total;
          $("#general").find("span").show();
        }
        if (currentGroup == "general") {
          $(".fa-cog").hide();
        }
        
        
        // if (friendsHTML != null) {
        //   $("#friendListCheckboxes").html(friendsHTML);
        // } else {
        //   $("#friendListCheckboxes").html(' ');
        // }

        if (notifications == 0){
          $("#numNotifications").hide();
          chrome.browserAction.setBadgeText({text: ""});
        } else {
          if (document.getElementById("numNotifications")) {
            document.getElementById("numNotifications").innerHTML = notifications;
            $("#numNotifications").show();
            if (notifications != 0) {
            chrome.browserAction.setBadgeText({text: notifications.toString()});
          }
          }
        }

        var friendsData = [];
        for (i=0; i < result.friendsArray.length; i++){
          friendsData.push({ id:result.friendsArray[i][0], name:result.friendsArray[i][1], 'avatar':result.friendsArray[i][2], 'type':'contact' });
        }

        $('textarea.mention').mentionsInput({
          onDataRequest:function (mode, query, callback) {
            var data = friendsData;
            // var data = [
            //   { id:1, name:'Kenneth Auchenberg', 'avatar':'http://cdn0.4dots.com/i/customavatars/avatar7112_1.gif', 'type':'contact' },
            //   { id:2, name:'Jon Froda', 'avatar':'http://cdn0.4dots.com/i/customavatars/avatar7112_1.gif', 'type':'contact' },
            //   { id:3, name:'Anders Pollas', 'avatar':'http://cdn0.4dots.com/i/customavatars/avatar7112_1.gif', 'type':'contact' },
            //   { id:4, name:'Kasper Hulthin', 'avatar':'http://cdn0.4dots.com/i/customavatars/avatar7112_1.gif', 'type':'contact' },
            //   { id:5, name:'Andreas Haugstrup', 'avatar':'http://cdn0.4dots.com/i/customavatars/avatar7112_1.gif', 'type':'contact' },
            //   { id:6, name:'Pete Lacey', 'avatar':'http://cdn0.4dots.com/i/customavatars/avatar7112_1.gif', 'type':'contact' }
            // ];

            data = _.filter(data, function(item) { return item.name.toLowerCase().indexOf(query.toLowerCase()) > -1 });

            callback.call(this, data);
          }
        });

      });
    // If background is not done loading, keep asking
    } else {
      connect("message");
    }
    
  });

}

//Append html of new comment to body of existing comments
function appendComment(user, value, picture, all) {
  //create css class for private comments
  var css = "";
  var tagsIcon = "fa-tag";
  if (all !== true) {
    css = "private";
    tagsIcon = "fa-user-secret";
  }
  $("#commentsBody").append('<div class="commentGroup temporaryComment"><div class="d-flex flex-nowrap align-items-center"><div class="thumbnail align-self-start"><img src='+picture+'></div><div class="chatBubble '+css+'"><strong>'+user+'</strong> '+value+' </div><div class="likeButton"><a href="#"><i class="fa fa-heart"></i> 0</a></div></div><div class="commentDetails d-flex justify-content-start align-items-center"><small class="mb-0">Now</small></div></div>');
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

chrome.storage.local.get(["currentGroup"], function (data) {
  console.log(data['currentGroup']);
});

