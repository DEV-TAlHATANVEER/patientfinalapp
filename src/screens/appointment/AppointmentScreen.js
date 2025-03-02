import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db, auth, updateAppointmentStatus } from '../../services/firebase';
import { theme } from '../../config/theme';

// Utility function to format Firestore timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp || !timestamp.seconds) return 'N/A';
  const dateObj = new Date(timestamp.seconds * 1000);
  return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();
};

const AppointmentScreen = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [selectedTab, setSelectedTab] = useState('Upcoming'); // Tabs: 'Upcoming', 'Expired', 'Completed', 'Canceled'
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAppointmentsForPatient();
  }, []);

  const fetchAppointmentsForPatient = async () => {
    setRefreshing(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setRefreshing(false);
        return;
      }

      // Fetch all appointments for this patient
      const q = query(
        collection(db, 'appointments'),
        where('patientId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const fetchedAppointments = snapshot.docs.map((apptDoc) => ({
        id: apptDoc.id,
        ...apptDoc.data(),
      }));

      // For each appointment, fetch the corresponding doctor data (if doctorId exists)
      const appointmentsWithDoctorData = await Promise.all(
        fetchedAppointments.map(async (appt) => {
          if (appt.doctorId) {
            try {
              const docRef = doc(db, 'doctors', appt.doctorId);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                return { ...appt, doctor: docSnap.data() };
              }
            } catch (error) {
              console.error('Error fetching doctor data:', error);
            }
          }
          return appt;
        })
      );

      setAppointments(appointmentsWithDoctorData);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter appointments based on selectedTab
  const getFilteredAppointments = () => {
    if (selectedTab === 'Upcoming') {
      return appointments.filter(
        (appt) =>
          appt.status === 'in-progress' ||
          appt.status === 'confirmed' ||
          appt.status === 'upcoming'
      );
    } else if (selectedTab === 'Expired') {
      return appointments.filter((appt) => appt.status === 'expired');
    } else if (selectedTab === 'Completed') {
      return appointments.filter((appt) => appt.status === 'completed');
    } else if (selectedTab === 'Canceled') {
      return appointments.filter((appt) => appt.status === 'canceled');
    }
    return [];
  };

  // Cancel appointment logic
  const handleCancelAppointment = async (appointmentId) => {
    try {
      await updateAppointmentStatus(appointmentId, 'canceled');
      Alert.alert('Success', 'Appointment has been canceled.');
      fetchAppointmentsForPatient();
    } catch (error) {
      Alert.alert('Error', 'Could not cancel the appointment. Please try again.');
    }
  };

  const handleConfirmed = (appointment) => {
    navigation.navigate('AppointmentDetail', { appointment });
  };

  const handleConfirmPayment = (appointment) => {
    if (!appointment || !appointment.price) {
      Alert.alert('Error', 'No payment amount provided for this appointment.');
      return;
    }
    
    const { id, doctor, price, doctorId, type, date } = appointment;
    navigation.navigate('PaymentMethod', {
      appointmentId: id,
      doctor,
      price,
      doctorId,
      type,
      date,
      location: appointment.location,
    });
  };

  const renderAppointmentItem = ({ item }) => {
    const handleAppointmentPress = () => {
      navigation.navigate('AppointmentDetail', { appointment: item });
    };

    const { id, date, status, doctor } = item;
    const doctorName = doctor?.fullName || 'Unknown Doctor';
    const doctorSpecialist = doctor?.specialist || 'No Specialty';
    const doctorImage = doctor?.profilePicture;
    const showConfirmPayment = status === 'in-progress';

    let statusLabel = status;
    if (status === 'confirmed') {
      statusLabel = (
        <Text style={styles.statusConfirmedText}>
          <Text style={styles.greenDot}>●</Text> Confirmed
        </Text>
      );
    } else if (status === 'in-progress') {
      statusLabel = (
        <Text style={styles.statusPendingText}>
          <Text style={styles.yellowDot}>●</Text> Pending Payment
        </Text>
      );
    } else {
      statusLabel = <Text style={styles.statusText}>{status}</Text>;
    }

    return (
      <TouchableOpacity onPress={handleAppointmentPress} style={styles.appointmentCard}>
        <View style={styles.cardHeader}>
          {doctorImage ? (
            <Image source={{ uri: doctorImage }} style={styles.doctorImage} />
          ) : (
            <View style={[styles.doctorImage, styles.fallbackImage]}>
              <Text style={styles.fallbackImageText}>No Image</Text>
            </View>
          )}
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{doctorName}</Text>
            <Text style={styles.specialist}>{doctorSpecialist}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.dateText}>{formatTimestamp(date)}</Text>
          {statusLabel}
        </View>
        {selectedTab === 'Upcoming' && (
          <View style={styles.buttonRow}>
            {status === 'in-progress' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleCancelAppointment(id)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.rescheduleButton]}
              onPress={() =>
                showConfirmPayment
                  ? handleConfirmPayment(item)
                  : handleConfirmed(item)
              }
            >
              <Text style={styles.rescheduleButtonText}>
                {showConfirmPayment ? 'Confirm Payment' : 'Confirmed'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>Schedule</Text>
      </View>
      {/* Chip Wrapper with reduced bottom margin */}
      <View style={styles.chipWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContainer}
        >
          {['Upcoming', 'Expired', 'Completed', 'Canceled'].map((tab) => {
            const isActive = selectedTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabChip, isActive && styles.activeTabChip]}
                onPress={() => setSelectedTab(tab)}
              >
                <Text style={[styles.tabChipText, isActive && styles.activeTabChipText]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      <FlatList
        data={getFilteredAppointments()}
        keyExtractor={(item) => item.id}
        renderItem={renderAppointmentItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No {selectedTab} appointments found.
          </Text>
        }
        refreshing={refreshing}
        onRefresh={fetchAppointmentsForPatient}
      />
    </View>
  );
};

export default AppointmentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C1A2B',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  screenTitle: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  // Chip wrapper with reduced bottom margin
  chipWrapper: {
    marginBottom: 10,
  },
  // Scrollable Tabs (Chips)
  tabsScrollContainer: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  tabChip: {
    marginRight: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#E3E9F0',
    borderRadius: 20,
  },
  activeTabChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
  },
  tabChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  activeTabChipText: {
    fontWeight: '700',
  },
  // List
  listContent: {
    paddingBottom: 20,
  },
  emptyText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#fff',
  },
  // Appointment Card
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 3,
  },
  // Card Header (Doctor Info)
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  doctorImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ccc',
    marginRight: 12,
  },
  fallbackImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackImageText: {
    fontSize: 10,
    color: '#666',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  specialist: {
    fontSize: 14,
    color: '#666',
  },
  // Date/Status row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateText: {
    fontSize: 14,
    color: '#000',
  },
  statusText: {
    fontSize: 14,
    color: '#000',
    textTransform: 'capitalize',
  },
  statusConfirmedText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  greenDot: {
    color: 'green',
    fontWeight: '900',
  },
  statusPendingText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  yellowDot: {
    color: '#FFD700',
    fontWeight: '900',
  },
  // Buttons
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 0.48,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E3E9F0',
  },
  cancelButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  rescheduleButton: {
    backgroundColor: '#000',
  },
  rescheduleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
