importScripts("https://www.gstatic.com/firebasejs/4.6.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/4.6.0/firebase-messaging.js");

var config = {
    apiKey: "AIzaSyDtXvstodfhqPPYZJGqi8qFOZPmLWnmxCg",
    authDomain: "https://yipp-4924d.firebaseapp.com",
    databaseURL: "https://yipp-4924d.firebaseio.com",
    projectId: "yipp-4924d",
    storageBucket: "yipp-4924d.appspot.com",
    messagingSenderId: "511642730215"
  };
  firebase.initializeApp(config);



  const messaging = firebase.messaging();

  