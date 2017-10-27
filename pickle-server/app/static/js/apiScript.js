
var userID;
var userName;
var userEmail;
var friendsArray;


window.fbAsyncInit = function() {
    FB.init({
      appId      : '1430922756976623',
      xfbml      : true,
      version    : 'v2.10',
      cookie     : true
    });

    FB.getLoginStatus(function(response) {
      var currentUrl = window.location.href;
    if (response.status == 'connected') {
      console.log('Logged in and authenticated');
      console.log(response)
      FB.api('/me', {access_token: response.accessToken, fields: ['email', 'friends', 'name']}, function(api) {
        userID = api.id;
        userName = api.name;
        userEmail = api.email;
        friendsArray = api.friends.data;
        console.log(api)

        $.post('https://pickle-server-183401.appspot.com' + '/register/', {"json" : JSON.stringify({"status" : true, "id" : userID, "name" : userName, "email" : userEmail, "friends" : friendsArray})});
        // $("body").append('<p>' + JSON.stringify({"status" : true, "id" : userID, "name" : userName, "email" : userEmail, "friends" : friendsArray}) + '</p>');
        
      }); 
    } else {
      $.post('https://pickle-server-183401.appspot.com' + '/register/', {"json" : JSON.stringify({"status" : false, "id" : userID, "name" : userName, "email" : userEmail, "friends" : friendsArray})});



    }
});
  

  };

  (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "https://connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));


  









if (document.getElementById("submitComment")) {
  document.getElementById("submitComment").addEventListener("click", comment);
}

function comment(e) {
  e.preventDefault();
  value = $("#newComment").val();
  console.log(friendsArray);
  $.post('https://pickle-server-183401.appspot.com' + '/comment/', {"userId" : userID, "url" : "http://test.com", "string" : value, "tags" : JSON.stringify(friendsArray)});

}


// function checkLoginState() {
//   FB.getLoginStatus(function(response) {
//     if (response.status == 'connected') {
//       console.log(response)
//       console.log('Logged in and authenticated');
//       window.location.replace("http://localhost:8000/popup.html");
      

//     }
//   });
// }





  //get tab url
//   chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
//     console.log(tabs[0].url);
// });
