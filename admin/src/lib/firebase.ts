import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyC9xt2TclymW1iUXInOmJQ4by_IR9sarZY',
  authDomain: 'blorbify-badfc.firebaseapp.com',
  projectId: 'blorbify-badfc',
  storageBucket: 'blorbify-badfc.firebasestorage.app',
  messagingSenderId: '719239512084',
  appId: '1:719239512084:web:8254af9126933fad4c6701',
  measurementId: 'G-D61S4HFMWD',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

export { app, auth }
