"""
Send a congratulatory booking email via SMTP.

Usage:
  python send_congrats_email.py \
    --to user@example.com \
    --patient "Ada" \
    --doctor "Dr. Ava Mitchell" \
    --date "04_08_2026" \
    --time "10:00 AM" \
    --appointment-id apt123

Environment variables (preferred):
  EMAIL_HOST (default: smtp.gmail.com)
  EMAIL_PORT (default: 587)
  EMAIL_USER
  EMAIL_PASS
  EMAIL_FROM (optional; defaults to EMAIL_USER)
  EMAIL_SECURE (true/false, optional; defaults false)

This script uses only Python standard library so it requires no extra packages.
"""

import os
import sys
import argparse
import smtplib
from email.message import EmailMessage


def build_html(patient, doctor, slot_date, slot_time, appointment_id):
    return f"""
    <html>
      <body style="font-family: system-ui, -apple-system, Roboto, 'Helvetica Neue', Arial; color:#111827">
        <h3 style="color:#059669">Congratulations — booking confirmed</h3>
        <p>Hello {patient or 'there'},</p>
        <p>Your appointment has been booked successfully. Details:</p>
        <ul>
          <li><strong>Doctor:</strong> {doctor or 'Doctor'}</li>
          <li><strong>Date:</strong> {slot_date or ''}</li>
          <li><strong>Time:</strong> {slot_time or ''}</li>
          <li><strong>Reference:</strong> {appointment_id or ''}</li>
        </ul>
        <p>Thank you for choosing Prescripto.</p>
      </body>
    </html>
    """


def send_email(to_email, subject, html_body):
    EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
    EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
    EMAIL_USER = os.environ.get('EMAIL_USER')
    EMAIL_PASS = os.environ.get('EMAIL_PASS')
    EMAIL_FROM = os.environ.get('EMAIL_FROM') or EMAIL_USER
    EMAIL_SECURE = os.environ.get('EMAIL_SECURE', 'false').lower() == 'true'

    if not EMAIL_USER or not EMAIL_PASS:
        print('ERROR: EMAIL_USER and EMAIL_PASS must be set in environment', file=sys.stderr)
        return False

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = EMAIL_FROM
    msg['To'] = to_email
    msg.set_content('This is an HTML email. Please view it in an HTML-capable client.')
    msg.add_alternative(html_body, subtype='html')

    try:
        if EMAIL_SECURE:
            with smtplib.SMTP_SSL(EMAIL_HOST, EMAIL_PORT) as smtp:
                smtp.login(EMAIL_USER, EMAIL_PASS)
                smtp.send_message(msg)
        else:
            with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as smtp:
                smtp.ehlo()
                if EMAIL_PORT == 587:
                    smtp.starttls()
                    smtp.ehlo()
                smtp.login(EMAIL_USER, EMAIL_PASS)
                smtp.send_message(msg)
        return True
    except Exception as e:
        print('Failed to send email:', e, file=sys.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(description='Send congratulatory booking email')
    parser.add_argument('--to', required=True, help='Recipient email address')
    parser.add_argument('--patient', default='', help='Patient name')
    parser.add_argument('--doctor', default='', help='Doctor name')
    parser.add_argument('--date', default='', help='Slot date (e.g. 04_08_2026)')
    parser.add_argument('--time', default='', help='Slot time (e.g. 10:00 AM)')
    parser.add_argument('--appointment-id', default='', help='Appointment identifier')

    args = parser.parse_args()

    html = build_html(args.patient, args.doctor, args.date, args.time, args.appointment_id)
    subject = 'Appointment booked successfully'

    success = send_email(args.to, subject, html)
    if success:
        print('Email sent to', args.to)
        sys.exit(0)
    else:
        sys.exit(2)


if __name__ == '__main__':
    main()
