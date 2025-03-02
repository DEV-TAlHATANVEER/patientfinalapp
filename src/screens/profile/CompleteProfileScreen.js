import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker,PROVIDER_GOOGLE } from 'react-native-maps';
import { getAuth } from 'firebase/auth';
import { updatePatientData } from '../../services/firebase';

const theme = {
  colors: {
    background: '#0B2B3C',
    primary: '#00AEEF',
    white: '#FFFFFF',
  },
};

const CompleteProfileScreen = () => {
  const [location, setLocation] = useState({
    latitude: 30.3753,
    longitude: 69.3451,
  });
  const [diseaseInput, setDiseaseInput] = useState('');
  const [diseaseList, setDiseaseList] = useState([]);
  const [bloodPressureMin, setBloodPressureMin] = useState('');
  const [bloodPressureMax, setBloodPressureMax] = useState('');
  const [bloodSugarMin, setBloodSugarMin] = useState('');
  const [bloodSugarMax, setBloodSugarMax] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmi, setBmi] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const calculateBMI = () => {
    if (weight && height) {
      const heightInMeters = parseFloat(height) / 100;
      const calculatedBmi = (
        parseFloat(weight) /
        (heightInMeters * heightInMeters)
      ).toFixed(2);
      setBmi(calculatedBmi);
    }
  };

  const handleAddDisease = () => {
    if (diseaseInput.trim().length > 0) {
      setDiseaseList([...diseaseList, diseaseInput.trim()]);
      setDiseaseInput('');
    }
  };

  const removeDisease = (index) => {
    const updatedList = [...diseaseList];
    updatedList.splice(index, 1);
    setDiseaseList(updatedList);
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);

    try {
      // Include status update to "complete"
      const profileData = {
        location,
        diseaseHistory: diseaseList,
        bloodPressureMin,
        bloodPressureMax,
        bloodSugarMin,
        bloodSugarMax,
        weight,
        height,
        bmi,
        status: 'complete', // Update the patient's status to complete
      };
      const userId = getAuth().currentUser.uid;
      await updatePatientData(userId, profileData);
      Alert.alert('Profile Saved', 'Your profile has been updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={theme.colors.background} barStyle="light-content" />
      <ScrollView style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Disease History</Text>
        <View style={styles.diseaseInputContainer}>
          <TextInput
            style={styles.diseaseInput}
            placeholder="Enter a disease"
            placeholderTextColor="#888"
            value={diseaseInput}
            onChangeText={setDiseaseInput}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddDisease}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.diseaseListContainer}>
          {diseaseList.map((disease, index) => (
            <View key={index} style={styles.diseaseTag}>
              <Text style={styles.diseaseText}>{disease}</Text>
              <TouchableOpacity onPress={() => removeDisease(index)}>
                <Text style={styles.removeText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Blood Pressure:</Text>
        <View style={styles.rangeInputsRow}>
          <TextInput
            style={[styles.rangeInput, { marginRight: 10 }]}
            placeholder="Min"
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={bloodPressureMin}
            onChangeText={setBloodPressureMin}
          />
          <TextInput
            style={[styles.rangeInput, { marginLeft: 10 }]}
            placeholder="Max"
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={bloodPressureMax}
            onChangeText={setBloodPressureMax}
          />
        </View>

        <Text style={styles.sectionTitle}>Sugar Level:</Text>
        <View style={styles.sugarRangeRow}>
          <View style={styles.sugarRangeBox}>
            <Text style={styles.sugarRangeLabel}>Range</Text>
            <TextInput
              style={styles.rangeInput}
              placeholder="Min"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={bloodSugarMin}
              onChangeText={setBloodSugarMin}
            />
          </View>
          <Text style={styles.toLabel}>To</Text>
          <View style={styles.sugarRangeBox}>
            <Text style={styles.sugarRangeLabel}>Range</Text>
            <TextInput
              style={styles.rangeInput}
              placeholder="Max"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={bloodSugarMax}
              onChangeText={setBloodSugarMax}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Physical Measurements</Text>
        <TextInput
          style={styles.input}
          placeholder="Weight (kg)"
          placeholderTextColor="#888"
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
          onEndEditing={calculateBMI}
        />
        <TextInput
          style={styles.input}
          placeholder="Height (cm)"
          placeholderTextColor="#888"
          keyboardType="numeric"
          value={height}
          onChangeText={setHeight}
          onEndEditing={calculateBMI}
        />
        {bmi && <Text style={styles.bmiText}>Your BMI: {bmi}</Text>}

        <Text style={styles.sectionTitle}>Set Your Location</Text>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          onPress={(e) => setLocation(e.nativeEvent.coordinate)}
        >
          <Marker coordinate={location} />
        </MapView>

        <TouchableOpacity
          style={[styles.button, isLoading && { opacity: 0.7 }]}
          onPress={handleSaveProfile}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Save Profile</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: theme.colors.white,
    marginTop: 20,
    marginBottom: 10,
    fontWeight: '600',
  },
  diseaseInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  diseaseInput: {
    flex: 1,
    height: 40,
    borderColor: '#555',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#2F3F4F',
    color: '#fff',
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginLeft: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  diseaseListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  diseaseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '55',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  diseaseText: {
    color: theme.colors.white,
    marginRight: 8,
    fontSize: 14,
  },
  removeText: {
    color: '#ff3333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  rangeInputsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'center',
  },
  rangeInput: {
    flex: 1,
    height: 40,
    borderColor: '#555',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#2F3F4F',
    color: '#fff',
    paddingHorizontal: 10,
  },
  sugarRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sugarRangeBox: {
    flex: 1,
    alignItems: 'center',
  },
  sugarRangeLabel: {
    color: theme.colors.white,
    marginBottom: 5,
    fontSize: 14,
  },
  toLabel: {
    color: theme.colors.white,
    fontSize: 16,
    marginHorizontal: 10,
  },
  input: {
    height: 45,
    borderColor: '#555',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 12,
    backgroundColor: '#2F3F4F',
    color: '#fff',
  },
  bmiText: {
    fontSize: 18,
    marginVertical: 10,
    color: theme.colors.white,
    textAlign: 'center',
    fontWeight: '600',
  },
  map: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 20,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default CompleteProfileScreen;
