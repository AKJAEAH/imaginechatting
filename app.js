// Firebase configuration
var firebaseConfig = {
	apiKey: "AIzaSyBetzlnVc8oEhzRkEaj1uebIXCFUgvbX68",
	authDomain: "chat-f3e79.firebaseapp.com",
	databaseURL: "https://chat-f3e79-default-rtdb.firebaseio.com",
	projectId: "chat-f3e79",
	storageBucket: "chat-f3e79.appspot.com",
	messagingSenderId: "897145782417",
	appId: "1:897145782417:web:ba6144ac95e3fa5d5ebf30"
  };
  firebase.initializeApp(firebaseConfig);
  
  const auth = firebase.auth();
  const db = firebase.database();
  
  let currentChatRoom = null;
  let currentUser = null;
  let currentUsername = null;
  
  // Sign Up
  document.getElementById('signUp').addEventListener('click', function() {
	const username = document.getElementById('username').value;
	const email = document.getElementById('email').value;
	const password = document.getElementById('password').value;
	auth.createUserWithEmailAndPassword(email, password).then(userCredential => {
	  return db.ref('users/' + userCredential.user.uid).set({
		username: username,
		email: email
	  });
	}).catch(function(error) {
	  console.error(error.message);
	});
  });
  
  // Sign In
  document.getElementById('signIn').addEventListener('click', function() {
	const email = document.getElementById('email').value;
	const password = document.getElementById('password').value;
	auth.signInWithEmailAndPassword(email, password).catch(function(error) {
	  console.error(error.message);
	});
  });
  
  // Sign Out
  document.getElementById('signOut').addEventListener('click', function() {
	auth.signOut();
  });
  
  // Authentication State Change
  auth.onAuthStateChanged(function(user) {
	if (user) {
	  document.getElementById('auth').style.display = 'none';
	  document.getElementById('chat').style.display = 'block';
	  document.getElementById('signOut').style.display = 'block';
	  currentUser = user;
	  db.ref('users/' + user.uid).once('value').then(snapshot => {
		currentUsername = snapshot.val().username;
		loadUserList();
	  });
	} else {
	  document.getElementById('auth').style.display = 'block';
	  document.getElementById('chat').style.display = 'none';
	  document.getElementById('signOut').style.display = 'none';
	  currentUser = null;
	  currentUsername = null;
	}
  });
  
  // Load User List
  function loadUserList() {
	const userListDiv = document.getElementById('user-list');
	userListDiv.innerHTML = '';
	db.ref('users').once('value', function(snapshot) {
	  snapshot.forEach(function(childSnapshot) {
		const user = childSnapshot.val();
		const userElement = document.createElement('div');
		userElement.textContent = user.username;
		userElement.addEventListener('click', function() {
		  openChatRoom(childSnapshot.key, user.username);
		});
		userListDiv.appendChild(userElement);
	  });
	});
  }
  
  // Open Chat Room
  function openChatRoom(otherUserId, otherUsername) {
	const chatRoomId = getChatRoomId(currentUser.uid, otherUserId);
	currentChatRoom = chatRoomId;
	document.getElementById('chat-with').textContent = 'Chat with ' + otherUsername;
	document.getElementById('chat-room').style.display = 'block';
	loadMessages();
  }
  
  // Get Chat Room ID
  function getChatRoomId(userId1, userId2) {
	return userId1 < userId2 ? userId1 + '_' + userId2 : userId2 + '_' + userId1;
  }
  
  // Send Message
  document.getElementById('send').addEventListener('click', function() {
	const message = document.getElementById('message').value;
	db.ref('messages/' + currentChatRoom).push({
	  uid: currentUser.uid,
	  username: currentUsername,
	  message,
	  createdAt: firebase.database.ServerValue.TIMESTAMP
	}).then(function() {
	  document.getElementById('message').value = '';
	}).catch(function(error) {
	  console.error(error.message);
	});
  });
  
  // Load Messages
  function loadMessages() {
	const messagesDiv = document.getElementById('messages');
	db.ref('messages/' + currentChatRoom).orderByChild('createdAt').on('value', function(snapshot) {
	  messagesDiv.innerHTML = '';
	  snapshot.forEach(function(childSnapshot) {
		const message = childSnapshot.val();
		const messageElement = document.createElement('div');
		messageElement.textContent = `${message.username}: ${message.message}`;
  
		// Check if the message is from the current user
		if (message.uid === currentUser.uid) {
		  messageElement.classList.add('my-message');
		} else {
		  messageElement.classList.add('other-message');
		}
  
		messagesDiv.appendChild(messageElement);
	  });
	});
  }
  