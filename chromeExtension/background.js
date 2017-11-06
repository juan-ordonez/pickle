var userID;
var userName;
var userEmail;
var friendsArray;
var session;
var url;
var picture;
var notifications;




chrome.gcm.onMessage.addListener(function(payload) {


  cookie = chrome.cookies.getAll({ url: "https://pickle-server-183401.appspot.com"}, function(data) {
    
  if (data.length >= 1) { 
    

    session = data[0].value

   
    
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




