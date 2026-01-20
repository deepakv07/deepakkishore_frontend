# 🚀 SkillBuilder Deployment & Distribution Guide

- **[Windows Deployment](#-how-to-package-the-app-for-you)** (Portable ZIP)
- **[Mobile Deployment](file:///c:/Users/ambattur/Desktop/SkillBuilder-2/deepakkishore_frontend/deerajkishore-softrate-0084eff374006678a63c36e4ef5ae2e80bd1771c/MOBILE_DEPLOYMENT.md)** (Install on iPhone/Android)

---

## 📦 How to Package the App (For You)

I have created a script called `bundle_project.ps1` that automatically creates a clean ZIP folder of your project, excluding bulky folders like `node_modules` to make the download fast.

### Steps to create the ZIP:
1.  Open **PowerShell** in the project root.
2.  Run the command:
    ```powershell
    .\bundle_project.ps1
    ```
3.  A file named `SkillBuilder_App_v1.zip` will be created in your folder.
4.  **This is the file you give to users.**

---

## 🏃‍♂️ How to Run the App (For Your Users)

Once the user downloads and unzips your project, they only need to follow these steps:

1.  **Open the folder** `deerajkishore-softrate-...`
2.  **Double-click** on `start_app.cmd`.
3.  **Wait** while it automatically:
    -   Checks for Node.js and Python.
    -   Installs all necessary components.
    -   Starts the AI Engine, Backend, and Frontend.
    -   Opens the app in their browser.

> [!IMPORTANT]
> The user must have **Node.js** and **Python** installed on their machine for the app to function.

---

## 🛠️ App Behavior Details

- **AI Engine**: Runs on port `8000`.
- **Backend API**: Runs on port `3000`.
- **Frontend**: Runs on port `5173`.
- **Database**: The app connects to your **MongoDB Atlas** cluster automatically using the credentials in the `.env` files.

## 🌟 Professional Tip: Converting to an `.exe`

If you want a single file like `SkillBuilder.exe` instead of a folder:
1.  We can use **Electron** (as mentioned in the Implementation Plan).
2.  This requires a bit more setup but provides a professional desktop window.
3.  Let me know if you would like me to proceed with the Electron setup next!
