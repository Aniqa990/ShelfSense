// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getFirestore} from "firebase/firestore"
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD8YXzOjZmToAyrxMubT-YXZZbandZCgaQ",
  authDomain: "pantry-app-dd272.firebaseapp.com",
  projectId: "pantry-app-dd272",
  storageBucket: "pantry-app-dd272.appspot.com",
  messagingSenderId: "308481987525",
  appId: "1:308481987525:web:c73e7c4d567711123b71ac",
  measurementId: "G-KJWFRR2WGE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const analytics = getAnalytics(app);
const storage = getStorage(app);
export {firestore, storage};