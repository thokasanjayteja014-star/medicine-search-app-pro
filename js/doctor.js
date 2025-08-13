import { auth, db, toast, now } from './common.js';
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.getElementById('logout').addEventListener('click', ()=>signOut(auth));

const tbody = document.querySelector('#med-table tbody');
function addRow(row={name:'',dosage:'',when:'',frequency:'',notes:''}){
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" value="${row.name||''}"/></td>
    <td><input type="text" value="${row.dosage||''}"/></td>
    <td><input type="text" value="${row.when||''}"/></td>
    <td><input type="text" value="${row.frequency||''}"/></td>
    <td><input type="text" value="${row.notes||''}"/></td>
    <td><button class="btn-secondary btn-del">✕</button></td>`;
  tr.querySelector('.btn-del').addEventListener('click', ()=>tr.remove());
  tbody.appendChild(tr);
}
document.getElementById('btn-add-row').addEventListener('click', ()=>addRow());

document.getElementById('btn-suggest-meds').addEventListener('click', async ()=>{
  const disease = document.getElementById('disease').value.trim();
  if(!disease) return toast('Enter a disease first.');
  try{
    const r = await fetch(`/.netlify/functions/getMedicines?disease=${encodeURIComponent(disease)}`);
    const j = r.ok ? await r.json() : { medicines: [] };
    (j.medicines||[]).slice(0,5).forEach(n=>addRow({name:n}));
    if((j.medicines||[]).length===0) toast('No suggestions found; add rows manually.');
  }catch{ toast('Suggestion failed.'); }
});

document.getElementById('btn-fetch').addEventListener('click', async ()=>{
  const disease = document.getElementById('disease').value.trim();
  if(!disease) return toast('Enter a disease/condition.');
  const r = await fetch(`/.netlify/functions/getAdvice?disease=${encodeURIComponent(disease)}`);
  if(!r.ok) return toast('Advice fetch failed');
  const adv = await r.json();
  document.getElementById('precautions').value = (adv.precautions||[]).map(x=>`• ${x}`).join('\n');
  document.getElementById('food').value = (adv.food||[]).map(x=>`• ${x}`).join('\n');
  document.getElementById('overview').innerHTML = adv.summary ? `${adv.summary} ${adv.source?`<a href="${adv.source.url}" target="_blank">[source]</a>`:''}` : '';
});

document.getElementById('btn-save').addEventListener('click', async ()=>{
  const patientEmail = document.getElementById('p-email').value.trim();
  const disease = document.getElementById('disease').value.trim();
  if(!patientEmail || !disease) return toast('Patient email and disease required.');
  const meds = Array.from(tbody.querySelectorAll('tr')).map(tr=>{
    const [a,b,c,d,e] = tr.querySelectorAll('input');
    return { name:a.value, dosage:b.value, when:c.value, frequency:d.value, notes:e.value };
  });
  try{
    await addDoc(collection(db,'prescriptions'), {
      patientEmail, disease, medicines: meds,
      precautions: document.getElementById('precautions').value,
      food: document.getElementById('food').value,
      doctorId: (auth.currentUser||{}).uid || null,
      createdAt: serverTimestamp()
    });
    toast('Prescription saved!'); tbody.innerHTML='';
  }catch(e){ toast(e.message); }
});

async function loadMine(){
  if(!auth.currentUser) return;
  const qy = query(collection(db,'prescriptions'), where('doctorId','==',auth.currentUser.uid), orderBy('createdAt','desc'));
  const snap = await getDocs(qy);
  const div = document.getElementById('my-list'); div.innerHTML='';
  snap.forEach(d=>{
    const p = d.data();
    const el = document.createElement('div');
    el.className='card';
    el.innerHTML = `<div class="flex"><strong>${p.disease}</strong> <span class="badge">${p.patientEmail}</span></div>
      <div class="small">${(p.medicines||[]).map(m=>m.name).filter(Boolean).slice(0,5).join(', ')}</div>`;
    div.appendChild(el);
  });
}

// --- Chat ---
let unsub = null;
function chatId(uid, email){ return `${uid}__${email.toLowerCase()}`; }
function openChat(){
  const peer = document.getElementById('chat-email').value.trim().toLowerCase();
  if(!peer) return toast('Enter patient email.');
  document.getElementById('chat-with').textContent = peer;
  document.getElementById('chat-box').style.display='grid';
  const id = chatId(auth.currentUser.uid, peer);
  const log = document.getElementById('chat-log');
  if(unsub) unsub();
  unsub = onSnapshot(collection(db,'chats',id,'messages'), (snap)=>{
    log.innerHTML='';
    snap.docs.sort((a,b)=> (a.data().ts?.seconds||0) - (b.data().ts?.seconds||0)).forEach(x=>{
      const m = x.data(); const div = document.createElement('div');
      div.className = 'msg ' + (m.uid===auth.currentUser.uid ? 'me':'them');
      div.textContent = `${m.text}`;
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
    });
  });
  document.getElementById('chat-send').onclick = async ()=>{
    const t = document.getElementById('chat-input'); const text = t.value.trim(); if(!text) return;
    await addDoc(collection(db,'chats',id,'messages'), { uid: auth.currentUser.uid, text, ts: serverTimestamp() });
    t.value='';
  };
}
document.getElementById('open-chat').addEventListener('click', openChat);

onAuthStateChanged(auth, (user)=>{ if(!user) window.location.href='index.html'; else loadMine(); });
