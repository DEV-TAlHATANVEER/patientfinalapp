import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Utility function to format Firestore timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp || !timestamp.seconds) return 'N/A';
  const dateObj = new Date(timestamp.seconds * 1000);
  return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();
};

const AppointmentDetailScreen = ({ route, navigation }) => {
  const { appointment } = route.params;

  // Check appointment type and status
  const isVideoCallConfirmed =
    appointment.status === 'confirmed' &&
    appointment.type?.toLowerCase() === 'online';

  const isPhysicalConfirmed =
    appointment.status === 'confirmed' &&
    appointment.type?.toLowerCase() === 'physical';

  // Countdown timer logic for video call appointments
  const calculateTimeRemaining = () => {
    if (!appointment.date || !appointment.date.seconds) return 0;
    const now = new Date();
    const appointmentTime = new Date(appointment.date.seconds * 1000);
    const diff = appointmentTime - now;
    return diff > 0 ? diff : 0;
  };

  const formatCountdown = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeRemaining());

  useEffect(() => {
    if (isVideoCallConfirmed) {
      const timer = setInterval(() => {
        setTimeLeft(calculateTimeRemaining());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [appointment.date, isVideoCallConfirmed]);

  const handleCancel = async () => {
    // TODO: Update the Firestore doc's status to "canceled"
    Alert.alert('Appointment Cancelled', `Appointment ID: ${appointment.id} has been cancelled.`);
  };

  const handlePay = () => {
    // Navigate to the PaymentMethodScreen with the required parameters
    navigation.navigate('PaymentMethod', {
      appointmentId: appointment.id,
      doctor: appointment.doctor,
      price: appointment.price,
      doctorId: appointment.doctorId,
      type: appointment.type,
      date: appointment.date,
      location: appointment.location,
    });
  };

  // Updated handleVideoCall function
  const handleVideoCall = () => {
    if (timeLeft > 0) {
      Alert.alert(
        'Please wait',
        'The video call will be available at your scheduled appointment time.'
      );
      return;
    }
    // Navigate to the OnlineVideoCall screen when time is over
    navigation.navigate('OnlineVideoCall', {
      appointmentId: appointment.id,
      // Pass any additional data if required
    });
  };

  const handleLocation = () => {
    console.log('Doctor Location:', appointment.location);
    
    if (!appointment.location.address || !appointment.location.lat || !appointment.location.lng) {
      Alert.alert(
        'Error',
        'Doctor\'s location coordinates are not available'
      );
      return;
    }

    navigation.navigate('Map', {
      doctorLocation: {
        latitude: appointment.location.lat,
        longitude: appointment.location.lng
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Appointment Details</Text>

      {/* Doctor Information Section */}
      <View style={styles.doctorSection}>
        <View style={styles.doctorInfo}>
          <Image
            source={{ uri: appointment.doctor?.profilePicture }}
            style={styles.doctorImage}
          />
          <Text style={styles.detail}>Doctor: {appointment.doctor?.fullName || 'Unknown'}</Text>
        </View>
        <View style={styles.doctorDetails}>
          <Text style={styles.detail}>Experience: {appointment.doctor?.experience || 'N/A'}</Text>
          <Text style={styles.detail}>Degree: {appointment.doctor?.degree || 'N/A'}</Text>
          <Text style={styles.detail}>Phone: {appointment.doctor?.phone || 'N/A'}</Text>
          <Text style={styles.detail}>Specialist: {appointment.doctor?.specialist || 'N/A'}</Text>
        </View>
      </View>

      {/* Border Line */}
      <View style={styles.borderLine} />

      {/* Appointment Information Section */}
      <View style={styles.appointmentSection}>
        <Text style={styles.detail}>Date: {formatTimestamp(appointment.date)}</Text>
        <Text style={styles.detail}>Status: {appointment.status}</Text>
        <Text style={styles.detail}>Price: ${appointment.price}</Text>
        <Text style={styles.detail}>Type: {appointment.type || 'Not Specified'}</Text>
        {/* Only show confirmation message if status is not confirmed */}
        {appointment.status !== 'confirmed' && appointment.status !== 'expired' && (
          <Text style={styles.confirmationMessage}>
            Your booking is not confirmed. Please book first; otherwise, your appointment will be deleted.
            Ensure to check your details and confirm your booking.
          </Text>
        )}
      </View>

      <View style={styles.buttonRow}>
        {appointment.status === 'expired' ? (
          <Text style={styles.expiredText}>Appointment Expired</Text>
        ) : isVideoCallConfirmed ? (
          <>
            <TouchableOpacity
              style={[styles.videoCallButton, timeLeft > 0 && styles.disabledButton]}
              onPress={handleVideoCall}
              disabled={timeLeft > 0}
            >
              <MaterialIcons name="videocam" size={30} color="#000" />
            </TouchableOpacity>
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>{formatCountdown(timeLeft)}</Text>
            </View>
          </>
        ) : isPhysicalConfirmed ? (
          <>
            <TouchableOpacity style={styles.locationButton} onPress={handleLocation}>
              <MaterialIcons name="location-on" size={30} color="#000" />
            </TouchableOpacity>
            <View style={styles.locationContainer}>
              <ScrollView 
                style={styles.scrollViewContainer}
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={true}
              >
                <Text style={styles.locationText}>
                  {appointment.location.address || 'Location not specified'}
                </Text>
              </ScrollView>
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.payButton} onPress={handlePay}>
              <Text style={styles.buttonText}>Pay</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C1A2B',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  doctorImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  detail: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 10,
  },
  confirmationMessage: {
    fontSize: 16,
    color: '#FFD700',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    minHeight: 60, // Ensure consistent minimum height
  },
  cancelButton: {
    backgroundColor: '#FFD700',
    padding: 15,
    borderRadius: 8,
    flex: 0.48,
  },
  payButton: {
    backgroundColor: '#FFD700',
    padding: 15,
    borderRadius: 8,
    flex: 0.48,
  },
  videoCallButton: {
    backgroundColor: '#FFD700',
    padding: 15,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6, // Reduced opacity indicates disabled state
  },
  countdownContainer: {
    backgroundColor: '#FFD700',
    padding: 15,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    color: '#000',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
  },
  locationButton: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    flex: 0.25, // Take up 25% of the row width
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    height: 60, // Fixed height
  },
  locationContainer: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    flex: 0.7,
    height: 60,
    padding: 10,
  },
  locationText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 18,
  },
  buttonText: {
    color: '#000',
    textAlign: 'center',
    fontWeight: '600',
  },
  doctorSection: {
    marginBottom: 20,
  },
  doctorDetails: {
    marginTop: 10,
  },
  appointmentSection: {
    marginTop: 20,
  },
  borderLine: {
    height: 1,
    backgroundColor: '#FFFFFF',
    width: '100%',
    marginVertical: 20,
  },
  expiredText: {
    color: '#FFD700',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
    flex: 1,
  },
});

export default AppointmentDetailScreen;
