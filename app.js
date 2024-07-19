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
  
  // Switch to Sign In form
  document.getElementById('showSignIn').addEventListener('click', function(event) {
	event.preventDefault();
	document.getElementById('sign-up-form').style.display = 'none';
	document.getElementById('sign-in-form').style.display = 'block';
  });
  
  // Switch to Sign Up form
  document.getElementById('showSignUp').addEventListener('click', function(event) {
	event.preventDefault();
	document.getElementById('sign-in-form').style.display = 'none';
	document.getElementById('sign-up-form').style.display = 'block';
  });
  
  // Sign Up
  document.getElementById('signUp').addEventListener('click', function() {
	const username = document.getElementById('signUpUsername').value;
	const email = document.getElementById('signUpEmail').value;
	const password = document.getElementById('signUpPassword').value;
	auth.createUserWithEmailAndPassword(email, password).then(userCredential => {
	  return db.ref('users/' + userCredential.user.uid).set({
		username: username,
		email: email,
		online: true
	  });
	}).catch(function(error) {
	  console.error(error.message);
	});
  });
  
  // Sign In
  document.getElementById('signIn').addEventListener('click', function() {
	const email = document.getElementById('signInEmail').value;
	const password = document.getElementById('signInPassword').value;
	auth.signInWithEmailAndPassword(email, password).catch(function(error) {
	  console.error(error.message);
	});
  });
  
  // Sign Out
  document.getElementById('signOut').addEventListener('click', function() {
	if (currentUser) {
	  db.ref('users/' + currentUser.uid).update({ online: false });
	}
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
		trackUserPresence(user.uid);
	  });
	} else {
	  document.getElementById('auth').style.display = 'block';
	  document.getElementById('chat').style.display = 'none';
	  document.getElementById('signOut').style.display = 'none';
	  currentUser = null;
	  currentUsername = null;
	}
  });
  
  // Track User Presence
  function trackUserPresence(userId) {
	const userRef = db.ref('users/' + userId);
	const presenceRef = db.ref('.info/connected');
  
	presenceRef.on('value', (snapshot) => {
	  if (snapshot.val() === true) {
		userRef.onDisconnect().update({ online: false });
		userRef.update({ online: true });
	  }
	});
  }
  
  // Load User List
  function loadUserList() {
	const userListDiv = document.getElementById('user-list');
	userListDiv.innerHTML = '';
  
	// Add group chat element
	const groupChatElement = document.createElement('div');
	groupChatElement.className = 'group-chat';
	groupChatElement.textContent = 'All of the Members';
	groupChatElement.addEventListener('click', function() {
	  openGroupChatRoom();
	});
	userListDiv.appendChild(groupChatElement);
  
	db.ref('users').on('value', function(snapshot) {
	  userListDiv.innerHTML = ''; // Clear the list before adding new elements
  
	  // Add group chat element again
	  userListDiv.appendChild(groupChatElement);
  
	  snapshot.forEach(function(childSnapshot) {
		const user = childSnapshot.val();
		if (user.email !== currentUser.email) { // Do not show the current user in the list
		  const userElement = document.createElement('div');
		  userElement.className = 'user';
		  userElement.textContent = user.username;
		  userElement.classList.add(user.online ? 'online' : 'offline');
		  userElement.addEventListener('click', function() {
			openChatRoom(childSnapshot.key, user.username);
		  });
		  userListDiv.appendChild(userElement);
		}
	  });
	});
  }
  
  // Open Group Chat Room
  function openGroupChatRoom() {
	currentChatRoom = 'group_chat';
	document.getElementById('chat-with').textContent = 'All of the Members';
	document.getElementById('chat-room').style.display = 'block';
	loadMessages(true); // true indicates group chat
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
	});
  });
  
  // Load Messages
  function loadMessages(isGroupChat = false) {
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
  
		// Add group message class if it's a group chat
		if (isGroupChat) {
		  messageElement.classList.add('group-message');
		}
  
		messagesDiv.appendChild(messageElement);
	  });
	});
  }
  
