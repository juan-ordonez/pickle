var userID;
var userName;
var userEmail;
var friendsArray;
var session;
var url;


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
      } else {
          userName = json.name;
          userEmail = json.email;
          friendsArray = json.friends;
          userID = json.id;
          chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {

              var activeTab = arrayOfTabs[0];
            url = activeTab.url;
          $("#commentsBody").load("http://pickle-server-183401.appspot.com/loadComment/ #comments", {"userID" : userID.toString(), "url" : url.toString()});
              });
      }


    });

  } else {
  console.log(window.location.href);
  if (window.location.href != "chrome-extension://cnnmgoelhbbpdgnppkoagfhndfochjlp/register.html") {
    window.location.replace("register.html");
      } 
    }

  });

}


if (window.location.href != "chrome-extension://cnnmgoelhbbpdgnppkoagfhndfochjlp/register.html") {
  getUserData();
}



$("#iframe").on("load", function() {
  var iframe = document.getElementById("iframe");
  iframe.parentNode.removeChild(iframe);
});










