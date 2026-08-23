# 🔐 SECURITY NOTICE

## Firebase API Key Exposed - Action Required!

### What Happened?
A Firebase API key was accidentally committed to the repository in the initial commit:
- **File**: `client/src/config/firebase.js`
- **Exposed Key**: `AIzaSyBYeAkz0_CY5ePs_2-RYgq14O41vWlb6CE`
- **Fixed in**: Commit `6cd221b`

### ⚠️ IMMEDIATE ACTION REQUIRED

Since the key was pushed to a public repository, it should be considered compromised. Follow these steps:

### 1. Rotate Firebase API Key

**Option A: Restrict the existing key (Recommended)**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `movierec-7aa5a`
3. Go to **APIs & Services** > **Credentials**
4. Find the API key ending in `...b6CE`
5. Click **Edit** and add **Application restrictions**:
   - Select "HTTP referrers (web sites)"
   - Add your domains (e.g., `localhost:5173`, `yourdomain.com`)
6. Under **API restrictions**, select "Restrict key" and only enable:
   - Firebase Authentication
   - Firebase Storage
   - Identity Toolkit API

**Option B: Create a new key (Most Secure)**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `movierec-7aa5a`
3. Go to **Project Settings** > **General**
4. Scroll to "Your apps" section
5. Click **Add app** or regenerate the web app
6. Copy the new configuration
7. Update your local `client/.env` file
8. **Delete the old API key** from Google Cloud Console

### 2. Update Environment Variables
Update your local `client/.env` file with the new/restricted key:
```env
VITE_FIREBASE_API_KEY=your_new_or_restricted_key
VITE_FIREBASE_AUTH_DOMAIN=movierec-7aa5a.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=movierec-7aa5a
VITE_FIREBASE_STORAGE_BUCKET=movierec-7aa5a.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1095392491925
VITE_FIREBASE_APP_ID=1:1095392491925:web:2d3cd5bfb3fd996cf7de9c
VITE_FIREBASE_MEASUREMENT_ID=G-SDRJ3Y5NJ8
```

### 3. Monitor Firebase Usage
Check your Firebase Console for any unauthorized usage:
- Go to **Usage and billing** > **Details & settings**
- Look for unusual spikes in:
  - Authentication sign-ins
  - Storage usage
  - API calls

### 4. Future Prevention
✅ **Already Fixed:**
- Firebase config now uses environment variables only
- No fallback values in code
- `.env` files are gitignored

✅ **Best Practices Going Forward:**
- Never commit `.env` files
- Use `.env.example` as templates only
- Always use environment variables for sensitive data
- Review commits before pushing

## Security Checklist
- [ ] Firebase API key restricted or rotated
- [ ] Local `.env` file updated with new key
- [ ] Firebase usage monitored for anomalies
- [ ] Team members informed (if applicable)

## Questions?
If you notice any suspicious activity in your Firebase console, immediately:
1. Disable the exposed API key
2. Enable Firebase App Check
3. Review authentication logs

---
**Status**: ⚠️ Action Required
**Priority**: High
**Last Updated**: 2026-08-24
