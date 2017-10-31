importScripts("https://www.gstatic.com/firebasejs/4.6.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/4.6.0/firebase-messaging.js");


  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyCQLBWUcP9t0COcLfWn2V7l0zrqLhjO6WA",
    authDomain: "yipp-8e926.firebaseapp.com",
    databaseURL: "https://yipp-8e926.firebaseio.com",
    projectId: "yipp-8e926",
    storageBucket: "yipp-8e926.appspot.com",
    messagingSenderId: "205495597597"
  };
  firebase.initializeApp(config);




  const messaging = firebase.messaging();
  messaging.setBackgroundMessageHandler(function(payload) {
  	const title = 'Hello World';
  	const options = {
  		body : payload.data.status
  	}
  	return self.registration.showNotification(title, options);


  });

  