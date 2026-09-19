import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getAnalytics
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCxwFOMVwYEd3tlQgEKxKH6-YhniyOSzfE",
  authDomain: "elmotawahash-store.firebaseapp.com",
  projectId: "elmotawahash-store",
  storageBucket: "elmotawahash-store.firebasestorage.app",
  messagingSenderId: "89683115331",
  appId: "1:89683115331:web:90706417dd48dd69ff03f6",
  measurementId: "G-SC056HHZ3R"
};

const app=initializeApp(firebaseConfig);

try{
  getAnalytics(app);
}catch(e){}

export const auth=getAuth(app);
export const db=getFirestore(app);
export const storage=getStorage(app);

export const googleProvider=new GoogleAuthProvider();

export async function loginGoogle(){
  return signInWithPopup(auth,googleProvider);
}

export async function logout(){
  return signOut(auth);
}

export function watchAuth(cb){
  return onAuthStateChanged(auth,cb);
}

export async function addProduct(
  name,
  price,
  image,
  description
){
  return addDoc(
    collection(db,"products"),
    {
      name,
      price:Number(price),
      image:image||"",
      description:description||"",
      active:true,
      createdAt:serverTimestamp()
    }
  );
}

export async function getProducts(){
  const snap=await getDocs(
    query(
      collection(db,"products"),
      orderBy("createdAt","desc")
    )
  );

  return snap.docs.map(
    d=>({
      id:d.id,
      ...d.data()
    })
  );
}

export async function ensureUser(user){
  const r=doc(db,"users",user.uid);
  const s=await getDoc(r);

  if(!s.exists()){
    await setDoc(r,{
      uid:user.uid,
      email:user.email,
      name:user.displayName||"",
      photo:user.photoURL||"",
      verified:false,
      banned:false,
      createdAt:serverTimestamp()
    });
  }

  return (await getDoc(r)).data();
}

export async function getMyOrders(uid){
  const snap=await getDocs(
    query(
      collection(db,"orders"),
      where("uid","==",uid)
    )
  );

  return snap.docs.map(
    d=>({
      id:d.id,
      ...d.data()
    })
  );
}

export async function uploadProof(file,uid){
  const r=ref(
    storage,
    `payment-proofs/${uid}/${Date.now()}-${file.name}`
  );

  await uploadBytes(r,file);

  return getDownloadURL(r);
}

export async function createOrder(data){
  return addDoc(
    collection(db,"orders"),
    {
      ...data,
      status:"pending",
      paymentStatus:"pending",
      createdAt:serverTimestamp()
    }
  );
}

export async function getUsers(){
  const s=await getDocs(
    collection(db,"users")
  );

  return s.docs.map(
    d=>({
      id:d.id,
      ...d.data()
    })
  );
}

export async function getOrders(){
  const s=await getDocs(
    collection(db,"orders")
  );

  return s.docs.map(
    d=>({
      id:d.id,
      ...d.data()
    })
  );
}

export async function updateUser(uid,data){
  return updateDoc(
    doc(db,"users",uid),
    data
  );
}

export async function updateOrder(id,data){
  return updateDoc(
    doc(db,"orders",id),
    data
  );
}

export async function getSettings(){
  const s=await getDoc(
    doc(db,"settings","main")
  );

  return s.exists()?s.data():{};
}
