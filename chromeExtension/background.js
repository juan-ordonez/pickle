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
    title: "This is a notification", 
    message: "hello there!" 
    });
  }
  
})
