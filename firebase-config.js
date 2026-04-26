import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import { getAuth }       from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
import { getFirestore }  from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

// TODO: Firebase Console → Project settings → Your apps → Add app → Web
// Скопируй appId из полученного конфига и вставь сюда
const firebaseConfig = {
  apiKey:            'AIzaSyCH912VOR00o3YtOiYacjvps7NqO3yo8sY',
  authDomain:        'metrotime-92d47.firebaseapp.com',
  databaseURL:       'https://metrotime-92d47-default-rtdb.europe-west1.firebasedatabase.app',
  projectId:         'metrotime-92d47',
  storageBucket:     'metrotime-92d47.firebasestorage.app',
  messagingSenderId: '445552776060',
  appId:             '1:445552776060:web:5ed9c2cdf205e5fb908af9',
  measurementId:     'G-N20S7PJFZW',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
