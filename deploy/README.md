# WEB FORENSICS — Standalone Deployment Package

This `deploy/` directory is a **clean, isolated, production-ready export** of the entire WEB FORENSICS application.

---

## 🔒 What Is Protected & Hidden
This directory intentionally **excludes** all dangerous, non-public, or developmental assets:
- ❌ **`node_modules/`** is omitted (Only clean production `package.json` included).
- ❌ **`firestore.rules` & blueprints** are omitted (Security rules remain protected in the primary repository).
- ❌ **Development source code (`/src`)** is omitted (Already compiled into minified, encrypted bundles).
- ❌ **Local `.env` secrets** are omitted (Replaced by safe `.env.production.example`).

---

## 📦 What Is Included Inside This Folder
1. **`dist/`**: The complete production frontend build (HTML, JS, CSS, logo, icons, offline cache).
2. **`server.cjs`**: The single-file compiled backend server running Express with DNS, TCP, WHOIS, and TLS inspectors.
3. **`package.json`**: Production runtime dependencies (`express` only).
4. **`Dockerfile`**: Container recipe ready for 1-click cloud container platforms.
5. **`vercel.json`**: Pre-configured configuration for Vercel deployment.
6. **`netlify.toml`**: Pre-configured configuration for Netlify deployment.
7. **`firebase.json`**: Pre-configured configuration for Firebase Hosting.
8. **`.env.production.example`**: Production environment blueprint.

---

## 🚀 Deployment Options

### Option 1: Vercel
1. In your Vercel Dashboard, click **Add New Project** > **Import**.
2. Set the **Root Directory** to `deploy` (or upload this folder).
3. Vercel will automatically detect `vercel.json` and deploy both the frontend and API routes.

### Option 2: Render / Railway / Google Cloud Run (Recommended for Full-Stack)
Because WEB FORENSICS executes real network DNS, TLS socket handshakes, and WHOIS queries, full-stack container environments provide the best socket performance:
1. Connect your repository to Render or Railway.
2. Select **Docker** or set the start command:
   ```bash
   npm install --omit=dev && npm start
   ```
3. Set your environment variables (e.g. `PORT=3000`).

### Option 3: Netlify (Frontend Only)
1. Drag and drop the `dist/` subfolder directly into the Netlify Drop box, or link your git repo with Publish Directory set to `deploy/dist`.
2. Netlify will serve the UI and the `/privacy` and `/terms` documents.

### Option 4: Firebase Hosting
If deploying directly to your Firebase project (`web-forensics-ba8e0`):
```bash
firebase deploy --only hosting
```
(Using the provided `deploy/firebase.json` pointing to `dist`).
