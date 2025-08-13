# Med Prescribe Pro (Free)
Doctor–patient prescriptions with **OTP login (email/phone)**, **chat**, and **PDF export**. 
Free data sources (OpenFDA + Wikipedia) via Netlify Functions — no paid keys.

## Firebase setup
1. Create project → add Web app → copy config into `js/firebase-config.js`.
2. Enable **Authentication**:
   - Email/Password
   - Email Link (passwordless)
   - Phone (set up reCAPTCHA in console)
3. Create **Firestore** (production mode).

### Firestore security rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /prescriptions/{id} {
      allow create: if request.auth != null; // created by doctor
      allow read: if request.auth != null && (
        resource.data.patientEmail == request.auth.token.email ||
        resource.data.doctorId == request.auth.uid
      );
      allow update, delete: if request.auth != null && resource.data.doctorId == request.auth.uid;
    }
    match /chats/{chatId}/messages/{msgId} {
      allow create, read: if request.auth != null; // basic guard; tighten if needed
    }
  }
}
```

## Netlify
- Import repo, no build command, publish dir `.`.
- Functions are in `netlify/functions`.

## Notes
- Educational use only, not medical advice.
- PDF generated with jsPDF on the client.
