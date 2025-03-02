import { initializeApp } from 'firebase/app';
import { 

  initializeAuth, 
  getReactNativePersistence,
  sendEmailVerification,
  applyActionCode
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc,
  onSnapshot,
  orderBy,
  deleteDoc
} from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCMJiGy4rTEAA6YQfvrfS_QtI8XTbw0J0A",
  authDomain: "finalhealthhub.firebaseapp.com",
  projectId: "finalhealthhub",
  storageBucket: "finalhealthhub.firebasestorage.app",
  messagingSenderId: "448193974966",
  appId: "1:448193974966:web:815ebc759c48bc9df3cc17",
  measurementId: "G-Z74W59QXQM"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Initialize Firestore
const db = getFirestore(app);

// ========== AUTHENTICATION FUNCTIONS ==========

export const sendVerificationEmail = async (user) => {
  try {
    await sendEmailVerification(user);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

export const verifyEmail = async (actionCode) => {
  try {
    await applyActionCode(auth, actionCode);
    return true;
  } catch (error) {
    console.error('Error verifying email:', error);
    throw error;
  }
};

export const isEmailVerified = (user) => {
  return user.emailVerified;
};

// ========== PATIENT DATA FUNCTIONS ==========

export const storePatientData = async (userId, patientData) => {
  try {
    const patientRef = doc(db, 'patients', userId);
    await setDoc(patientRef, {
      ...patientData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      userId: userId,
    });
    return true;
  } catch (error) {
    console.error('Error storing patient data:', error);
    throw error;
  }
};

export const fetchPatientProfile = async (userId) => {
  try {
    const patientRef = doc(db, 'patients', userId);
    const patientDoc = await getDoc(patientRef);
    return patientDoc.exists() ? patientDoc.data() : null;
  } catch (error) {
    console.error('Error fetching patient data:', error);
    throw error;
  }
};

export const updatePatientData = async (userId, patientData) => {
  try {
    const patientRef = doc(db, 'patients', userId);
    await updateDoc(patientRef, {
      ...patientData,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error updating patient data:', error);
    throw error;
  }
};

// Subscribe to patient profile updates (real‑time listener)
export const subscribeToPatientProfile = (userId, callback) => {
  const patientRef = doc(db, 'patients', userId);
  return onSnapshot(patientRef, (docSnap) => {
    callback(docSnap.exists() ? docSnap.data() : null);
  });
};

// ========== DOCTOR DATA FUNCTIONS ==========

export const fetchApprovedDoctors = async () => {
  try {
    const doctorsCollectionRef = collection(db, 'doctors');
    const approvedDoctorsQuery = query(doctorsCollectionRef, where('status', '==', 'approved'));
    
    const querySnapshot = await getDocs(approvedDoctorsQuery);
    const doctorsList = [];

    querySnapshot.forEach((docSnap) => {
      doctorsList.push({
        id: docSnap.id,
        ...docSnap.data(),
      });
    });

    return doctorsList;
  } catch (error) {
    console.error('Error fetching approved doctors:', error);
    throw error;
  }
};

export const fetchDoctorById = async (doctorId) => {
  try {
    const doctorRef = doc(db, 'doctors', doctorId);
    const docSnap = await getDoc(doctorRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error('Error fetching doctor by ID:', error);
    throw error;
  }
};

// ========== APPOINTMENT FUNCTIONS ==========

export const createAppointment = async (appointmentData) => {
  try {
    const appointmentsRef = collection(db, 'appointments');
    const newAppointmentRef = doc(appointmentsRef);
    const appointmentId = newAppointmentRef.id;
    
    const appointment = {
      status: 'in-progress',
      doctorId: appointmentData.doctorId,
      patientId: appointmentData.patientId,
      date: appointmentData.date,
      type: appointmentData.type,
      channelName: appointmentId,
      slotPortion: appointmentData.slotPortion || "",
      slotId: appointmentData.slotId || null, // store slotId for later reference
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      location: appointmentData.type === 'physical' ? appointmentData.location : 'online',
      price: appointmentData.price || 0, // price is now passed
    };
    
    await setDoc(newAppointmentRef, appointment);
    return { appointmentId, ...appointment };
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
};
export const updateAppointmentStatus = async (appointmentId, newstatus) => {
  try {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    await updateDoc(appointmentRef, {
      status:newstatus,
      updatedAt: serverTimestamp(),
      });
    return true;
  } catch (error) {
    console.error('Error updating appointment status:', error);
    throw error;
  }
};


export const fetchDoctorAvailabilities = async (doctorId) => {
  try {
    const availabilitiesRef = collection(db, `doctors/${doctorId}/availabilities`);
    const querySnapshot = await getDocs(availabilitiesRef);

    const availabilitiesList = [];
    querySnapshot.forEach((docSnap) => {
      availabilitiesList.push({
        id: docSnap.id,
        ...docSnap.data(),
      });
    });

    return availabilitiesList;
  } catch (error) {
    console.error('Error fetching doctor availabilities:', error);
    throw error;
  }
};

// Fetch booked appointments for a given patient (returns an array of { slotId, time })
export const fetchBookedAppointments = async (patientId) => {
  console.log('Fetching booked appointments for patient:', patientId);
  
  try {
    const appointmentsRef = collection(db, 'appointments');
    const q = query(appointmentsRef, where('patientId', '==', patientId));
    const querySnapshot = await getDocs(q);
   
    
    const appointments = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();

      
      if (data.slotId && data.date && data.status) {
        appointments.push({
          slotId: data.slotId,
          // Convert Firestore Timestamp to JavaScript Date if needed
          time: data.date.toDate ? data.date.toDate() : new Date(data.date),
          status: data.status,
          appointmentId: docSnap.id,
        });
      }
    });
   
    console.log('Booked appointments:', appointments);
    
    return appointments;
  } catch (error) {
    console.error('Error fetching booked appointments:', error);
    throw error;
  }
};
export const fetchConfirmedAppointments = async (doctorId) => {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('doctorId', '==', doctorId),
      where('status', '==', 'confirmed')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      appointmentId: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching confirmed appointments:", error);
    throw error;
  }
};
// ========== PAYMENT FUNCTIONS ==========

export const savePaymentMethod = async (userId, paymentMethodId, amount, doctorId, billingEmail,appointmentid) => {
  try {
    await setDoc(
      doc(db, 'payments', appointmentid),
      {
        patientId: userId,
        paymentMethodId,
        amount,      // Amount in cents (or as provided)
        doctorId,      // Doctor details (object or string)
        billingEmail, // Current user's email for billing
        appointmentid, // Appointment ID
      },
   
    );
    console.log('Payment method saved to Firebase');
  } catch (error) {
    console.error('Error saving payment method:', error);
  }
};

export const fetchVideoAppointments = async (userId) => {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('patientId', '==', userId),
      where('status', '==', 'confirmed'),
      where('type', '==', 'online')
    );

    const snapshot = await getDocs(q);
    return await Promise.all(
      snapshot.docs.map(async (appointmentDoc) => {
        const data = appointmentDoc.data();
        // Now using the imported "doc" function without conflict
        const doctorSnap = await getDoc(doc(db, 'doctors', data.doctorId));
        return {
          id: appointmentDoc.id,
          ...data,
          doctor: doctorSnap.data(),
          date: data.date.toDate()
        };
      })
    );
  } catch (error) {
    console.error('Error fetching video appointments:', error);
    return [];
  }
};
export const fetchApprovedLabs = async () => {
  try {
    const labsRef = collection(db, 'labs');
    const q = query(labsRef, where('status', '==', 'approved'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching labs:", error);
    throw error;
  }
};

// Fetch lab tests by labId
export const fetchLabTests = async (labId) => {
  try {
    const testsRef = collection(db, 'labTests');
    const q = query(testsRef, where('labId', '==', labId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching lab tests:", error);
    throw error;
  }
};
export const saveLabPayment = async (
  patientId,
  labId,
  testid,
  testname,
  labName,
  category,
  price,
  status,
  paymentStatus
) => {
  try {
    // Create a new document with an auto-generated ID in "labreports"
    const labReportRef = doc(collection(db, 'labreports'));
    const labReportId = labReportRef.id;
    await setDoc(labReportRef, {
      labReportId,
      labId,
      testid,
      testname,
      name: labName,
      category,
      price,
      patientid: patientId,
      status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      paymentStatus
    });
    console.log('Lab test and  payment saved to Firebase');
    return labReportId;
  } catch (error) {
    console.error('Error saving lab payment:', error);
    throw error;
  }
};
export const updateLabTestStatus = async (labTestId, newStatus) => {
  try {
    console.log(`Updating lab test ${labTestId} to status "${newStatus}"...`);
    
    const labTestRef = doc(db, 'labTests', labTestId);
    await updateDoc(labTestRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
    console.log(`Lab test ${labTestId} updated to status "${newStatus}".`);
    return true;
  } catch (error) {
    console.error('Error updating lab test status:', error);
    throw error;
  }
};

export const fetchLabReports = async (patientId) => {
  try {
    const reportsRef = collection(db, 'labreports');
    const q = query(reportsRef, where('patientid', '==', patientId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching lab reports:", error);
    throw error;
  }
};

export const fetchBloodBanks = async () => {
  try {
    const bloodBanksRef = collection(db, 'bloodbanks');
    const snapshot = await getDocs(bloodBanksRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching blood banks:", error);
    throw error;
  }
};

// Medicine History Functions
export const addMedicineHistory = async (userId, medicineData) => {
  try {
    const medicineRef = doc(collection(db, 'medicineHistory'));
    await setDoc(medicineRef, {
      userId,
      ...medicineData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return medicineRef.id;
  } catch (error) {
    console.error('Error adding medicine history:', error);
    throw error;
  }
};

export const updateMedicineHistory = async (medicineId, medicineData) => {
  try {
    const medicineRef = doc(db, 'medicineHistory', medicineId);
    await updateDoc(medicineRef, {
      ...medicineData,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error updating medicine history:', error);
    throw error;
  }
};

export const fetchUserMedicines = async (userId) => {
  try {
    const medicinesRef = collection(db, 'medicineHistory');
    const q = query(
      medicinesRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching medicines:', error);
    throw error;
  }
};

export const deleteMedicineHistory = async (medicineId) => {
  try {
    await deleteDoc(doc(db, 'medicineHistory', medicineId));
    return true;
  } catch (error) {
    console.error('Error deleting medicine:', error);
    throw error;
  }
};

// Export main references
export { auth, db };
