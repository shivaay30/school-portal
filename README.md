# Rogers School Portal

A school website where **students**, **teachers**, and **parents** can log in to view results, attendance, and daily homework. **Admin** can manage everything.

---

## Admin login (works on Render after deploy)

| Field      | Value                |
|-----------|----------------------|
| **Email** | `admin@school.com`   |
| **Password** | `Admin@School123` |

Use these on your live Render URL to sign in as admin. The app **auto-seeds** when there are no users, so this admin account is created on first deploy.

---

## Run locally

```bash
npm install
npm start
```

Open **http://localhost:3000**.  
To reset sample data: `npm run seed`.

---

## Deploy on Render

1. Push this repo to **GitHub** (see below).
2. Go to [Render](https://render.com) → **New +** → **Web Service**.
3. Connect your GitHub repo.
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Deploy. After deploy, open your Render URL and log in with the **admin** credentials above.

---

## Push to Git (GitHub)

1. **Install Git** from https://git-scm.com/download/win (then close and reopen PowerShell).
2. **Create a new repo** on GitHub: https://github.com/new — name it `school-portal`, leave it empty (no README).
3. **From the project folder** in PowerShell run:

```powershell
cd "c:\Users\shivatom\OneDrive - AMDOCS\Documents\Rogers\school-portal"
git init
git add .
git commit -m "Rogers School Portal - school theme, admin auto-seed"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/school-portal.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username. When prompted, sign in to GitHub.

---

## Sample accounts (after seed)

| Role    | Email               | Password     |
|---------|---------------------|--------------|
| Admin   | admin@school.com    | Admin@School123 |
| Student | alice@student.com   | password123  |
| Parent  | parent@alice.com    | password123  |
| Teacher | teacher@school.com | password123  |
