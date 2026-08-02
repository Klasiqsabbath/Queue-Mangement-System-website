const buildAppointmentBookingPayload = (bookingData = {}) => {
  const {
    docId,
    slotDate,
    slotTime,
    reason,
    name,
    phone,
    nhisDetails,
  } = bookingData;

  return {
    docId,
    slotDate,
    slotTime,
    reason: reason || "",
    name: name || "",
    phone: phone || "",
    nhisDetails: nhisDetails || null,
  };
};

export { buildAppointmentBookingPayload };
