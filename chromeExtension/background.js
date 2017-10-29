// Initialize Firebase
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

function request() {
messaging.requestPermission()
  .then(function() {
    console.log('got a token, sweet');
    messaging.getToken()
  .then(function(currentToken) {
    if (currentToken) {
      console.log(currentToken);
    } else {
      // Show permission request.
      console.log('No Instance ID token available. Request permission to generate one.');
      request();
    }
  })
  .catch(function(err) {
    console.log('An error occurred while retrieving token. ', err);
  });
})
.then(function(token) {
    console.log(token);
  })

  .catch(function(err) {
    console.log("error");
  })
}

request();

// messaging.getToken()
//   .then(function(currentToken) {
//     if (currentToken) {
//       console.log(currentToken);
//       sendTokenToServer(currentToken);
//       updateUIForPushEnabled(currentToken);
//     } else {
//       // Show permission request.
//       console.log('No Instance ID token available. Request permission to generate one.');
//       // Show permission UI.
//       updateUIForPushPermissionRequired();
//       setTokenSentToServer(false);
//     }
//   })
//   .catch(function(err) {
//     console.log('An error occurred while retrieving token. ', err);
//     showToken('Error retrieving Instance ID token. ', err);
//     setTokenSentToServer(false);
//   });


