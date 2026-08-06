const buildAppointmentBookingPayload = (bookingData = {}) => {
  const {
    docId,
    slotDate,
    slotTime,
    reason,
    name,
    phone,
    email,
    nhisDetails,
  } = bookingData;

  return {
    docId,
    slotDate,
    slotTime,
    reason: reason || "",
    name: name || "",
    phone: phone || "",
    email: email || "",
    nhisDetails: nhisDetails || null,
  };
};

const buildAppointmentQrPayload = (appointmentData = {}) => {
  const {
    appointmentId,
    patientName = "",
    doctorName = "",
    slotDate = "",
    slotTime = "",
    amount = 1,
  } = appointmentData;

  return JSON.stringify({
    appointmentId,
    patientName,
    doctorName,
    slotDate,
    slotTime,
    amount: Number(amount || 1),
    currency: "GHS",
    type: "appointment-ticket",
  });
};

export { buildAppointmentBookingPayload, buildAppointmentQrPayload };
