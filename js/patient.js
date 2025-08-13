import { auth, db, toast, now } from './common.js';
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.getElementById('logout').addEventListener('click', ()=>signOut(auth));

async function loadMine(){
  const user = auth.currentUser; if(!user) return;
  const qy = query(collection(db,'prescriptions'), where('patientEmail','==', user.email), orderBy('createdAt','desc'));
  const snap = await getDocs(qy);
  const root = document.getElementById('prescriptions'); root.innerHTML='';
  if(snap.empty){ root.innerHTML = '<div class="card center">No prescriptions yet.</div>'; return; }
  snap.forEach(d=>{
    const p = d.data();
    const el = document.createElement('div'); el.className='card';
    const medsRows = (p.medicines||[]).map(m=>`<tr><td>${m.name||''}</td><td>${m.dosage||''}</td><td>${m.when||''}</td><td>${m.frequency||''}</td><td>${m.notes||''}</td></tr>`).join('');
    el.innerHTML = `
      <div class="flex"><strong>${p.disease}</strong> <span class="badge">Prescribed</span>
        <button class="btn-secondary btn-pdf" style="margin-left:auto">Download PDF</button></div>
      <div class="card">
        <table class="table">
          <thead><tr><th>Medicine</th><th>Dosage</th><th>When</th><th>Freq/Duration</th><th>Notes</th></tr></thead>
          <tbody>${medsRows}</tbody>
        </table>
      </div>
      <div class="grid-2">
        <div><strong>Precautions</strong><p class="small" style="white-space:pre-wrap">${p.precautions||''}</p></div>
        <div><strong>Food & Lifestyle</strong><p class="small" style="white-space:pre-wrap">${p.food||''}</p></div>
      </div>
      <p class="small">Generated: ${now()}</p>
    `;
    el.querySelector('.btn-pdf').addEventListener('click', ()=>downloadPDF(p, auth.currentUser));
    root.appendChild(el);
  });
}

// PDF export
function downloadPDF(p, user){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const mm = 10;
  doc.setFont('helvetica','bold'); doc.setFontSize(16);
  doc.text('MED PRESCRIBE — PRESCRIPTION', mm, 16);
  doc.setFontSize(10); doc.setFont('helvetica','normal');
  doc.text(`Patient: ${user.email}`, mm, 24);
  doc.text(`Disease: ${p.disease}`, mm, 29);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, mm, 34);
  // Table header
  let y = 42;
  doc.setFont('helvetica','bold'); doc.text('Medicines', mm, y); y+=4;
  doc.setFont('helvetica','normal');
  const header = ['Medicine','Dosage','When','Freq/Duration','Notes'];
  let x = mm;
  header.forEach(h=>{ doc.text(h, x, y); x += 38; });
  y += 4; doc.line(mm, y, 200, y); y += 4;
  (p.medicines||[]).forEach(m=>{
    x = mm;
    [m.name||'', m.dosage||'', m.when||'', m.frequency||'', m.notes||''].forEach(val=>{
      doc.text(String(val).slice(0,28), x, y); x += 38;
    });
    y += 6;
  });
  y += 4; doc.setFont('helvetica','bold'); doc.text('Precautions', mm, y); y+=4;
  doc.setFont('helvetica','normal');
  const prec = (p.precautions||'').split('\n'); prec.forEach(line=>{ doc.text(line.slice(0,95), mm, y); y+=5; });
  y += 2; doc.setFont('helvetica','bold'); doc.text('Food & Lifestyle', mm, y); y+=4;
  doc.setFont('helvetica','normal');
  const food = (p.food||'').split('\n'); food.forEach(line=>{ doc.text(line.slice(0,95), mm, y); y+=5; });
  doc.save(`prescription-${(p.disease||'').replace(/\s+/g,'-').toLowerCase()}.pdf`);
}

// --- Chat (patient side) ---
let unsub = null;
function chatId(doctorUid, patientEmail){ return `${doctorUid}__${patientEmail.toLowerCase()}`; }
async function openChat(){
  const peerEmail = document.getElementById('chat-peer').value.trim().toLowerCase();
  if(!peerEmail) return toast('Enter your doctor email.');
  document.getElementById('chat-with').textContent = peerEmail;
  document.getElementById('chat-box').style.display='grid';
  // We need doctor's uid; derive from prescriptions addressed by this doctor email (first match)
  const qy = query(collection(db,'prescriptions'), where('patientEmail','==', auth.currentUser.email));
  const snap = await getDocs(qy);
  let doctorUid = null;
  snap.forEach(d=>{ if(!doctorUid && d.data().doctorId) doctorUid = d.data().doctorId; });
  if(!doctorUid) return toast('Could not find a chat for this doctor yet.');
  const id = chatId(doctorUid, auth.currentUser.email);
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
