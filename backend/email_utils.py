
import smtplib
import socket
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import dns.resolver
from . import config

def get_mx_record(domain):
    try:
        records = dns.resolver.resolve(domain, 'MX')
        mx_record = sorted(records, key=lambda r: r.preference)[0]
        return str(mx_record.exchange).rstrip('.')
    except Exception as e:
        print(f"DNS lookup failed for {domain}: {e}")
        return None

def send_email(to_email: str, subject: str, html_content: str):
    """
    Send an email using the configured SMTP server or Direct Delivery.
    """
    cfg = config.get_config()
    smtp_config = cfg.get_section("smtp")
    
    if not smtp_config.get("enabled"):
        print(f"Mock Email to {to_email}: {subject}")
        return False, "Email sending is disabled"

    msg = MIMEMultipart()
    msg['From'] = smtp_config.get("from_email")
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(html_content, 'html'))

    mode = smtp_config.get("mode", "relay")
    
    try:
        if mode == "direct":
            # Direct Delivery logic
            domain = to_email.split('@')[1]
            mx_host = get_mx_record(domain)
            if not mx_host:
                return False, f"Could not resolve MX record for {domain}"
            
            print(f"Direct Delivery: Connecting to {mx_host}:25...")
            server = smtplib.SMTP(mx_host, 25, timeout=10)
            server.send_message(msg)
            server.quit()
            return True, "Email sent successfully (Direct)"

        elif mode == "gmail":
            # Gmail Preset
            # Use SMTP_SSL (Port 465) which is often more reliable than STARTTLS
            server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=15)
            # server.starttls() # Not needed for SMTP_SSL
            
            username = smtp_config.get("username")
            password = smtp_config.get("password")
            
            if username and password:
                server.login(username, password)
            
            server.send_message(msg)
            server.quit()
            return True, "Email sent successfully (Gmail)"
            
        else:
            # Relay logic
            host = smtp_config.get("host")
            port = smtp_config.get("port")
            username = smtp_config.get("username")
            password = smtp_config.get("password")
            use_tls = smtp_config.get("use_tls")

            server = smtplib.SMTP(host, port, timeout=10)
            if use_tls:
                server.starttls()
            
            if username and password:
                server.login(username, password)
            
            server.send_message(msg)
            server.quit()
            return True, "Email sent successfully (Relay)"

    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
        return False, str(e)

def send_password_reset_email(to_email: str, token: str):
    cfg = config.get_config()
    base_url = cfg.get("server", "public_url") or "http://localhost:30815"
    # Remove trailing slash if present
    base_url = base_url.rstrip("/")
    
    reset_link = f"{base_url}/reset-password?token={token}"
    
    subject = "Password Reset Request"
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #4A90E2;">Password Reset</h2>
                <p>Hello,</p>
                <p>We received a request to reset the password for your account associated with <strong>{to_email}</strong>.</p>
                <p>Click the button below to reset your password:</p>
                <p style="text-align: center;">
                    <a href="{reset_link}" style="display: inline-block; background-color: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
                </p>
                <p>If you didn't request this, you can safely ignore this email.</p>
                <p>This link will expire in 1 hour.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #888;">If the button doesn't work, copy and paste this link into your browser:<br> <a href="{reset_link}">{reset_link}</a></p>
            </div>
        </body>
    </html>
    """
    
    return send_email(to_email, subject, html_content)
