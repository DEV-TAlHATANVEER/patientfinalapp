import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  SafeAreaView,
  Alert,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  fetchDoctorById,
  fetchDoctorAvailabilities,
  createAppointment,
  fetchBookedAppointments, // pending appointments for current user
  fetchConfirmedAppointments, // new function to fetch confirmed appointments for all users
  subscribeToPatientProfile,
  auth,
  updateAppointmentStatus,
} from '../../services/firebase';

const DoctorDetailScreen = ({ route, navigation }) => {
  const { doctorId } = route.params;

  const [doctor, setDoctor] = useState(null);
  const [availabilities, setAvailabilities] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  // selectedSlot holds an object: { slotId, time, duration, location, price }
  const [selectedSlot, setSelectedSlot] = useState(null);
  // Mode selector state: "online" or "physical"
  const [selectedMode, setSelectedMode] = useState('online');
  // Pending appointments booked by the current user (e.g. pending bookings)
  const [pendingAppointments, setPendingAppointments] = useState([]);
  // Confirmed appointments for this doctor (from any user)
  const [confirmedAppointments, setConfirmedAppointments] = useState([]);
  // Patient Profile state
  const [patientProfile, setPatientProfile] = useState(null);
  // Refreshing state for pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // Subscribe to patient profile changes for real-time updates
  useEffect(() => {
    const patientId = auth.currentUser ? auth.currentUser.uid : null;
    if (patientId) {
      const unsubscribe = subscribeToPatientProfile(patientId, (profile) => {
        setPatientProfile(profile);
      });
      return () => unsubscribe();
    }
  }, []);

  // Fetch doctor info and availabilities
  const getDoctorData = async () => {
    try {
      const doctorData = await fetchDoctorById(doctorId);
      setDoctor(doctorData);

      const slots = await fetchDoctorAvailabilities(doctorId);
      setAvailabilities(slots);

      if (slots.length > 0) {
        const grouped = groupAvailabilitiesByDate(slots);
        const firstDate = Object.keys(grouped)[0];
        setSelectedDate(firstDate);
      }
    } catch (error) {
      console.error('Error fetching doctor data:', error);
    }
  };

  // Load all necessary data: doctor details, pending appointments (current user) and confirmed appointments (all users)
  const loadData = async () => {
    try {
      // Fetch confirmed appointments for this doctor (for all users)
      const confirmed = await fetchConfirmedAppointments(doctorId);
      setConfirmedAppointments(confirmed);
    } catch (error) {
      console.error('Error fetching confirmed appointments:', error);
    }

    if (auth.currentUser) {
      const patientId = auth.currentUser.uid;
      try {
        const pending = await fetchBookedAppointments(patientId);
        setPendingAppointments(pending);
      } catch (error) {
        console.error('Error fetching pending appointments:', error);
      }
    }
    await getDoctorData();
  };

  // Initial data fetch
  useEffect(() => {
    loadData();
  }, [doctorId]);

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Group availabilities by date (using slot.date)
  const groupAvailabilitiesByDate = (allSlots) => {
    return allSlots.reduce((acc, slot) => {
      const dateKey = slot.date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(slot);
      return acc;
    }, {});
  };

  // Generate discrete time slots from isoStart to isoEnd using slotDuration (in minutes)
  const generateTimeSlots = (isoStart, isoEnd, slotDuration) => {
    const start = new Date(isoStart);
    const end = new Date(isoEnd);
    let current = start.getTime();
    const endMs = end.getTime();
    const slots = [];
    while (current <= endMs) {
      slots.push(new Date(current));
      current += slotDuration * 60 * 1000;
    }
    return slots;
  };

  // Format a Date object to "h:mm AM/PM"
  const formatMinutesTo12Hour = (dateObj) => {
    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    let suffix = 'AM';
    if (hours === 0) {
      hours = 12;
    } else if (hours === 12) {
      suffix = 'PM';
    } else if (hours > 12) {
      hours -= 12;
      suffix = 'PM';
    }
    const paddedMins = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${paddedMins} ${suffix}`;
  };

  // Helper: Get the booking object for a given slot and time.
  // First check if a confirmed appointment (from any user) exists.
  // If not, then check if a pending appointment exists for the current user.
  const getBookingForSlot = (slotId, time) => {
    const confirmedBooking = confirmedAppointments.find(
      (b) => b.slotId === slotId && new Date(b.time).getTime() === time.getTime()
    );
    if (confirmedBooking) return confirmedBooking;
    const pendingBooking = pendingAppointments.find(
      (b) => b.slotId === slotId && new Date(b.time).getTime() === time.getTime()
    );
    return pendingBooking || null;
  };

  // Cancel booking handler for pending appointments
  const cancelBooking = (booking) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this pending appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await updateAppointmentStatus(booking.appointmentId, 'canceled');
              Alert.alert('Success', 'Your appointment has been canceled.');
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel appointment. Please try again.');
            }
          },
        },
      ]
    );
  };

  console.log('Confirmed appointments:', confirmedAppointments);
  console.log('Pending appointments:', pendingAppointments);

  // While patient profile is loading...
  if (patientProfile === null) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // If patient profile is not active, prompt user to complete profile
  if (patientProfile && patientProfile.status !== 'complete') {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.warningText}>Please complete your profile first</Text>
        <TouchableOpacity
          style={styles.completeProfileButton}
          onPress={() => navigation.navigate('CompleteProfileScreen')}
        >
          <Text style={styles.completeProfileButtonText}>Complete Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If doctor data is still loading...
  if (!doctor) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loadingText}>Loading doctor details...</Text>
      </View>
    );
  }

  const groupedAvailabilities = groupAvailabilitiesByDate(availabilities);
  const allDates = Object.keys(groupedAvailabilities).sort();
  const currentDaySlots = selectedDate
    ? groupedAvailabilities[selectedDate].filter((slot) => slot.mode === selectedMode)
    : [];

  // Render mode selector (Online / Physical)
  const renderModeSelector = () => (
    <View style={styles.modeSelectorContainer}>
      <TouchableOpacity
        style={[styles.modeButton, selectedMode === 'online' && styles.modeButtonSelected]}
        onPress={() => {
          setSelectedMode('online');
          setSelectedSlot(null);
        }}
      >
        <Text style={[styles.modeButtonText, selectedMode === 'online' && styles.modeButtonTextSelected]}>
          Online
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.modeButton, selectedMode === 'physical' && styles.modeButtonSelected]}
        onPress={() => {
          setSelectedMode('physical');
          setSelectedSlot(null);
        }}
      >
        <Text style={[styles.modeButtonText, selectedMode === 'physical' && styles.modeButtonTextSelected]}>
          Physical
        </Text>
      </TouchableOpacity>
    </View>
  );
  console.log('the selected slot location',selectedSlot);

  // Book Appointment Handler
  const bookAppointment = async () => {
    if (!selectedSlot || !selectedDate) {
      Alert.alert('Error', 'Please select a date and time slot');
      return;
    }

    const patientId = auth.currentUser ? auth.currentUser.uid : 'unknown_patient';
    const appointmentDate = selectedSlot.time;
    const slotStartStr = formatMinutesTo12Hour(selectedSlot.time);
    const slotEnd = new Date(selectedSlot.time.getTime() + selectedSlot.duration * 60 * 1000);
    const slotEndStr = formatMinutesTo12Hour(slotEnd);
    const slotPortion = `${slotStartStr} - ${slotEndStr} portion`;

    try {
      const appointment = await createAppointment({
        doctorId: doctorId,
        patientId: patientId,
        date: appointmentDate,
        type: selectedMode,
        slotId: selectedSlot.slotId,
        slotPortion,
        location: selectedMode === 'physical' ? selectedSlot.location : 'online',
        price: selectedSlot.price, // price is now passed to the appointment
      });
      console.log('the selected slot location',selectedSlot);
      

      Alert.alert(
        'Appointment Pending Payment',
        `Your booking is not confirmed yet. Please pay to confirm your appointment; otherwise, it will be deleted.\n\nAppointment ID: ${appointment.appointmentId}`
      );
      // Refresh data
      await loadData();
      setSelectedSlot(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to book appointment');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        {/* Doctor Card */}
        <View style={styles.doctorCard}>
          <View style={styles.doctorImageContainer}>
            {doctor.profilePicture ? (
              <Image
                source={{ uri: doctor.profilePicture }}
                style={styles.doctorImage}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person-circle" size={70} color="#ccc" />
            )}
          </View>
          <View style={styles.doctorInfoContainer}>
            <Text style={styles.doctorName}>{doctor.fullName}</Text>
            <Text style={styles.doctorSpecialist}>{doctor.specialist}</Text>
            <View style={styles.row}>
              <Ionicons name="eye" size={16} color="#FFD700" style={styles.iconSpacing} />
              <Text style={styles.ratingText}>
                {doctor.experience ? doctor.experience.toFixed(1) : '4.7'}
              </Text>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.aboutContainer}>
          <Text style={styles.aboutTitle}>About</Text>
          <Text style={styles.aboutText}>
            {doctor.experience ? `Experience: ${doctor.experience} years` : 'No experience info'}
          </Text>
          <Text style={styles.aboutText}>
            {doctor.email ? `Email: ${doctor.email}` : 'No email info'}
          </Text>
          <Text style={styles.aboutText}>
            {doctor.phone ? `Phone: ${doctor.phone}` : 'No phone info'}
          </Text>
        </View>

        {/* Mode Selector */}
        {renderModeSelector()}

        {/* Horizontal Date List */}
        <View style={styles.dateListContainer}>
          <FlatList
            data={allDates}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const dateObj = new Date(item);
              const dayNumber = dateObj.getDate();
              const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
              const isSelected = item === selectedDate;
              return (
                <TouchableOpacity
                  style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                  onPress={() => {
                    setSelectedDate(item);
                    setSelectedSlot(null);
                  }}
                >
                  <Text style={[styles.dateDay, isSelected && styles.dateDaySelected]}>{weekday}</Text>
                  <Text style={[styles.dateNumber, isSelected && styles.dateNumberSelected]}>{dayNumber}</Text>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.dateListContent}
          />
        </View>

        {/* Time Slots for Selected Day */}
        <View style={styles.timeSlotContainer}>
          {currentDaySlots.length === 0 ? (
            <Text style={styles.noSlotText}>No available slots for this day.</Text>
          ) : (
            currentDaySlots.map((slotRecord) => {
              // Display the price if available
              const priceText = slotRecord.price ? `Price: $${slotRecord.price}` : '';
              const timeSlots = generateTimeSlots(
                slotRecord.startTime,
                slotRecord.endTime,
                slotRecord.slotDuration
              );
              return (
                <View key={slotRecord.id} style={styles.availabilityBlock}>
                  {selectedMode === 'physical' && slotRecord.location && (
                    <Text style={styles.locationText}>Location: {slotRecord.location.address}</Text>
                  )}
                  {priceText !== '' && (
                    <Text style={styles.priceText}>{priceText}</Text>
                  )}
                  <View style={styles.slotGrid}>
                    {timeSlots.map((timeObj, index) => {
                      const booking = getBookingForSlot(slotRecord.id, timeObj);
                      const bookingStatus = booking ? booking.status : null;
                      const isConfirmed = bookingStatus === 'confirmed';
                      const isPending =
                        bookingStatus &&
                        bookingStatus !== 'confirmed' &&
                        bookingStatus !== 'canceled';
                      const isSelected =
                        selectedSlot &&
                        selectedSlot.slotId === slotRecord.id &&
                        selectedSlot.time.getTime() === timeObj.getTime();
                      const slotStartStr = formatMinutesTo12Hour(timeObj);
                      const slotEnd = new Date(timeObj.getTime() + slotRecord.slotDuration * 60 * 1000);
                      const slotEndStr = formatMinutesTo12Hour(slotEnd);
                      return (
                        <TouchableOpacity
                          key={`${slotRecord.id}-${index}`}
                          style={[
                            styles.slotItem,
                            isConfirmed && styles.slotItemConfirmed,
                            isPending && styles.slotItemBooked,
                            isSelected && styles.slotItemSelected,
                          ]}
                          // Disable selection if already booked
                          disabled={!!booking}
                          onPress={() => {
                            if (!booking) {
                              setSelectedSlot({
                                slotId: slotRecord.id,
                                time: timeObj,
                                duration: slotRecord.slotDuration,
                                location: slotRecord.location,
                                price: slotRecord.price,
                              });
                            }
                          }}
                        >
                          <Text
                            style={[
                              styles.slotText,
                              isConfirmed && styles.slotTextConfirmed,
                              isPending && styles.slotTextBooked,
                              isSelected && styles.slotTextSelected,
                            ]}
                          >
                            {slotStartStr} - {slotEndStr}
                          </Text>
                          {/* Render booking status */}
                          {booking && (
                            <View style={styles.bookingStatusContainer}>
                              {booking.status === 'canceled' ? (
                                <Text style={styles.canceledLabel}>Cencel</Text>
                              ) : (
                                <>
                                  <Text style={isConfirmed ? styles.confirmedLabel : styles.pendingLabel}>
                                    {isConfirmed ? 'Confirmed' : 'Pending'}
                                  </Text>
                                  {isPending && (
                                    <TouchableOpacity
                                      onPress={() => cancelBooking(booking)}
                                      style={styles.cancelBookingButton}
                                    >
                                      <Ionicons name="close-circle" size={20} color="red" />
                                    </TouchableOpacity>
                                  )}
                                </>
                              )}
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Bottom Book Appointment Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.bookButton} onPress={bookAppointment}>
          <Text style={styles.bookButtonText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default DoctorDetailScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  warningText: {
    color: '#FFD700',
    fontSize: 18,
    marginBottom: 20,
  },
  completeProfileButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  completeProfileButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  // Doctor Card
  doctorCard: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    elevation: 3,
  },
  doctorImageContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  doctorInfoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  doctorName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  doctorSpecialist: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSpacing: {
    marginRight: 4,
  },
  ratingText: {
    color: '#fff',
    fontSize: 14,
  },
  // About Section
  aboutContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  aboutTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  aboutText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 4,
  },
  // Mode Selector
  modeSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  modeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#374151',
    borderRadius: 20,
    marginHorizontal: 8,
  },
  modeButtonSelected: {
    backgroundColor: '#FFD700',
  },
  modeButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  modeButtonTextSelected: {
    color: '#000',
    fontWeight: '700',
  },
  // Date List
  dateListContainer: {
    marginTop: 16,
    marginBottom: 12,
  },
  dateListContent: {
    paddingHorizontal: 16,
  },
  dateCard: {
    width: 60,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCardSelected: {
    backgroundColor: '#FFD700',
  },
  dateDay: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 2,
  },
  dateDaySelected: {
    color: '#000',
  },
  dateNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  dateNumberSelected: {
    color: '#000',
  },
  // Time Slots
  timeSlotContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  availabilityBlock: {
    marginBottom: 20,
  },
  locationText: {
    color: '#FFD700',
    fontSize: 14,
    marginBottom: 8,
  },
  priceText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  slotItem: {
    width: '48%',
    paddingVertical: 12,
    marginBottom: 12,
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    elevation: 2,
  },
  slotItemSelected: {
    backgroundColor: '#FFD700',
  },
  // Style for confirmed booked slot
  slotItemConfirmed: {
    backgroundColor: '#32CD32',
  },
  slotText: {
    color: '#fff',
    fontSize: 14,
  },
  slotTextSelected: {
    color: '#000',
    fontWeight: '700',
  },
  slotTextConfirmed: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  slotTextBooked: {
    color: 'blue',
    fontWeight: '700',
  },
  // Booking status container inside a slot
  bookingStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cancelBookingButton: {
    marginLeft: 8,
  },
  confirmedLabel: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  pendingLabel: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  // New style for canceled booking label ("Cencel")
  canceledLabel: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  // Bottom Book Button
  bottomContainer: {
    padding: 16,
    backgroundColor: '#121212',
  },
  bookButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    elevation: 3,
  },
  bookButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  noSlotText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});
