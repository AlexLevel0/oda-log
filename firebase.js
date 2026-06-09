import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDxc8VvDQXfAJVwdeGyKJ04sEyQxS4BKQU",
  authDomain: "oda-log.firebaseapp.com",
  projectId: "oda-log",
  storageBucket: "oda-log.firebasestorage.app",
  messagingSenderId: "236113315684",
  appId: "1:236113315684:web:3ce6be3619cf1b6d4e1c71"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
