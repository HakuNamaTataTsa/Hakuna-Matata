// ============================================================
// firebase-init.js
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyD4sgRYUhk08Y4oZPR4GXJbSuX1fHjXBtg",
  authDomain: "akinowedding-73271.firebaseapp.com",
  projectId: "akinowedding-73271",
  storageBucket: "akinowedding-73271.appspot.com",
  messagingSenderId: "307666594440",
  appId: "1:307666594440:web:e7d3496744464f4c6d0d3d"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const CLOUDINARY_CLOUD_NAME = 'qdbqjpcw';
const CLOUDINARY_API_KEY = '778937647787552';
const CLOUDINARY_UPLOAD_PRESET = 'manga1234';

// ============================================================
// AUTH
// ============================================================
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

async function loginWithEmail(email, password) {
  const userCredential = await auth.signInWithEmailAndPassword(email, password);
  return userCredential.user;
}

async function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  const userCredential = await auth.signInWithPopup(provider);
  const user = userCredential.user;
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

async function logoutUser() {
  await auth.signOut();
}

function getCurrentUser() {
  return auth.currentUser;
}

// ============================================================
// FIRESTORE (Profil & Bookmark)
// ============================================================
async function getUserProfile(uid) {
  const doc = await db.collection('users').doc(uid).get();
  if (doc.exists) return { id: doc.id, ...doc.data() };
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
      await db.collection('users').doc(uid).update({ bookmarks });
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
// 🔥 READING HISTORY (FIX)
// ============================================================

/**
 * Simpan riwayat baca
 */
async function saveReadingHistory(uid, data) {
  const { mangaId, mangaTitle, coverUrl, chapterId, chapterNum } = data;
  if (!uid || !mangaId) {
    console.warn('saveReadingHistory: uid atau mangaId kosong');
    return;
  }
  try {
    await db.collection('users').doc(uid).collection('readingHistory').doc(mangaId).set({
      mangaId: mangaId,
      mangaTitle: mangaTitle || 'Untitled',
      coverUrl: coverUrl || '',
      lastChapterId: chapterId || '',
      lastChapterNum: String(chapterNum || '0'),
      lastReadAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log('✅ History saved for', mangaId);
  } catch (e) {
    console.error('❌ Save history error:', e);
  }
}

/**
 * Ambil riwayat baca (terurut dari terbaru)
 */
async function getReadingHistory(uid) {
  if (!uid) return [];
  try {
    const snapshot = await db.collection('users').doc(uid).collection('readingHistory')
      .orderBy('lastReadAt', 'desc')
      .limit(50)
      .get();
    const history = [];
    snapshot.forEach(doc => {
      history.push({ id: doc.id, ...doc.data() });
    });
    console.log('📖 History loaded:', history.length);
    return history;
  } catch (e) {
    console.error('❌ Get history error:', e);
    if (e.code === 'failed-precondition') {
      console.warn('⚠️ Mungkin perlu membuat index di Firestore. Cek link di console.');
    }
    return [];
  }
}

/**
 * Ambil riwayat baca dalam bentuk Map (mangaId -> { lastChapterNum, lastReadAt })
 */
async function getReadingHistoryMap(uid) {
  const history = await getReadingHistory(uid);
  const map = {};
  history.forEach(item => {
    map[item.mangaId] = {
      lastChapterNum: item.lastChapterNum || '0',
      lastReadAt: item.lastReadAt
    };
  });
  return map;
}

// ============================================================
// CLOUDINARY
// ============================================================
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('api_key', CLOUDINARY_API_KEY);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Upload gagal');
  }

  const data = await response.json();
  return data.secure_url;
}

// ============================================================
// SESSION
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