window.fbAsyncInit = function() {
    FB.init({
      appId      : '1430922756976623',
      xfbml      : true,
      version    : 'v2.10'
    });
    FB.getLoginStatus(function(response) {
    statusChangeCallback(response);
});
  };

  (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "https://connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));

  function statusChangeCallback(response) {
    var currentUrl = window.location.href;
    if (response.status == 'connected') {
      console.log('Logged in and authenticated');
      FB.api('/me', {fields: ['email', 'friends', 'name']}, function(api) {
        var userID = api.id;
        var userName = api.name;
        var userEmail = api.email;
        var friendsArray = api.friends.data
        $.post('http://localhost:4000' + '/register/', {"id" : userID});
      
      });


      

    } else if (!(currentUrl == 'http://localhost:8000/register.html')){
      window.location.replace("http://localhost:8000/register.html");
      console.log('Not logged in');
      console.log(response)
    } else {
      console.log('Not logged in');
      console.log(response)
    }

  }




if (document.getElementById("logoutButton")) {
  document.getElementById("logoutButton").addEventListener("click", logout);
}

function logout() {

  console.log(window.location.href);

  FB.logout(function(response) {
  // Person is now logged out
  });

 window.location.replace("http://localhost:8000/register.html");

  }


if (document.getElementById("submitComment")) {
  document.getElementById("submitComment").addEventListener("click", comment);
}

function comment() {
  value = $("#newComment").val();
  console.log(value)


}


function checkLoginState() {
  FB.getLoginStatus(function(response) {
    if (response.status == 'connected') {
      console.log(response)
      console.log('Logged in and authenticated');
      window.location.replace("http://localhost:8000/popup.html");
      

    }
  });
}


  //get tab url
//   chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
//     console.log(tabs[0].url);
// });



