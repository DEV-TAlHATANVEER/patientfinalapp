import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchPatientProfile } from '../../services/firebase';
import { getAuth } from 'firebase/auth';

/**
 * A screen that fetches and displays a patient's data in a
 * dark-themed "Health Hub" style layout.
 */
const PatientHealthHubScreen = ({ navigation }) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const patientId = currentUser?.uid;

  // Loading, error, and patient state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patient, setPatient] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Function to load patient profile data
  const loadPatientProfile = useCallback(async () => {
    try {
      if (!patientId) {
        throw new Error('No authenticated user found');
      }
      const patientData = await fetchPatientProfile(patientId);
      setPatient(patientData);
      setError(null); // Clear any previous errors on success
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  // Fetch patient data from Firestore when component mounts
  useEffect(() => {
    loadPatientProfile();
  }, [loadPatientProfile]);

  // Handler for pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatientProfile();
  };

  if (!patientId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: '#fff' }}>Error: User not authenticated</Text>
      </View>
    );
  }

  // Loading indicator for initial load
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  // Error message
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: '#fff' }}>Error: {error}</Text>
      </View>
    );
  }

  // Extract patient fields with fallbacks
  const patientName = patient?.name ?? 'Unknown Patient';
  const profileImage =
    patient?.profileImage ?? 'https://via.placeholder.com/150';
  const age = patient?.age ?? 'N/A';
  const status = patient?.status ?? 'N/A';

  // Example menu items for the white curved section
  const menuItems = [
    { id: 1, label: 'Personal Details', icon: 'account-circle-outline' },
    { id: 2, label: 'Health Details', icon: 'heart-pulse' },,
    { id: 3, label: 'Complete Your Profile', icon: 'account-check-outline' },
    { id: 4, label: 'Change Password', icon: 'lock' },
    { id: 5, label: 'Logout', icon: 'logout' },
  ];

  // Handle menu presses
  const handleMenuPress = (item) => {
    console.log('Pressed:', item.label);
    if (item.label === 'Personal Details') {
      navigation.navigate('PersonalInfo', {
        patient,
        section: item.label,
        onUpdate: (updatedData) => {
          setPatient(updatedData);
        },
      });
    } else if (item.label === 'Complete Your Profile') {
      navigation.navigate('CompleteProfile', {
        section: 'Complete Profile',
      });
    } else if (item.label === 'Logout') {
      auth.signOut().then(() => {
        navigation.replace('Login');
      });
    } else if (item.label === 'Health Details') {
      navigation.navigate('HealthDetails', {
        patient,
        section: item.label,
      });
    }
    else if (item.label === 'Change Password') {
      navigation.navigate('ChangePassword'); // Navigate to the new ChangePassword screen
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
      >
        {/* Dark Header / Patient Profile Section */}
        <View style={styles.headerContainer}>
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
          <Text style={styles.patientName}>{patientName}</Text>
          {/* New Age & Status Section */}
          <View style={styles.ageStatusContainer}>
            <Text style={styles.ageStatusText}>Age: {age}</Text>
            <Text style={styles.ageStatusText}>Status: {status}</Text>
          </View>
        </View>

        {/* White Curved Section */}
        <View style={styles.curvedSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item)}
            >
              <View style={styles.menuItemLeft}>
                <Icon
                  name={item.icon}
                  size={24}
                  color="#0B2239"
                  style={{ marginRight: 12 }}
                />
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </View>
              <Icon name="chevron-right" size={24} color="#A0A0A0" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PatientHealthHubScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B2239', // Dark background color
  },
  scrollContainer: {
    paddingBottom: 20,
    marginTop: 4, // Top margin for SafeAreaView
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0B2239',
    marginTop: 2, // Top margin for SafeAreaView
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  patientName: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  ageStatusContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 12,
  },
  ageStatusText: {
    color: '#fff',
    fontSize: 14,
    marginHorizontal: 10,
  },
  curvedSection: {
    backgroundColor: '#fff',
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: -20, // Overlap for curved effect
    marginHorizontal: 20, // Added margin on the sides
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
    marginVertical: 4, // Added vertical margin between menu items
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemLabel: {
    fontSize: 16,
    color: '#0B2239',
  },
});
