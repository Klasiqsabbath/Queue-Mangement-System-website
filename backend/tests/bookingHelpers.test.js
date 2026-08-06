import test from "node:test";
import assert from "node:assert/strict";
import { buildAppointmentBookingPayload, buildAppointmentQrPayload } from "../utils/bookingHelpers.js";

test("buildAppointmentQrPayload includes appointment details for scanning", () => {
  const payload = buildAppointmentQrPayload({
    appointmentId: "apt123",
    patientName: "Ada",
    doctorName: "Dr. Richard James",
    slotDate: "04_08_2026",
    slotTime: "10:00 AM",
    amount: 1,
  });

  assert.match(payload, /Ada/);
  assert.match(payload, /Dr\. Richard James/);
  assert.match(payload, /10:00 AM/);
  assert.match(payload, /apt123/);
});

test("buildAppointmentBookingPayload preserves booking details", () => {
  const payload = buildAppointmentBookingPayload({
    docId: "doc1",
    slotDate: "04_08_2026",
    slotTime: "10:00 AM",
    reason: "Checkup",
  });

  assert.equal(payload.docId, "doc1");
  assert.equal(payload.reason, "Checkup");
});
