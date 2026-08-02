import nodemailer from "nodemailer";

const getBookingNotificationRecipients = (userData = {}, configuredRecipient = "") => {
  const recipients = [userData?.email, configuredRecipient]
    .filter(Boolean)
    .map((value) => String(value).trim())
    .filter(Boolean);

  return [...new Set(recipients)];
};

const createTransporter = () => {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_SECURE } = process.env;

  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT || 587),
    secure: EMAIL_SECURE === "true",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
};

const sendBookingConfirmationEmail = async ({
  userData,
  docData,
  appointmentData,
  configuredRecipient,
}) => {
  const recipients = getBookingNotificationRecipients(
    userData,
    configuredRecipient || process.env.BOOKING_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL
  );

  if (!recipients.length) {
    return { success: false, skipped: true, message: "No email recipient configured" };
  }

  const transporter = createTransporter();

  if (!transporter) {
    console.warn("Booking email skipped because SMTP credentials are not configured.");
    return { success: false, skipped: true, message: "SMTP not configured" };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: recipients,
    subject: "Appointment booked successfully",
    html: `
      <h3>Appointment booked</h3>
      <p>Hello ${userData?.name || "there"},</p>
      <p>Your appointment has been booked successfully.</p>
      <ul>
        <li><strong>Doctor:</strong> ${docData?.name || "Doctor"}</li>
        <li><strong>Date:</strong> ${appointmentData?.slotDate || ""}</li>
        <li><strong>Time:</strong> ${appointmentData?.slotTime || ""}</li>
        <li><strong>Reason:</strong> ${appointmentData?.reason || "Not provided"}</li>
      </ul>
      <p>Thank you for choosing Prescripto.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, recipients };
  } catch (error) {
    console.error("Failed to send appointment confirmation email", error);
    return { success: false, skipped: false, message: error.message };
  }
};

export { getBookingNotificationRecipients, sendBookingConfirmationEmail };
