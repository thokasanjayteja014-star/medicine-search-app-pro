import { app, auth, db, toast } from './common.js';
import { 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail,
  onAuthStateChanged, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink,
  RecaptchaVerifier, signInWithPhoneNumber 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Helpers
function routeByRole(role){ window.location.href = role==='doctor' ? 'doctor.html' : 'patient.html'; }
async function getRole(uid){
  const snap = await getDoc(doc(db,'users',uid));
  return snap.exists() ? (snap.data().role || 'patient') : 'patient';
}

// Signup
const suName = document.getElementById('su-name');
const suRole = document.getElementById('su-role');
const suEmail = document.getElementById('su-email');
const suPass = document.getElementById('su-pass');
document.getElementById('btn-signup').addEventListener('click', async ()=>{
  try{
    const cred = await createUserWithEmailAndPassword(auth, suEmail.value, suPass.value);
    await setDoc(doc(db,'users',cred.user.uid), { uid: cred.user.uid, name: suName.value||'', role: suRole.value, email: suEmail.value });
    toast('Account created!'); routeByRole(suRole.value);
  }catch(e){ toast(e.message); }
});

// Password login
const liEmail = document.getElementById('li-email');
const liPass = document.getElementById('li-pass');
document.getElementById('btn-login').addEventListener('click', async ()=>{
  try{ await signInWithEmailAndPassword(auth, liEmail.value, liPass.value); }catch(e){ toast(e.message); }
});
document.getElementById('btn-reset').addEventListener('click', async ()=>{
  if(!liEmail.value) return toast('Enter your email first');
  try{ await sendPasswordResetEmail(auth, liEmail.value); toast('Reset email sent'); }catch(e){ toast(e.message); }
});

// Email OTP (magic link)
const otpEmail = document.getElementById('otp-email');
document.getElementById('btn-email-otp').addEventListener('click', async ()=>{
  try{
    const actionCodeSettings = { url: window.location.origin + '/index.html', handleCodeInApp: true };
    await sendSignInLinkToEmail(auth, otpEmail.value, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', otpEmail.value);
    toast('Sign-in link sent. Check your email.');
  }catch(e){ toast(e.message); }
});
if (isSignInWithEmailLink(auth, window.location.href)) {
  let email = window.localStorage.getItem('emailForSignIn');
  if (!email) { email = window.prompt('Please provide your email for confirmation'); }
  signInWithEmailLink(auth, email, window.location.href).then(()=>{
    window.localStorage.removeItem('emailForSignIn');
  }).catch(e=>toast(e.message));
}

// Phone OTP
const phoneInput = document.getElementById('otp-phone');
const otpCode = document.getElementById('otp-code');
let confirmation = null;
window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size:'normal' });
document.getElementById('btn-phone-otp').addEventListener('click', async ()=>{
  try{ confirmation = await signInWithPhoneNumber(auth, phoneInput.value, window.recaptchaVerifier); toast('OTP sent'); }
  catch(e){ toast(e.message); }
});
document.getElementById('btn-verify-otp').addEventListener('click', async ()=>{
  try{ await confirmation.confirm(otpCode.value); }catch(e){ toast(e.message); }
});

// Route on login
onAuthStateChanged(auth, async (user)=>{
  if(!user) return;
  try{ const role = await getRole(user.uid); routeByRole(role); }catch{ routeByRole('patient'); }
});
