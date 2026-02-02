# How to Update Changes in Git

## Step 1: Install Git (if not already installed)
1. Download Git from: https://git-scm.com/download/win
2. Install with default options
3. **Close and reopen PowerShell** after installation

## Step 2: Navigate to your project
```powershell
cd "c:\Users\shivatom\OneDrive - AMDOCS\Documents\Rogers\school-portal"
```

## Step 3: Initialize Git (if not already done)
```powershell
git init
```

## Step 4: Add all changed files
```powershell
git add .
```

## Step 5: Commit the changes
```powershell
git commit -m "Fix Render deployment: use /tmp for database and sessions"
```

## Step 6: Connect to GitHub (if you have a repository)
```powershell
git remote add origin https://github.com/YOUR_USERNAME/school-portal.git
```
(Replace YOUR_USERNAME with your GitHub username)

## Step 7: Push to GitHub
```powershell
git push -u origin main
```

If you get an error about branch name, try:
```powershell
git branch -M main
git push -u origin main
```

---

## After pushing to GitHub:
1. Go to Render.com dashboard
2. Your service should auto-deploy from GitHub
3. Or manually trigger a deploy
4. After deploy succeeds, open Render Shell and run: `npm run seed`
