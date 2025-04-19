// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: "AIzaSyBeFt7lskoJzjT9n-Ibo8uiBZbhrULtewE",
	authDomain: "smartbook-de407.firebaseapp.com",
	projectId: "smartbook-de407",
	storageBucket: "smartbook-de407.firebasestorage.app",
	messagingSenderId: "621144898336",
	appId: "1:621144898336:web:2cb0e0d1c4d891ae39b545",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
