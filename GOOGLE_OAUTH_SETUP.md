# 🔐 Google OAuth Setup Guide — 49GIG

**Status:** ✅ Implementation Complete  
**Date:** 2025-01-27

---

## 📋 Setup Instructions

### **Step 1: Google Cloud Console Setup**

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create or Select Project**
   - Click "Select a project" → "New Project"
   - Enter project name: "49GIG" (or your preferred name)
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - If prompted, configure OAuth consent screen first:
     - User Type: External (or Internal if using Google Workspace)
     - App name: "49GIG"
     - User support email: Your email
     - Developer contact: Your email
     - Click "Save and Continue"
     - Scopes: Add `email`, `profile`, `openid`
     - Click "Save and Continue"
     - Test users: Add your email (for testing)
     - Click "Save and Continue"

5. **Configure OAuth Client**
   - Application type: **Web application**
   - Name: "49GIG Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://your-production-domain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/oauth/callback` (for development)
     - `https://your-production-domain.com/oauth/callback` (for production)
   - Click "Create"

6. **Copy Credentials**
   - Copy the **Client ID**
   - Copy the **Client Secret**
   - Keep these secure!

---

### **Step 2: Convex Environment Variables**

1. **Go to Convex Dashboard**
   - Visit: https://dashboard.convex.dev/
   - Select your project

2. **Add Environment Variables**
   - Go to "Settings" → "Environment Variables"
   - Add the following:

   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_REDIRECT_URI=https://your-domain.com/oauth/callback
   ```

   **For Development:**
   ```
   GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback
   ```

   **For Production:**
   ```
   GOOGLE_REDIRECT_URI=https://your-production-domain.com/oauth/callback
   ```

3. **Save Changes**
   - Click "Save"
   - Wait for deployment to complete

---

### **Step 3: Test OAuth Flow**

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test Login**
   - Go to `http://localhost:3000/login`
   - Click "Sign in with Google"
   - Should redirect to Google OAuth consent screen
   - After consent, should redirect back to callback
   - Should create session and redirect to dashboard

3. **Test Signup**
   - Go to `http://localhost:3000/signup`
   - Select role (Client or Freelancer)
   - Click "Sign up with Google"
   - Should create new account with selected role

---

## 🔒 Security Notes

1. **Never commit credentials to git**
   - Keep Client Secret secure
   - Use environment variables only

2. **Redirect URI must match exactly**
   - Must match in Google Console
   - Must match in Convex environment variables
   - Case-sensitive and must include protocol

3. **HTTPS in Production**
   - Always use HTTPS for production
   - Google requires HTTPS for production OAuth

4. **State Parameter**
   - Used for CSRF protection
   - Includes role for signup flow
   - Validated on callback

---

## 🐛 Troubleshooting

### **Error: "redirect_uri_mismatch"**
- **Cause:** Redirect URI doesn't match Google Console
- **Fix:** Check both Google Console and Convex environment variables

### **Error: "invalid_client"**
- **Cause:** Client ID or Secret is incorrect
- **Fix:** Verify environment variables in Convex dashboard

### **Error: "access_denied"**
- **Cause:** User denied consent
- **Fix:** This is expected - user can try again

### **Error: "Failed to exchange code for token"**
- **Cause:** Authorization code expired or already used
- **Fix:** OAuth codes are single-use - user needs to start flow again

---

## ✅ Verification Checklist

- [ ] Google Cloud Console project created
- [ ] Google+ API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 Client ID created
- [ ] Redirect URIs configured (dev and prod)
- [ ] Environment variables set in Convex
- [ ] OAuth flow tested on login page
- [ ] OAuth flow tested on signup page
- [ ] Account linking tested (existing email)
- [ ] New account creation tested

---

## 📝 Next Steps

1. **Test OAuth flow end-to-end**
2. **Configure production redirect URIs**
3. **Add account linking confirmation UI** (optional)
4. **Monitor OAuth usage in Google Console**
5. **Set up OAuth error monitoring**

---

**Status:** ✅ Google OAuth Setup Guide Complete

