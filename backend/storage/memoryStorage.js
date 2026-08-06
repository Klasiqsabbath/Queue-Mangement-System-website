import bcrypt from 'bcrypt';

// In-memory storage for development when MongoDB is not available
let users = [];
let doctors = [];
let appointments = [];
let userIdCounter = 1;
let doctorIdCounter = 1;
let appointmentIdCounter = 1;

// Helper function to generate IDs
const generateId = (type) => {
  switch (type) {
    case 'user':
      return `user${userIdCounter++}`;
    case 'doctor':
      return `doc${doctorIdCounter++}`;
    case 'appointment':
      return `apt${appointmentIdCounter++}`;
    default:
      return `id${Date.now()}`;
  }
};

// Pre-hashed passwords for test users (all set to "password123" hashed)
// These are bcrypt hashes of "password123" 
const TEST_PASSWORD_HASH = '$2b$10$nOQmGKJl5FN8Gb5RB.MbuuUPHaLz5.7MKkdh5nRVX3rkAZb8m6.A6';

// Static doctors data for demo
const staticDoctors = [
  {
    _id: 'doc1',
    name: 'Dr. Richard James',
    email: 'richard.james@prescripto.com',
    image: 'doc1.png',
    speciality: 'General physician',
    degree: 'MBBS',
    experience: '4 Years',
    about: 'Dr. James has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
    fees: 50,
    address: {
        line1: '17th Cross, Richmond',
        line2: 'Circle, Ring Road, London'
    },
    available: true,
    slots_booked: {}
  },
  {
    _id: 'doc2',
    name: 'Dr. Emily Larson',
    email: 'emily.larson@prescripto.com',
    image: 'doc2.png',
    speciality: 'Gynecologist',
    degree: 'MBBS',
    experience: '3 Years',
    about: 'Dr. Larson has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
    fees: 60,
    address: {
        line1: '27th Cross, Richmond',
        line2: 'Circle, Ring Road, London'
    },
    available: true,
    slots_booked: {}
  },
  {
    _id: 'doc3',
    name: 'Dr. Sarah Patel',
    email: 'sarah.patel@prescripto.com',
    image: 'doc3.png',
    speciality: 'Dermatologist',
    degree: 'MBBS',
    experience: '1 Years',
    about: 'Dr. Patel has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
    fees: 1,
    address: {
        line1: '37th Cross, Richmond',
        line2: 'Circle, Ring Road, London'
    },
    available: true,
    slots_booked: {}
  },
  {
    _id: 'doc4',
    name: 'Dr. Christopher Lee',
    email: 'christopher.lee@prescripto.com',
    image: 'doc4.png',
    speciality: 'Pediatricians',
    degree: 'MBBS',
    experience: '2 Years',
    about: 'Dr. Lee has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
    fees: 40,
    address: {
        line1: '47th Cross, Richmond',
        line2: 'Circle, Ring Road, London'
    },
    available: true,
    slots_booked: {}
  },
  {
    _id: 'doc5',
    name: 'Dr. Jennifer Garcia',
    email: 'jennifer.garcia@prescripto.com',
    image: 'doc5.png',
    speciality: 'Neurologist',
    degree: 'MBBS',
    experience: '4 Years',
    about: 'Dr. Garcia has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
    fees: 50,
    address: {
        line1: '57th Cross, Richmond',
        line2: 'Circle, Ring Road, London'
    },
    available: true,
    slots_booked: {}
  }
];

// Static test users for demo
const staticTestUsers = [
  {
    _id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
    password: TEST_PASSWORD_HASH, // password123
    date: new Date()
  },
  {
    _id: 'user2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: TEST_PASSWORD_HASH, // password123
    date: new Date()
  }
];

// Add doctors with passwords for login
const staticDoctorsWithPasswords = staticDoctors.map(doc => ({
  ...doc,
  password: TEST_PASSWORD_HASH, // password123
  date: new Date()
}));

// Initialize doctors with static data
doctors = [...staticDoctorsWithPasswords];
// Initialize users with test data
users = [...staticTestUsers];
doctorIdCounter = 6; // Start from 6 since we have 5 static doctors
userIdCounter = 3; // Start from 3 since we have 2 test users

// Memory storage interface
export const memoryStorage = {
  // User operations
  users: {
    create: (userData) => {
      const newUser = { _id: generateId('user'), ...userData, date: Date.now() };
      users.push(newUser);
      return newUser;
    },
    findOne: (query) => {
      return users.find(user => {
        if (query.email) return user.email === query.email;
        if (query._id) return user._id === query._id;
        return false;
      });
    },
    findById: (id) => users.find(user => user._id === id),
    findByIdAndUpdate: (id, updateData) => {
      const userIndex = users.findIndex(user => user._id === id);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updateData };
        return users[userIndex];
      }
      return null;
    },
    find: () => users
  },

  // Doctor operations
  doctors: {
    create: (doctorData) => {
      const newDoctor = { 
        _id: generateId('doctor'), 
        ...doctorData, 
        date: Date.now(),
        slots_booked: {}
      };
      doctors.push(newDoctor);
      return newDoctor;
    },
    findOne: (query) => {
      return doctors.find(doctor => {
        if (query.email) return doctor.email === query.email;
        if (query._id) return doctor._id === query._id;
        return false;
      });
    },
    findById: (id) => doctors.find(doctor => doctor._id === id),
    findByIdAndUpdate: (id, updateData) => {
      const doctorIndex = doctors.findIndex(doctor => doctor._id === id);
      if (doctorIndex !== -1) {
        doctors[doctorIndex] = { ...doctors[doctorIndex], ...updateData };
        return doctors[doctorIndex];
      }
      return null;
    },
    find: () => doctors
  },

  // Appointment operations
  appointments: {
    create: (appointmentData) => {
      const newAppointment = { _id: generateId('appointment'), ...appointmentData };
      appointments.push(newAppointment);
      return newAppointment;
    },
    findById: (id) => appointments.find(appointment => appointment._id === id),
    find: (query = {}) => {
      if (Object.keys(query).length === 0) return appointments;
      
      return appointments.filter(appointment => {
        if (query.userId) return appointment.userId === query.userId;
        if (query.docId) return appointment.docId === query.docId;
        return true;
      });
    },
    findByIdAndUpdate: (id, updateData) => {
      const appointmentIndex = appointments.findIndex(appointment => appointment._id === id);
      if (appointmentIndex !== -1) {
        appointments[appointmentIndex] = { ...appointments[appointmentIndex], ...updateData };
        return appointments[appointmentIndex];
      }
      return null;
    },
    findByIdAndDelete: (id) => {
      const appointmentIndex = appointments.findIndex(appointment => appointment._id === id);
      if (appointmentIndex !== -1) {
        const [removed] = appointments.splice(appointmentIndex, 1);
        return removed;
      }
      return null;
    }
  }
};

export default memoryStorage;