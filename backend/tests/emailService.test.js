import test from "node:test";
import assert from "node:assert/strict";
import { getBookingNotificationRecipients } from "../utils/emailService.js";

test("collects the user and configured notification addresses", () => {
  const recipients = getBookingNotificationRecipients(
    { email: "user@example.com" },
    "admin@example.com"
  );

  assert.deepEqual(recipients, ["user@example.com", "admin@example.com"]);
});

test("deduplicates overlapping recipients", () => {
  const recipients = getBookingNotificationRecipients(
    { email: "admin@example.com" },
    "admin@example.com"
  );

  assert.deepEqual(recipients, ["admin@example.com"]);
});
