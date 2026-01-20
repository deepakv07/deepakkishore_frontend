# 📱 SkillBuilder Mobile Deployment Guide

To get this app on your phone, we need to host it on the internet. Follow these 3 main steps:

## Step 1: Host the Backend & AI (The Brain)

Since your phone cannot run Python or Node.js scripts locally, we need a cloud server. I recommend **Render.com** (it's free and easy).

### 1. Host the AI Engine
1.  Push the `ai/neural_quiz_engine` folder to a GitHub repository.
2.  On Render.com, create a new **Web Service**.
3.  Connect your GitHub repo.
4.  Set the Build Command: `pip install -r requirements.txt`
5.  Set the Start Command: `python server.py`
6.  Once live, you will get a URL like `https://skill-ai.onrender.com`.

### 2. Host the Backend API
1.  Push the `backend` folder to GitHub.
2.  Create another **Web Service** on Render.
3.  Set the Build Command: `npm install && npm run build`
4.  Set the Start Command: `npm run start`
5.  Add **Environment Variables**:
    - `MONGODB_URI`: (Your MongoDB Atlas link)
    - `JWT_SECRET`: (Any secret string)
6.  Once live, you will get a URL like `https://skill-api.onrender.com`.

---

## Step 2: Host the Frontend (The Interface)

I recommend **Vercel** or **Netlify**.

1.  Push the `frontend` folder to GitHub.
2.  Connect it to Vercel/Netlify.
3.  **IMPORTANT**: Add this Environment Variable during setup:
    - `VITE_API_URL`: `https://your-backend-url.onrender.com/v1`
4.  Deploy! You will get a final URL like `https://skillbuilder.vercel.app`.

---

## Step 3: Install on Your Mobile Phone

Once your frontend URL is live:

### For Android:
1.  Open Chrome on your phone.
2.  Go to your app's live URL (e.g., `https://skillbuilder.vercel.app`).
3.  A popup should appear: **"Add SkillBuilder to Home Screen"**.
4.  Click **Install**. The app icon will now appear on your phone like a real app!

### For iPhone (iOS):
1.  Open Safari on your iPhone.
2.  Go to your app's live URL.
3.  Tap the **Share** button (the square with an arrow).
4.  Scroll down and tap **"Add to Home Screen"**.
5.  Tap **Add**. The app is now on your home screen!

---

## 🌟 Why this works?
I have configured the app as a **Progressive Web App (PWA)**. This means:
- It has a custom app icon (I've already bundled a premium logo).
- It runs full-screen without the browser address bar.
- It feels fast and modern.
