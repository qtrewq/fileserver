# FileServer User Guide

Welcome to FileServer! This guide will help you navigate the features of your new file management system.

## Table of Contents
1. [Getting Started](#getting-started)
2. [The Dashboard](#the-dashboard)
3. [File Operations](#file-operations)
4. [Real-time Collaboration](#real-time-collaboration)
5. [Admin Panel](#admin-panel)

---

## Getting Started

### Logging In
Access the server at `http://localhost:30815` (or your server's IP).
- **Default User**: `admin`
- **Default Password**: `adminpassword`

### Changing Your Password
1. Click the **User Icon** in the top-right corner.
2. Select **Account Settings**.
3. Enter your current password and your new desired password.
4. Click **Save Changes**.

---

## The Dashboard

The dashboard is your main workspace.
- **Navigation Bar**: Shows your current path. Click folders to navigate up.
- **Toolbar**: 
  - **View Modes**: Toggle between Grid and List view.
  - **Sort**: Sort by Name, Size, Date, or Type.
  - **Upload**: Upload buttons for Files and Folders.
  - **New Folder**: Create a new directory.

---

## File Operations

### Uploading Files
- **Drag & Drop**: Simply drag files from your computer into the browser window.
- **Buttons**: Use the **Upload Files** or **Upload Folder** buttons in the toolbar.
- **Limits**: The default file size limit is 500MB (configurable by Admin).

### Managing Files
Right-click on any file or folder to open the Context Menu:
- **Preview**: View images, PDFs, and play videos directly in the browser.
- **Download**: Save the file to your computer.
- **Share**: Create a link to share with other users.
- **Edit**: Open text/code files in the built-in Editor.
- **Delete**: Permanently remove the item.

### Sharing
1. Right-click a file/folder and select **Share**.
2. Select a user from the dropdown menu.
3. Choose permissions:
   - **Read Only**: User can view/download.
   - **Read & Write**: User can also edit/delete.
4. Click **Share**. The item will appear in their "Shared with Me" section.

---

## Real-time Collaboration

FileServer allows multiple users to edit code and text files simultaneously.

1. Right-click a text/code file and select **Edit**.
2. The Code Editor opens.
3. If another user opens the same file, you will see their **cursor and avatar** in real-time.
4. Changes are **auto-saved** as you type.
5. **Python Execution**: If Python is enabled, you can click **Run** to execute the script on the server and see the output.

---

## Admin Panel

(Only available to Admin users)

Access by clicking **Admin Panel** in the top-right menu.

### Users & Groups
- **Create Users**: Add new users, set their storage root, and assign groups.
- **Create Groups**: Define permission sets (e.g., "Interns" can only read, "Editors" can write).
- **Storage Quotas**: Set disk space limits per user or group.

### Server Settings
- **Network**: Change the running port (requires restart).
- **Security**: Set maximum file upload sizes.
- **Features**: Toggle File Sharing, Collaboration, or Python Execution on/off globally.
- **Email**: Configure SMTP settings for "Forgot Password" functionality.
