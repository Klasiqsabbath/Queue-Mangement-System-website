import nodemailer from "nodemailer";

const resolveBookingEmail = (userData = {}, configuredRecipient = "") => {
  const candidateEmails = [userData?.email, configuredRecipient, process.env.BOOKING_NOTIFICATION_EMAIL, process.env.ADMIN_EMAIL]
    .filter(Boolean)
    .map((value) => String(value).trim())
    .filter(Boolean);

  return candidateEmails[0] || "";
};

const getBookingNotificationRecipients = (userData = {}, configuredRecipient = "") => {
  const primaryEmail = resolveBookingEmail(userData, configuredRecipient);
  const recipients = [primaryEmail, configuredRecipient, process.env.BOOKING_NOTIFICATION_EMAIL, process.env.ADMIN_EMAIL]
    .filter(Boolean)
    .map((value) => String(value).trim())
    .filter(Boolean);

  return [...new Set(recipients)];
};

const createTransporter = async () => {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_SECURE } = process.env;

  if (EMAIL_HOST && EMAIL_USER && EMAIL_PASS) {
    return nodemailer.createTransport({
      host: EMAIL_HOST,
      port: Number(EMAIL_PORT || 587),
      secure: EMAIL_SECURE === "true",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
  }

  return createTestTransporter();
};

const createTestTransporter = async () => {
  try {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch (error) {
    console.warn("Failed to create test SMTP account", error);
    return null;
  }
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

  const transporter = await createTransporter();

  if (!transporter) {
    console.warn("Booking email skipped because SMTP credentials are not configured and test account could not be created.");
    return { success: false, skipped: true, message: "SMTP not configured" };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || "no-reply@prescripto.com",
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
        <li><strong>Fee:</strong> GHS ${Number(appointmentData?.amount || 1).toFixed(0)}</li>
        <li><strong>Reason:</strong> ${appointmentData?.reason || "Not provided"}</li>
      </ul>
      <p>Your booking reference is <strong>${appointmentData?.appointmentId || ""}</strong>.</p>
      <p>Thank you for choosing Prescripto.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    return { success: true, recipients, info, previewUrl };
  } catch (error) {
    console.error("Failed to send appointment confirmation email", error);
    const authFailed = error.response?.includes("535") || error.code === "EAUTH";

    if (authFailed && process.env.NODE_ENV !== "production") {
      const fallbackTransporter = await createTestTransporter();
      if (fallbackTransporter) {
        try {
          const fallbackInfo = await fallbackTransporter.sendMail(mailOptions);
          const fallbackPreviewUrl = nodemailer.getTestMessageUrl(fallbackInfo);
          return {
            success: true,
            recipients,
            info: fallbackInfo,
            previewUrl: fallbackPreviewUrl,
            fallback: true,
            message: "Email sent using development test SMTP. Replace Gmail credentials to send real emails.",
          };
        } catch (fallbackError) {
          console.error("Test SMTP fallback also failed", fallbackError);
        }
      }
    }

    return {
      success: false,
      skipped: false,
      message: authFailed
        ? "SMTP authentication failed. Please check EMAIL_USER and EMAIL_PASS or use a Gmail app password."
        : "Unable to send confirmation email. Please try again later.",
      error: { code: error.code || "EMAIL_SEND_FAILED" },
    };
  }
};

export { getBookingNotificationRecipients, resolveBookingEmail, sendBookingConfirmationEmail };
