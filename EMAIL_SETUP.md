# Step-by-Step Email Setup Guide

This guide will help you configure your File Server to send password reset emails using your domain `file.aqueous.lol`.

## Prerequisites
1.  Open your browser and go to your server (e.g., `http://localhost:30815` or `https://file.aqueous.lol`).
2.  Log in with your admin account (username: `aqueous`, password: `password`).

---

## Step 1: Set the Public URL
This ensures that the "Reset Password" link in the email actually points to your website.

1.  After logging in, click the **User Icon** (or Cog icon) in the top-right corner to open the **Admin Dashboard**.
2.  Look for the **Server Settings** tab or button (it might be automatically selected).
3.  In the row of tabs (Server, Security, Storage...), click **Server**.
4.  Find the box labeled **Public URL**.
5.  Clear whatever is there and type exactly: 
    `https://file.aqueous.lol`
    *(Do not put a slash / at the end)*.

---

## Step 2: Configure Email Sending
Now we tell the server to send emails directly.

1.  In the same **Server Settings** panel, click the **Email** tab (it's at the end of the tabs list).
2.  Check the box that says **Enable Email Sending**.
3.  Look for **Delivery Method** (Dropdown menu).
4.  Click it and select: **Direct Delivery (No Account)**.
    *(This hides the complex login boxes).*
5.  Find the **From Email** box.
6.  Type: `noreply@aqueous.lol`
    *(You can use `admin@aqueous.lol` if you prefer, but `noreply` is standard)*.
7.  Check the box **Use TLS** (keep it checked if it is).

---

## Step 3: Save and Apply
1.  Scroll to the bottom and click the green **Save Configuration** button.
2.  You should see a message saying "Configuration saved successfully".
3.  **Crucial Step**: You must **RESTART** the server for these changes to fully take effect.
    *   If running via the black console window (`start-server.bat`), click inside that window and press `Ctrl+C` to stop it, then run `start-server.bat` again.
    *   If running as an installed service or EXE, restart that program.

---

## Testing
1.  Log out of your account.
2.  Click "Forgot Password?".
3.  Enter your email address and click "Reset Password".
4.  Check your email inbox (and **Spam/Junk** folder!) for the reset link.
