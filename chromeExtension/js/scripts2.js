
var userID;
var userName;
var userEmail;
var friendsArray;
var session;

// window.fbAsyncInit = function() {
//     FB.init({
//       appId      : '1430922756976623',
//       xfbml      : true,
//       version    : 'v2.10'
//     });
//     FB.getLoginStatus(function(response) {
//     statusChangeCallback(response);
// });
//   };

//   (function(d, s, id){
//      var js, fjs = d.getElementsByTagName(s)[0];
//      if (d.getElementById(id)) {return;}
//      js = d.createElement(s); js.id = id;
//      js.src = "https://connect.facebook.net/en_US/sdk.js";
//      fjs.parentNode.insertBefore(js, fjs);
//    }(document, 'script', 'facebook-jssdk'));


//   FB.login(function(response) {
//   // handle the response
//     var currentUrl = window.location.href;
//     if (response.status == 'connected') {
//       console.log('Logged in and authenticated');
//       console.log(response)
//       FB.api('/me', {access_token: response.accessToken, fields: ['email', 'friends', 'name']}, function(api) {
//         userID = api.id;
//         userName = api.name;
//         userEmail = api.email;
//         console.log(api)
//         if (api.friends) {
//           friendsArray = api.friends.data
//       }
//       else {
//         friendsArray = []
//       }
//         $.post('http://localhost:4000' + '/register/', {"id" : userID, "name" : userName, "email" : userEmail});
      
//       });


      

//     } else if (!(currentUrl == 'http://localhost:8000/register.html')){
//       window.location.replace("http://localhost:8000/register.html");
//       console.log('Not logged in');
//       console.log(response)
//     } else {
//       console.log('Not logged in');
//       console.log(response)
//     }

//   }, {scope: 'public_profile,email,user_friends'});




if (document.getElementById("logoutButton")) {
  document.getElementById("logoutButton").addEventListener("click", logout);
}

function logout(e) {
  
  e.preventDefault();
  if (session) {
    $.get("https://pickle-server-183401.appspot.com/logout/" + session, function(data){

      getUserData();
    });
  }

  }


if (document.getElementById("submitComment")) {
  document.getElementById("submitComment").addEventListener("click", comment);
}

function comment(e) {

  e.preventDefault();
  var value = $("#newComment").val();
  chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {

     var activeTab = arrayOfTabs[0];
     var url = activeTab.url;
     
    
    console.log(url);
    console.log(friendsArray);
    console.log(userID);
    console.log(value);
    var html = $.get("http://pickle-server-183401.appspot.com/loadComment/", {"userID" : userID.toString(), "url" : url.toString()});
    console.log(html);
    $.post('http://pickle-server-183401.appspot.com' + '/comment/', {"userId" : userID, "url" : url.toString(), "string" : value, "tags" : JSON.stringify(friendsArray)});
    
  });
  
  

  

}


if (document.getElementById("loginButton")) {
  document.getElementById("loginButton").addEventListener("click", login);
}

function login(e) {
  // var loginWindow = window.open("http://localhost:4000/connect/", "myWindowName", "toolbar = 0, scrollbars = 1, statusbar = 0, menubar = 0, resizable = 0, height = 1, width = 1");
  e.preventDefault();
 

  
  window.open("https://pickle-server-183401.appspot.com/login/");
  window.location.replace("popup.html");
  console.log('test');
  getUserData();
  

  // userName = $.get("http://localhost:4000/user/" + session)
  // console.log(userName)


}


function getUserData() {
  

  cookie = chrome.cookies.getAll({ url: "https://pickle-server-183401.appspot.com"}, function(data) {
    
  if (data.length >= 1) { 
    if (window.location.href == "chrome-extension://cnnmgoelhbbpdgnppkoagfhndfochjlp/register.html") {
      return
    }

    session = data[0].value
    
    $.get("https://pickle-server-183401.appspot.com/user/" + session, function(data){
      console.log(data);
      json = JSON.parse(data);
      if (json.status == false) {
        window.location.replace("register.html");
      } else if (json.updated == false) {
        var iframe;

        iframe = document.createElement('iframe');
        iframe.id = "iframe"
        iframe.src = "https://pickle-server-183401.appspot.com/connect/";
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        getUserData();


      }
        else {
          userName = json.name;
          userEmail = json.email;
          friendsArray = json.friends;
          userID = json.id;

      }


    });

  }  else {
  console.log(window.location.href);
  if (window.location.href != "chrome-extension://cnnmgoelhbbpdgnppkoagfhndfochjlp/register.html") {
    window.location.replace("register.html");
  } }

}

  );

}


if (window.location.href != "chrome-extension://cnnmgoelhbbpdgnppkoagfhndfochjlp/register.html") {
  

  getUserData();
}



$("#iframe").on("load", function() {

  var iframe = document.getElementById("iframe");
  iframe.parentNode.removeChild(iframe);

});





// function loadComments() {
//   $.load()
// }




// } else {
//   getUserData();




// if (window.location.href != "register.html") {
//   getUserData();
// }

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



