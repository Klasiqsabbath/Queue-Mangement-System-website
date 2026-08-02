import test from "node:test";
import assert from "node:assert/strict";
import { buildAppointmentBookingPayload } from "../utils/bookingHelpers.js";

test("buildAppointmentBookingPayload keeps NHIS details in the saved appointment payload", () => {
  const payload = buildAppointmentBookingPayload({
    docId: "doc123",
    slotDate: "1_8_2026",
    slotTime: "10:00",
    reason: "Headache",
    name: "Ama Boateng",
    phone: "0541234567",
    nhisDetails: {
      number: "NHIS123",
      cardNumber: "CARD123",
      memberName: "Ama Boateng",
      provider: "KATH",
    },
  });

  assert.equal(payload.reason, "Headache");
  assert.deepEqual(payload.nhisDetails, {
    number: "NHIS123",
    cardNumber: "CARD123",
    memberName: "Ama Boateng",
    provider: "KATH",
  });
});
