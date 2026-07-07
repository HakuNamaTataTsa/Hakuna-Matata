// ============================================================
// firebase-init.js
// ============================================================

// 🔥 KONFIGURASI FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyD4sgRYUhk08Y4oZPR4GXJbSuX1fHjXBtg",
  authDomain: "akinowedding-73271.firebaseapp.com",
  projectId: "akinowedding-73271",
  storageBucket: "akinowedding-73271.appspot.com",
  messagingSenderId: "307666594440",
  appId: "1:307666594440:web:e7d3496744464f4c6d0d3d"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 🔥 KONFIGURASI CLOUDINARY
// CLOUD_NAME: cek di https://cloudinary.com/console (contoh: "demos", "mycloud123")
const CLOUDINARY_CLOUD_NAME = 'qdbqjpcw'; // ⚠️ GANTI DENGAN CLOUD NAME KAMU
const CLOUDINARY_API_KEY = '778937647787552';
const CLOUDINARY_UPLOAD_PRESET = 'manga1234';

// ============================================================
// FUNGSI AUTHENTICATION
// ============================================================

// Registrasi user baru
async function registerWithEmail(email, password, name) {
  const userCredential = await auth.createUserWithEmailAndPassword(email, password);
  const user = userCredential.user;
  
  await db.collection('users').doc(user.uid).set({
    name: name,
    email: email,
    photoURL: '',
    bookmarks: [],
    createdAt: new Date().toISOString()
  });
  
  return user;
}

// Login dengan email & password
async function loginWithEmail(email, password) {
  const userCredential = await auth.signInWithEmailAndPassword(email, password);
  return userCredential.user;
}

// Login dengan Google
async function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  const userCredential = await auth.signInWithPopup(provider);
  const user = userCredential.user;
  
  // Cek apakah user sudah ada di Firestore, jika belum buat
  const doc = await db.collection('users').doc(user.uid).get();
  if (!doc.exists) {
    await db.collection('users').doc(user.uid).set({
      name: user.displayName || '',
      email: user.email,
      photoURL: user.photoURL || '',
      bookmarks: [],
      createdAt: new Date().toISOString()
    });
  }
  
  return user;
}

// Logout
async function logoutUser() {
  await auth.signOut();
}

// Ambil user saat ini
function getCurrentUser() {
  return auth.currentUser;
}

// ============================================================
// FUNGSI FIRESTORE (Profil & Bookmark)
// ============================================================

async function getUserProfile(uid) {
  const doc = await db.collection('users').doc(uid).get();
  if (doc.exists) {
    return { id: doc.id, ...doc.data() };
  }
  return null;
}

async function updateUserProfile(uid, data) {
  await db.collection('users').doc(uid).update(data);
}

async function addBookmark(uid, mangaId) {
  const doc = await db.collection('users').doc(uid).get();
  if (doc.exists) {
    const bookmarks = doc.data().bookmarks || [];
    if (!bookmarks.includes(mangaId)) {
      bookmarks.push(mangaId);
      await db.collection('users').doc(uid).update({ bookmarks: bookmarks });
    }
  }
}

async function removeBookmark(uid, mangaId) {
  const doc = await db.collection('users').doc(uid).get();
  if (doc.exists) {
    const bookmarks = doc.data().bookmarks || [];
    const updated = bookmarks.filter(b => b !== mangaId);
    await db.collection('users').doc(uid).update({ bookmarks: updated });
  }
}

// ============================================================
// FUNGSI CLOUDINARY (Upload foto profil)
// ============================================================

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('api_key', CLOUDINARY_API_KEY);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Upload gagal');
  }

  const data = await response.json();
  return data.secure_url;
}

// ============================================================
// SESSION (localStorage)
// ============================================================

function saveSession(user) {
  localStorage.setItem('currentUser', JSON.stringify({
    uid: user.uid,
    email: user.email
  }));
}

function getSession() {
  const data = localStorage.getItem('currentUser');
  return data ? JSON.parse(data) : null;
}

function clearSession() {
  localStorage.removeItem('currentUser');
}