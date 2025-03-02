import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { auth } from '../../services/firebase';
import { fetchVideoAppointments } from '../../services/firebase';

import CountdownTimer from '../components/CountdownTimer';
const VideoConsultScreen = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
console.log(appointments);

  useEffect(() => {
    const loadAppointments = async () => {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const apps = await fetchVideoAppointments(userId);
        setAppointments(apps);
      }
    };
    loadAppointments();
  }, []);

  const renderAppointmentCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Image 
          source={{ uri: item.doctor?.profilePicture || 'https://via.placeholder.com/100' }} 
          style={styles.avatar}
        />
        <View style={styles.info}>
          <Text style={styles.name}>{item.doctor?.fullName || 'Dr. Unknown'}</Text>
          <Text style={styles.specialty}>{item.doctor?.specialist || 'General Physician'}</Text>
        </View>
      </View>
      
      <CountdownTimer appointmentTime={item.date} />
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('OnlineVideoCall', { appointmentId: item.id })}
      >
        <Text style={styles.buttonText}>Start Video Call</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={appointments}
        renderItem={renderAppointmentCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No upcoming video consultations</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C1A2B',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  specialty: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyText: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default VideoConsultScreen;