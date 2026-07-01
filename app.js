
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
getFirestore,collection,addDoc,getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const CLOUDINARY_CLOUD='dbljkloal';
const CLOUDINARY_PRESET='Everything';

const firebaseConfig={
apiKey:"AIzaSyAA6mbdYfLrrgCJjN47PX91_mU7I53RiBs",
authDomain:"site-c67b4.firebaseapp.com",
projectId:"site-c67b4",
storageBucket:"site-c67b4.firebasestorage.app",
messagingSenderId:"744761377245",
appId:"1:744761377245:web:3ddaee14f184716eeef634"
};

const app=initializeApp(firebaseConfig);
const db=getFirestore(app);

window.addItem=async()=>{
await addDoc(collection(db,"contents"),{
title:document.getElementById("title").value,
thumb:document.getElementById("thumb").value,
youtube:document.getElementById("youtube").value,
desc:document.getElementById("desc").value
});
location.reload();
};

function ytEmbed(url){
const id=(url.match(/(?:v=|youtu\.be\/)([^&]+)/)||[])[1];
return `https://www.youtube.com/embed/${id}`;
}

async function load(){
const wrap=document.getElementById("content");
const snap=await getDocs(collection(db,"contents"));

snap.forEach(doc=>{
const d=doc.data();
const div=document.createElement("div");
div.className="card";
div.innerHTML=`
<img src="${d.thumb}">
<h3>${d.title}</h3>
`;
div.onclick=()=>{
document.getElementById("player").src=ytEmbed(d.youtube);
};
wrap.appendChild(div);
});
}

load();
