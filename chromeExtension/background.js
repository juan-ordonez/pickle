var url;
var userID;
chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {

     var activeTab = arrayOfTabs[0];
     url = activeTab.url;
 });

chrome.storage.local.get('id', function (result) {
        userID = result.id;
        console.log(userID);
    });
chrome.gcm.onMessage.addListener(function(payload) {
  console.log(payload.data);
  
  
  var profilePic = payload.data.pic;
  var user = payload.data.first;
  var comment = payload.data.comment;
  var commentUrl = payload.data.url;
  var notification = payload.data.status;

  var views = chrome.extension.getViews({type : "popup"});
  console.log(views.length);
  if (views.length == 0) {
  	chrome.notifications.create({   
    type: 'basic', 
    iconUrl: 'icon.png', 
    title: "Yipp", 
    message: user+' '+notification 
    }, function (notif) {
    	dict = {};
    	dict[notif] = commentUrl;
    	console.log(notif);
    	chrome.storage.local.set(dict);
    });
    $.post("http://pickle-server-183401.appspot.com/notification/", {"picture" : profilePic, "user" : user, "notification" : notification, "id" : userID, "url" : commentUrl});
  }
  
})


chrome.notifications.onClicked.addListener(function (id) {

	chrome.storage.local.get(id, function (result) {
        var redirect = result;
        var link = redirect[Object.keys(redirect)[0]];

        chrome.tabs.create({'url': link}, function(tab) {
    			// Tab opened.
 			 });
        
    });



});




