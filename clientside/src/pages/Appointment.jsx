import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import RelatedDoctors from "../components/RelatedDoctors";
import { toast } from "react-toastify";
import axios from "axios";

const Appointment = () => {
  const { docId } = useParams();
  const { doctors, currencySymbol, backendUrl, token, getDoctorsData, userData } =
    useContext(AppContext);
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const navigate = useNavigate();

  const [docInfo, setDocInfo] = useState(null);
  const [docSlots, setDocSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");

  const cleanPhoneInput = (value) => value.replace(/\D/g, "");
  const normalizePhone = (value) => cleanPhoneInput(value).replace(/^0+/, "");

  const fetchDocInfo = async () => {
    const docInfo = doctors.find((doc) => doc._id === docId);
    setDocInfo(docInfo);
  };

  const getAvailableSlots = async () => {
    if (!docInfo) return; // Don't proceed if docInfo is not loaded yet

    const newDocSlots = [];

    // getting current date
    let today = new Date();

    for (let i = 0; i < 7; i++) {
      // getting date with index
      let currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);

      // setting end time of the date with index
      let endTime = new Date();
      endTime.setDate(today.getDate() + i);
      endTime.setHours(21, 0, 0, 0);

      // setting hours
      if (today.getDate() === currentDate.getDate()) {
        currentDate.setHours(
          currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10
        );
        currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0);
      } else {
        currentDate.setHours(10);
        currentDate.setMinutes(0);
      }

      let timeSlots = [];

      while (currentDate < endTime) {
        let formattedTime = currentDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        let day = currentDate.getDate();
        let month = currentDate.getMonth() + 1;
        let year = currentDate.getFullYear();

        const slotDate = day + "_" + month + "_" + year;
        const slotTime = formattedTime;

        // Safe access to slots_booked with fallback to empty object
        const slotsBooked = docInfo.slots_booked || {};
        const isSlotAvailable =
          slotsBooked[slotDate] && slotsBooked[slotDate].includes(slotTime)
            ? false
            : true;

        if (isSlotAvailable) {
          // add slot to array
          timeSlots.push({
            datetime: new Date(currentDate),
            time: formattedTime,
          });
        }

        // Increment current time by 30 minutes
        currentDate.setMinutes(currentDate.getMinutes() + 30);
      }

      if (timeSlots.length > 0) {
        newDocSlots.push(timeSlots);
      }
    }

    setDocSlots(newDocSlots);
    setSlotIndex(0);
  };

  const bookAppointment = async () => {
    if (!token) {
      toast.warn("Login to book appointment");
      return navigate("/login");
    }

    if (!selectedSlot) {
      toast.warn("Please select a time slot");
      return;
    }

    if (!name.trim()) {
      toast.warn("Please enter your name");
      return;
    }

    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone.trim()) {
      toast.warn("Please enter your phone number");
      return;
    }

    if (!reason.trim()) {
      toast.warn("Please enter reason for visit");
      return;
    }

    const confirmed = window.confirm(
      `Confirm booking with ${docInfo?.name || "this doctor"} for ${selectedSlot.time}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const date = selectedSlot.datetime;

      let day = date.getDate();
      let month = date.getMonth() + 1;
      let year = date.getFullYear();

      const slotDate = day + "_" + month + "_" + year;

      const { data } = await axios.post(
        backendUrl + "/api/user/book-appointment",
        {
          docId,
          slotDate,
          slotTime: selectedSlot.time,
          reason,
          name,
          phone: normalizedPhone,
        },
        {
          headers: {
            token,
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (data.success) {
        toast.success(data.message);
        getDoctorsData();
        const appointmentId = data.appointment?._id || data.appointment?.id;
        if (appointmentId) {
          navigate(`/booking-ticket/${appointmentId}`, {
            state: { appointment: data.appointment },
          });
        } else {
          navigate("/my-appointments");
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    setSelectedSlot(null);
    setSlotTime("");
    setSlotIndex(0);
    fetchDocInfo();
  }, [doctors, docId]);

  useEffect(() => {
    if (userData) {
      setName((prev) => prev || userData.name || "");
      setPhone((prev) => prev || userData.phone || "");
    }
  }, [userData]);

  useEffect(() => {
    // Load doctors data on component mount
    if (doctors.length === 0) {
      getDoctorsData();
    }
  }, []);

  useEffect(() => {
    getAvailableSlots();
  }, [docInfo]);

  useEffect(() => {
    console.log(docSlots);
  }, [docSlots]);

  return (
    docInfo && (
      <div>
        {/* -------------------- Doctor Details -------------------- */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <img
              className="bg-primary w-full sm:max-w-72 rounded-lg"
              src={docInfo.image}
              alt=""
            />
          </div>

          <div className="flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0">
            {/* -------------------- Doc Info : name, degree, experience -------------------- */}
            <p className="flex items-center gap-2 text-2xl font-medium text-gray-900">
              {docInfo.name}
              <img className="w-5" src={assets.verified_icon} alt="" />
            </p>
            <div className="flex items-center gap-2 text-sm mt-1 text-gray-600">
              <p>
                {docInfo.degree} - {docInfo.speciality}
              </p>
              <button className="py-0.5 px-2 border text-xs rounded-full">
                {docInfo.experience}
              </button>
            </div>

            {/* -------------------- Doctor About -------------------- */}
            <div>
              <p className="flex items-center gap-1 text-sm font-medium text-gray-600 mt-3">
                About <img src={assets.info_icon} alt="" />
              </p>
              <p className="text-sm text-gray-500 max-w-[700px] mt-1">
                {docInfo.about}
              </p>
            </div>
            <p className="text-gray-500 font-medium mt-4">
              Appointment fee:{" "}
              <span className="text-gray-600">
                {currencySymbol}
                {docInfo.fees}
              </span>
            </p>
          </div>
        </div>

        {/* -------------------- Booking Slots -------------------- */}
        <div className="sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700">
          <p>Booking slots</p>
          <div className="flex gap-3 items-center w-full overflow-x-scroll mt-4">
            {docSlots.length &&
              docSlots.map((item, index) => (
                <div
                  onClick={() => setSlotIndex(index)}
                  className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${
                    slotIndex === index
                      ? "bg-primary text-white"
                      : "border border-gray-200"
                  }`}
                  key={index}
                >
                  <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                  <p>{item[0] && item[0].datetime.getDate()}</p>
                </div>
              ))}
          </div>

          <div className="flex items-center gap-3 w-full overflow-x-scroll mt-4">
            {docSlots.length &&
              docSlots[slotIndex].map((item, index) => (
                <p
                  onClick={() => {
                    setSelectedSlot(item);
                    setSlotTime(item.time);
                  }}
                  className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${
                    item.time === slotTime
                      ? "bg-primary text-white"
                      : "text-gray-400 border border-gray-300"
                  }`}
                  key={index}
                >
                  {item.time.toLowerCase()}
                </p>
              ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="border rounded-full p-4 bg-slate-50">
              <p className="text-sm font-medium text-gray-600 mb-2">Your name</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full border border-gray-300 rounded-full px-4 py-3 text-sm text-gray-700"
                type="text"
              />
            </div>
            <div className="border rounded-full p-4 bg-slate-50">
              <p className="text-sm font-medium text-gray-600 mb-2">Phone number</p>
              <input
                value={phone}
                onChange={(e) => setPhone(cleanPhoneInput(e.target.value))}
                placeholder="Enter phone number"
                className="w-full border border-gray-300 rounded-full px-4 py-3 text-sm text-gray-700"
                type="tel"
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="mt-6 border rounded-full p-4 bg-slate-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What is wrong? (message for the doctor)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter symptoms or reason for the visit"
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm text-gray-700"
              rows={4}
            />
          </div>

          <button
            onClick={bookAppointment}
            disabled={
              !selectedSlot ||
              !name.trim() ||
              !normalizePhone(phone).trim() ||
              !reason.trim()
            }
            className={`text-sm font-light px-14 py-3 rounded-full my-6 transition ${
              selectedSlot && name.trim() && normalizePhone(phone).trim() && reason.trim()
                ? "bg-primary text-white hover:bg-primary-dark"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            Book an appointment
          </button>
        </div>

        {/* -------------------- Listing Related Doctors -------------------- */}
        <RelatedDoctors docId={docId} speciality={docInfo.speciality} />
      </div>
    )
  );
};

export default Appointment;
