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
  // chrome.storage.local.set({'currentUrl': url});
  // console.log(url);

  //Populate active tab card in newsfeed
  if (window.location.href == chrome.extension.getURL("newsfeed.html")) {
    $("#activePageTitle").text(pageTitle.trimToLength(80));
    $("#activePageUrl").text(domain);
    $(document).on("click", "#viewComments", function(){
      window.location.href = chrome.extension.getURL('popup.html');
    });
  }

if (window.location.href == chrome.extension.getURL("newsfeed.html") || window.location.href == chrome.extension.getURL("popup.html")) {
  
  //Initialize textareas for comments
  chrome.storage.local.get(['friendsArray'], function (result) {
    var friendsData = [];
    for (i=0; i < result.friendsArray.length; i++){
      friendsData.push({ id:result.friendsArray[i][0], name:result.friendsArray[i][1], 'avatar':result.friendsArray[i][2], 'type':'contact' });
    }
    $('textarea.mention').mentionsInput({
      onDataRequest:function (mode, query, callback) {
        var data = friendsData;

        data = _.filter(data, function(item) { return item.name.toLowerCase().indexOf(query.toLowerCase()) > -1 });

        callback.call(this, data);

      }
    });

    chrome.storage.local.get(['messageBackup'], function(result) {
      $("#newComment").val(result['messageBackup'])
    });
  });

  //Populate drawer
  if ($("#groupsHTML")) {
    chrome.storage.local.get(['groupsHTML'], function (result) {
      var groupsHTML = result['groupsHTML']
      if (groupsHTML != null) {
        $(".groupsDrawer").html(groupsHTML);
        chrome.storage.local.get(['currentGroup'], function(data) {
          var $group = $('#' + data['currentGroup']);
          $group.addClass("active");
          $(".groupTitle").text($group.text());
          if (data['currentGroup'] == "general") {
            $(".fa-chevron-right").hide();
          }
          else if ($group.parent().hasClass("directDrawer")){
            $(".fa-chevron-right").hide();
            $("#directOptionsDropdown").show();
          }
        });

        //Get notification badges
        chrome.storage.local.get(['notificationsJSON', 'currentGroup'], function (result) {
          var notificationsJSON = result['notificationsJSON'];
          // delete notificationsJSON["3bd49e79-c546-4ead-9c9b-19c3c39d05ad"];
          // chrome.storage.local.set({notificationsJSON : notificationsJSON});
          var total = 0;
          Object.keys(notificationsJSON).forEach(function(key) {
              var span = $("#" + key).find("span");
              total += notificationsJSON[key];
              if (notificationsJSON[key] == 0) {
                span.hide();
              } else {
                span.text(notificationsJSON[key]);
                span.show();
              }
          });
          console.log(total);
          if (total == 0) {
            $("#general").find("span").hide();
          } else {
            $("#general span").text(total);
            console.log($("#general").text());
            $("#general span").show();
          }
        });
      }
    });
  }

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

//Update active group in chrome storage and clear group notifications
$(document).on("click", ".drawerLink", function(){
  var id = $(this)[0].id;
  chrome.storage.local.set({"currentGroup" : id}, function () {

  });
  chrome.storage.local.get(['notificationsJSON'], function(data) {
    var notifJSON = data['notificationsJSON'];
    notifJSON[id] = 0;
    chrome.storage.local.set({"notificationsJSON" : notifJSON});
    updateBadge(notifJSON);
  })
});

//Clicking on user names
// $(document).on("click", ".userProfile", function(){
//   var previousPage = $("#bottomNav .active").attr('id');
//   chrome.storage.local.set({"previousPage" : previousPage, "previousUrl" : window.location.href});
//   var profileID = $(this).attr("id");
//   var profileName = $(this).text();
//   // var profilePic = $(this).attr("id");
//   chrome.extension.sendMessage({type : "loadUser", profileID : profileID, profileName : profileName});
//   window.location.href = chrome.extension.getURL('userProfile.html');
// });

//Clicking on group details
$(document).on("click", ".groupDetailsBtn", function(){
  var previousPage = $("#bottomNav .active").attr('id');
  var currentGroupName = $(".drawer .active").text();
  chrome.storage.local.set({"previousPage" : previousPage, "previousUrl" : window.location.href, "currentGroupName" : currentGroupName});
});

//Ask background to create new group
$(document).on("click", "#createGroupBtn", function(event){ 
  
  $("#createGroupForm").hide();
  $(".loadingSpinner").show();

  var name = $('#groupNameInput').val()
  var ids = [];
  var users = [];
  $('.form-check-input:checkbox:checked').get().forEach(function(element) {
    ids.push(element.id);
    users.push($(element).parent().text().trim());
  });

  chrome.extension.sendMessage({type : "createGroup", groupName : name, ids : ids, users : users}, function(response){
    window.location.replace(response.newsfeed);
  });
});

//Ask background to add new members to existing group
$(document).on("click", "#addMembersBtn", function(event){ 
  
  $("#createGroupForm").hide();
  $(".loadingSpinner").show();

  var users = [];
  $('.form-check-input:checkbox:checked').get().forEach(function(element) {
      users.push(element.id);
  });

  chrome.storage.local.get(['currentGroup', 'currentGroupName'], function(data) {

    var groupName = data['currentGroupName'];
    console.log(groupName);
    chrome.extension.sendMessage({type : "addGroupMembers", groupID : data['currentGroup'], users : users, groupName : groupName}, function(response){
      window.location.replace(response.groupDetails);
    });

  });
});

if (window.location.href == chrome.extension.getURL("createDirect.html")) {
  
  $(document).on("change", ":radio", function(){
  
    $("#createDirectForm").hide();
    $(".loadingSpinner").show();

    var ids = [];
    var users = [];
    $('.form-check-input:radio:checked').get().forEach(function(element) {
        ids.push(element.id);
        users.push($(element).parent().text().trim());
      });
    console.log(ids);
    console.log(users);


  chrome.storage.local.get(['userID', 'userName'], function(data) {
    ids.push(data['userID']);
    users.push(data['userName']);


      console.log(ids);
      $.post("http://pickle-server-183401.appspot.com/createGroup/", {"id" : data['userID'], "name" : '', "ids" : JSON.stringify(ids), "users" : JSON.stringify(users), 'direct' : 'direct'}, function(groupID) {
        chrome.storage.local.set({"currentGroup" : groupID}, function () {
          
          $("body").load("http://pickle-server-183401.appspot.com/groupNames/ #groups", {"id" : data['userID'].toString()}, function () {
                chrome.storage.local.set({groupsHTML : $("#groups").html()});
                console.log(groupsHTML);
                window.location.replace("newsfeed.html");
            
              });
          $.post("http://pickle-server-183401.appspot.com/loadGroupData/", {"id" : data['userID']}, function (data) {
                    
                  chrome.storage.local.set({"groupInfo" : JSON.parse(data)});
                  console.log(JSON.parse(data));
                  
            });


        });
      });
    });
  });
}

//Loading user profiles
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {

    // When user Yipps from the newsfeed, append yipp to newsfeed
    if(request.type == "cardInfoReady"){

      chrome.storage.local.get(['pageTitle', 'pageImage', 'pageDescription'], function(result) {

        domain = request.url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];

        if (window.location.href == chrome.extension.getURL('newsfeed.html')) {
          $("#outgoingPosts").prepend('<div class="yippContainer" style="display:none; opacity:0;"></div>');
          $(".yippContainer").first().prepend('<div class="card cardNewsfeed mb-3"><p class="postDescription"><i class="fa fa-spinner fa-spin mr-2"></i>Yipping this page</p><div class="message d-flex flex-nowrap align-items-start"><div class="thumbnail"><img src='+picture+'></div><p class="chatBubble mb-0">'+request.value+'</p></div><div class="pageImg d-flex align-items-center"><a href='+request.url+' class="notificationTab"><img src='+result.pageImage+'></a></div><div style="padding: 1rem;"><a href='+request.url+' class="notificationTab pageTitle"><h1>'+result.pageTitle+'</h1></a><p class="pageDescription">'+result.pageDescription+'</p><p class="pageDomain">'+domain+'</p></div>');
          $(".yippContainer").first().slideToggle(function(){
            $(".yippContainer").first().animate({opacity: 1});
          });
          //Change styling of activeTab card
          $(".currentTabInfo, .activePageBtns").removeClass("inactive");
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

    else if(request.type == "commentError") {

      if (window.location.href == chrome.extension.getURL('newsfeed.html')) {
        $(".container").append('<div class="alert alert-danger alert-dismissible fade show animated bounceInUp" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><strong>Oh crap!</strong> That page failed to post. Please try submitting again.</div>');
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
  
  chrome.storage.local.set({"defaultPopup" : "newsfeed.html"});
  chrome.browserAction.setPopup({popup : "newsfeed.html"});

  $("#posts").hide();
  chrome.storage.local.get(['currentGroup'], function(result) {
  var group = result['currentGroup'];
  var outgoingGroup = "outgoing-" + group;

  if (group != null) { 
      chrome.storage.local.get([group, outgoingGroup], function(data) {
        
        if (data[group]) {
          postsHTML = data[group];
          $("#posts").append(postsHTML);
          $("#posts .postDescription").each(function(){
            var htmlDescriptionNewsfeed = $(this).text();
            $(this).empty();
            $(this).html(htmlDescriptionNewsfeed);
          });
        }

        else {
          $(".emptyGroupState").show();
        }
        
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

  //Show hamburger badge if new notifications
  chrome.storage.local.get(['notificationsJSON'], function(data) {
    var notificationsJSON = data['notificationsJSON'];
    var total = 0;
    Object.keys(notificationsJSON).forEach(function(key) {
      total += notificationsJSON[key];
    });
    if (total != 0) {
      $(".hamburgerBadge").show();
    }
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

  // chrome.storage.local.get(['profilePostsHTML'], function(result) {
  // profilePostsHTML = result['profilePostsHTML'];
  // if (profilePostsHTML != null) {
  //       $("#postsProfile").html(profilePostsHTML);
  //       $("#postsProfile .postDescription").each(function(){
  //         var htmlDescriptionProfile = $(this).text();
  //         $(this).empty();
  //         $(this).html(htmlDescriptionProfile);
  //       });
  //       $("#postsProfile").show();
  //     } else {
  //       $("#postsProfile").html(' ');
  //     }

  // });

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

$(document).on("click", ".deletePost", function(){
  var postID = $(this).parent().siblings("a")[0].id;
  console.log(postID);
  chrome.extension.sendMessage({type : "deletePost", postID : postID});
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
  chrome.storage.local.set({"notifications" : 0});
}


if (window.location.href == chrome.extension.getURL('groupDetails.html')) {
  chrome.storage.local.get(['currentGroup', 'groupInfo'], function(result) {
  var groupInfo = result['groupInfo'];
  var currentGroup = result['currentGroup'];
  if (groupInfo != null) { 
        $("#groupMembersList").html(groupInfo[currentGroup]);
      } else {
        $("#groupMembers").html(' ');
      }
  });
  $(document).on("click", "#removeUserBtn", function(){
    var userToRemoveID = $(this).parents(".groupMember").attr("id");
    var userToRemoveName = $(this).parents(".dropdownOptions").siblings(".groupMemberName").text();
    $("#removeUserModal .modal-title").prop("id" ,userToRemoveID);
    $("#removeUserModal .modal-title").text("Remove "+userToRemoveName+"?");
  });
}

// populate account tab
if (window.location.href == chrome.extension.getURL('settings.html')) {
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

if (window.location.href == chrome.extension.getURL("register.html")) {
  chrome.storage.local.get(['accessToken'], function(result) {
    var token = result.accessToken;
    if (token) {
      window.location.replace("newsfeed.html");
    }
  });
}

//Populate group info page
if (window.location.href == chrome.extension.getURL('groupDetails.html')) {
  chrome.storage.local.get(['picture'], function(result) {
  picture = result['picture'];
  $("#accountProfilePicture").attr("src", picture);
});
}

//Populate add members page
if (window.location.href == chrome.extension.getURL("addGroupMembers.html")) {
  chrome.storage.local.get(['currentGroup', 'addMembersHTML'], function(result) {
  
    var currentGroup = result['currentGroup'];
    var addGroupMembers = result['addMembersHTML'];
    console.log(addGroupMembers);

    $(".friendList").html(addGroupMembers[currentGroup]);

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

$(document).on("click", "#notifications a, .cardNewsfeed a", function(){
  chrome.storage.local.set({"defaultPopup" : "popup.html"});
  chrome.browserAction.setPopup({popup : "popup.html"});
});

$(document).on("click", "#confirmRemoveUser", function(){
    $(".fa-spinner").show();
  $(".modal-body a").addClass("disableClick");

  var removeID = $(this).closest(".modal-body").siblings(".modal-header").find(".modal-title")[0].id;
  chrome.storage.local.get(['currentGroup', 'userID', 'friendsArray'], function(result) {
    var currentGroup = result['currentGroup'];
    var userID = result['userID']
    var friendIds = result['friendsArray'].map(function(value,index) { return value[0]; });
    $.post("http://pickle-server-183401.appspot.com/leaveGroup/", {"id" : removeID, "currentGroup" : currentGroup}, function(data) {
      var l1 = $.Deferred(),
            l2 = $.Deferred();
      $.post("http://pickle-server-183401.appspot.com/loadGroupData/", {"id" : userID}, function (data) {
                    
                  chrome.storage.local.set({"groupInfo" : JSON.parse(data)});
                  l1.resolve();
                  
                  
            });
      $.post("http://pickle-server-183401.appspot.com/addMembersList/", {"id" : userID.toString(), "friends" : JSON.stringify(friendIds)}, function (data) {
            chrome.storage.local.set({"addMembersHTML" : JSON.parse(data)});
            l2.resolve();
          });
      $.when(l1, l2).done(function() {
        window.location.replace("groupDetails.html");
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

$(document).on("click", "#confirmLeaveGroup", function(){
    
  $(".fa-spinner").show();
  $(".modal-body a").addClass("disableClick");

  chrome.storage.local.get(['currentGroup', 'userID'], function(result) {
    var id = result['userID'];
    var currentGroup = result['currentGroup'];
      $.post("http://pickle-server-183401.appspot.com/leaveGroup/", {"id" : id, "currentGroup" : currentGroup}, function(data) {
        
        chrome.storage.local.get(['notificationsJSON'], function(data) {
          var notifJSON = data['notificationsJSON'];
          notifJSON[currentGroup] = 0;
          delete notifJSON[currentGroup];
          chrome.storage.local.set({"notificationsJSON" : notifJSON});
        })

        chrome.storage.local.set({"currentGroup" : "general"}, function () {
          $("body").load("http://pickle-server-183401.appspot.com/groupNames/ #groups", {"id" : id}, function () {
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
    
    chrome.storage.local.get(['currentGroup', 'userName'], function(result) {
      //Get current group
      var currentGroup = result['currentGroup'];
      var currentGroupName = $("#"+currentGroup).text();
      //Get user name
      var user = result['userName'].split(" ")[0];
      var picture = result['picture'];
      var userID = result['userID'];
      console.log(user);
      //Append comment to current window
      appendComment(user, value, picture, all);

        //Send all comment data to background page
      chrome.storage.local.get(['tags', 'public'], function (result) {
        tags = result['tags'];
        all = result['public'];
        chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
  
        var activeTab = arrayOfTabs[0];
        var url = activeTab.url;
        var pageTitle = activeTab.title;
        chrome.extension.sendMessage({type : "comment", userID : userID, url : url, value : value, tags : tags, all : all, 
        picture : picture, pageTitle : pageTitle, checked : true, currentGroup : currentGroup, currentGroupName: currentGroupName });

      });
      


      });
    });
  }

  $("#newComment").val("");
  chrome.storage.local.set({"messageBackup" : ""});

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

    //Send all comment data to background page
    chrome.storage.local.get(['tags', 'public', 'userName', 'currentGroup', 'picture', 'userID'], function (result) {

      var user = result['userName'];
      var currentGroup = result['currentGroup'];
      var currentGroupName = $("#"+currentGroup).text();
      var picture = result['picture'];
      var userID = result['userID'];
      tags = result['tags'];
      all = result['public'];
      chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
  
        var activeTab = arrayOfTabs[0];
        var url = activeTab.url;
        var pageTitle = activeTab.title;
      
      chrome.extension.sendMessage({type : "comment", userID : userID, url : url, value : value, tags : tags, all : all, 
        picture : picture, pageTitle : pageTitle, checked : true, currentGroup : currentGroup, currentGroupName: currentGroupName});
      console.log(currentGroup);
    });


    });

    $("#newComment").val("");

    chrome.storage.local.set({"messageBackup" : ""});

}

function logout(e) {
  
  $(".container").hide();
  $(".logoutSpinner").show();

  e.preventDefault();

  chrome.storage.local.get(['session', 'userID', 'notificationsJSON'], function(response) {

    session = response['session'];
    userID = response['userID'];
    var notificationsJSON = response['notificationsJSON'];
  
    if (session) {
      console.log(notificationsJSON);
      $.post("http://pickle-server-183401.appspot.com/postNotificationsDict/", {"id" : userID, "json" : JSON.stringify(notificationsJSON)});

      //Log user out
      $.get("https://pickle-server-183401.appspot.com/logout/" + session, function(data){
        chrome.browserAction.setPopup({popup : "register.html"});
        window.location.replace("register.html");
        });
      //Set icon to inactive state
      chrome.browserAction.setBadgeText({text: ""});
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
        'notificationsHTML', 'friendsHTMLGroup', 'friendsHTMLDirect', 'userID', 'postsHTML', 'groupsHTML', 'currentGroup', 'notificationsJSON'], function (result) {
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
        // profilePostsHTML = result['profilePostsHTML'];
        groupsHTML = result['groupsHTML'];
        var currentGroup = result['currentGroup'];
        var notificationsJSON = result['notificationsJSON'];

        chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {

          var activeTab = arrayOfTabs[0];

          $.post("https://pickle-server-183401.appspot.com/canonicalize/", {"url" : activeTab.url}, function(newUrl) {
              if (newUrl == url && commentsJSON != null) {
                $("#commentsBody").html(commentsJSON[currentGroup]);
                $(".loadingSpinner").hide();
                scrollable($("#commentsBody"));
                //Convert all urls into links
                $('p').linkify();
                $("body").linkify({
                  target: "_blank"
                });

              } else {
                $.post("http://pickle-server-183401.appspot.com/loadComment/", {"userID" : userID.toString(), "url" : newUrl.toString()}, function (json) {
                  var groupsComments = JSON.parse(json);
                  chrome.storage.local.set({commentsJSON : groupsComments}, function() {
                    $("#commentsBody").html(groupsComments[currentGroup]);
                    $(".loadingSpinner").hide();
                    scrollable($("#commentsBody"));
                    //Convert all urls into links
                    $('p').linkify();
                    $("body").linkify({
                      target: "_blank"
                    });
                  });
                });
              }

          });

        });

        if (notificationsHTML != null) { 
          $("#notifications").html(notificationsHTML);
        } else {
          $("#notifications").html(' ');
        }
        $("#notificationsContainer .loadingSpinner").hide();
        $("#notificationsContainer .cardList").show();

        if (notifications == 0){
          $("#numNotifications").hide();
        } else {
          if (document.getElementById("numNotifications")) {
            document.getElementById("numNotifications").innerHTML = notifications;
            $("#numNotifications").show();
            if (notifications != 0) {
          }
          }
        }

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
  if (container.height() > 404) {
    container.removeClass("commentsNoScroll");
    container.addClass("commentsScroll");
    container.parent().scrollTop(container.parent()[0].scrollHeight);
  }
}

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