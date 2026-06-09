import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "ここに apiKey",
  authDomain: "ここに authDomain",
  projectId: "ここに projectId",
  storageBucket: "ここに storageBucket",
  messagingSenderId: "ここに messagingSenderId",
  appId: "ここに appId"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
