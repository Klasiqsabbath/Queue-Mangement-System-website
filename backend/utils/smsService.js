import https from "https";
import { URL } from "url";

const createSmsServiceUrl = ({ apiKey, to, message, senderId }) => {
  const url = new URL("https://sms.smsnotifygh.com/smsapi");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("to", to);
  url.searchParams.set("msg", message);
  url.searchParams.set("sender_id", senderId);
  return url;
};

export const normalizeRecipientNumber = (rawNumber) => {
  if (!rawNumber) return "";
  const digits = String(rawNumber).replace(/\D/g, "");

  if (digits.startsWith("0") && digits.length === 10) {
    return `233${digits.slice(1)}`;
  }

  if (digits.length === 9) {
    return `233${digits}`;
  }

  if (digits.startsWith("233") && digits.length === 12) {
    return digits;
  }

  return digits;
};

export const sendBookingSmsNotification = async ({ to, message }) => {
  const apiKey = process.env.SMS_NOTIFY_API_KEY;
  const senderId = process.env.SMS_SENDER_ID;

  if (!apiKey) {
    return { success: false, skipped: true, message: "SMS API key not configured" };
  }

  if (!senderId) {
    return { success: false, skipped: true, message: "SMS sender ID not configured" };
  }

  if (!to) {
    return { success: false, skipped: true, message: "Recipient phone number not configured" };
  }

  if (!message) {
    return { success: false, skipped: true, message: "SMS message body not configured" };
  }

  const normalizedTo = normalizeRecipientNumber(to);

  if (!normalizedTo || normalizedTo.length < 9) {
    return {
      success: false,
      skipped: true,
      message: "Invalid recipient phone number for SMS delivery.",
      to: normalizedTo,
    };
  }

  const url = createSmsServiceUrl({ apiKey, to: normalizedTo, message, senderId });

  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          const success = res.statusCode >= 200 && res.statusCode < 300;
          resolve({
            success,
            statusCode: res.statusCode,
            response: data,
            skipped: false,
            to: normalizedTo,
          });
        });
      })
      .on("error", (error) => {
        resolve({ success: false, skipped: false, message: error.message, to: normalizedTo });
      });
  });
};
