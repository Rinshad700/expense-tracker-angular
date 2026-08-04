// Get these values from Firebase Console > Project settings > General > Your apps > SDK setup and configuration.
// This config is safe to expose in frontend code — access to your data is controlled by Firestore
// security rules (see FIREBASE_SETUP.md), not by hiding this object.
export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSyDYGKatK_Xho4sEGjdFm5J1PMrCtDQqkGY',
    authDomain: 'expensive-59992.firebaseapp.com',
    projectId: 'expensive-59992',
    storageBucket: 'expensive-59992.firebasestorage.app',
    messagingSenderId: '1029174988133',
    appId: '1:1029174988133:web:c1f882ca283b5d8ea1a58c'
  }
};
