import test from "node:test";
import assert from "node:assert/strict";
import { getBookingNotificationRecipients, resolveBookingEmail } from "../utils/emailService.js";

test("collects the user and configured notification addresses", () => {
  const recipients = getBookingNotificationRecipients(
    { email: "patient@clinic.com" },
    "atture@prescripto.com"
  );

  assert.deepEqual(recipients, ["patient@clinic.com", "atture@prescripto.com"]);
});

test("deduplicates overlapping recipients", () => {
  const recipients = getBookingNotificationRecipients(
    { email: "admin@example.com" },
    "admin@example.com"
  );

  assert.deepEqual(recipients, ["admin@example.com"]);
});

test("prefers the booking email entered by the user", () => {
  const email = resolveBookingEmail(
    { email: "patient@clinic.com" },
    "atture@company.com"
  );

  assert.equal(email, "patient@clinic.com");
});
