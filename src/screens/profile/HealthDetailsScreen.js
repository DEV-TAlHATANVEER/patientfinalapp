import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { theme } from '../../config/theme';
import { fetchPatientProfile } from '../../services/firebase';

const HealthDetailsScreen = ({ route }) => {
  const { patient } = route.params;
  // Use local state to manage patient data for refresh updates.
  const [patientData, setPatientData] = useState(patient);
  const [refreshing, setRefreshing] = useState(false);

  // Helper: Check if the patient's profile status is complete.
  const isProfileComplete = () => {
    return patientData && patientData.status === 'complete';
  };

  // Pull-to-refresh handler.
  const onRefresh = async () => {
    // Ensure we have an ID to use for fetching updated data.
    if (!patientData || !patientData.uid) return;
    setRefreshing(true);
    try {
      const updatedPatient = await fetchPatientProfile(patientData.uid);
      setPatientData(updatedPatient);
    } catch (error) {
      console.error('Failed to refresh patient data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Optional: If the patient prop changes, update local state.
  useEffect(() => {
    setPatientData(patient);
  }, [patient]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      <Text style={styles.title}>Health Details</Text>
      {isProfileComplete() ? (
        <View style={styles.detailsContainer}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Disease History</Text>
            <Text style={styles.cardValue}>
              {patientData.diseaseHistory && patientData.diseaseHistory.length > 0
                ? patientData.diseaseHistory.join(', ')
                : 'N/A'}
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Blood Pressure</Text>
            <Text style={styles.cardValue}>
              {patientData.bloodPressureMin} / {patientData.bloodPressureMax}
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Blood Sugar</Text>
            <Text style={styles.cardValue}>
              {patientData.bloodSugarMin} / {patientData.bloodSugarMax}
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Weight</Text>
            <Text style={styles.cardValue}>{patientData.weight} kg</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Height</Text>
            <Text style={styles.cardValue}>{patientData.height} cm</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>BMI</Text>
            <Text style={styles.cardValue}>{patientData.bmi}</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.warning}>
          Your profile is incomplete. Please complete your profile to view your health details.
        </Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  detailsContainer: {
    marginTop: 10,
  },
  card: {
    backgroundColor: '#1E3A54',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.white,
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 16,
    color: theme.colors.white,
  },
  warning: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default HealthDetailsScreen;
