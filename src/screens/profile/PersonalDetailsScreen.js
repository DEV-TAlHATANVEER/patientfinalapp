import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Picker as RNPicker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';

import { updatePatientData } from '../../services/firebase';
import { uploadImageToCloudinary } from '../../services/cloudinary';

const PersonalDetailsScreen = ({ route, navigation }) => {
  const { patient, onUpdate } = route.params;
  const [updatedPatient, setUpdatedPatient] = useState(patient);
  const [isUpdating, setIsUpdating] = useState(false);


  // Hide the tab bar when this screen is focused
  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ tabBarStyle: { display: 'none' } });
      return () => navigation.setOptions({ tabBarStyle: { display: 'flex' } });
    }, [navigation])
  );

  // Request media library permissions using useEffect
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photo library to update your profile picture.'
        );
      }
    })();
  }, []);

  const handleUpdateField = (field, value) => {
    setUpdatedPatient(prev => ({ ...prev, [field]: value }));
  };

  const handleProfileImageUpdate = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      // Use the new response format (assets array)
      if (!result.canceled) {
        const selectedImageUri = result.assets[0].uri;
        setUpdatedPatient(prev => ({ ...prev, profileImage: selectedImageUri }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'There was an error picking the image.');
    }
  };

  const handleFirebaseUpdate = async () => {
    try {
      setIsUpdating(true);
      // Ensure you have a valid patient ID (either 'id' or 'uid')

      
      const userId = updatedPatient.id || updatedPatient.userId;
      if (!userId) {
        throw new Error('Patient ID is missing.');
      }

      // Destructure fields that you do not want to update
      const { email, status, profileImage, ...otherData } = updatedPatient;

      // Handle profile image: if the URI starts with file:// or content://, upload to Cloudinary
      let newProfileImage = profileImage;
      if (
        newProfileImage?.startsWith('file://') ||
        newProfileImage?.startsWith('content://')
      ) {
        newProfileImage = await uploadImageToCloudinary(newProfileImage);
      }

      const updateData = { ...otherData, profileImage: newProfileImage };

      await updatePatientData(userId, updateData);
      Alert.alert('Success', 'Your profile has been updated!');
      
      // Update local state and notify parent component
      const updatedData = { ...updatedPatient, ...updateData };
      setUpdatedPatient(updatedData);
      if (onUpdate) {
        onUpdate(updatedData);
      }

    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        <TouchableOpacity onPress={handleProfileImageUpdate}>
          <Image
            source={{
              uri: updatedPatient.profileImage || 'https://via.placeholder.com/150',
            }}
            style={styles.profileImage}
          />
          <View style={styles.editIconContainer}>
            <Icon name="pencil" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        <EditableInfoRow
          label="Name"
          value={updatedPatient.name}
          field="name"
          onUpdate={handleUpdateField}
        />
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Personal Information</Text>

        <EditableInfoRow
          label="Age"
          value={updatedPatient.age}
          field="age"
          onUpdate={handleUpdateField}
          keyboardType="number-pad"
        />

        <EditableGenderRow
          label="Gender"
          value={updatedPatient.gender}
          field="gender"
          onUpdate={handleUpdateField}
        />

        <EditableInfoRow
          label="Phone"
          value={updatedPatient.phone}
          field="phone"
          onUpdate={handleUpdateField}
        />

        <EditableInfoRow
          label="Address"
          value={updatedPatient.address}
          field="address"
          onUpdate={handleUpdateField}
        />

        <InfoRow label="Email" value={updatedPatient.email} />
        <InfoRow label="Status" value={updatedPatient.status} />
      </View>

      <TouchableOpacity 
        style={[styles.updateButton, isUpdating && styles.disabledButton]} 
        onPress={handleFirebaseUpdate}
        disabled={isUpdating}
      >
        <Text style={styles.updateButtonText}>
          {isUpdating ? 'Updating...' : 'Update Details'}
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
};

// Editable row with a TextInput.
const EditableInfoRow = ({ label, value, field, onUpdate, editable = true, keyboardType }) => (
  <View style={styles.infoRow}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, !editable && { color: '#999' }]}
      value={value ? String(value) : ''}
      onChangeText={(text) => onUpdate(field, text)}
      editable={editable}
      keyboardType={keyboardType || (field === 'age' ? 'number-pad' : 'default')}
      placeholder={`Enter ${label}`}
    />
  </View>
);

// Editable row using RNPicker for gender selection.
const EditableGenderRow = ({ label, value, field, onUpdate }) => (
  <View style={styles.infoRow}>
    <Text style={styles.label}>{label}</Text>
    <RNPicker
      selectedValue={value}
      style={styles.picker}
      onValueChange={(itemValue) => onUpdate(field, itemValue)}
    >
      <RNPicker.Item label="Select Gender" value="" />
      <RNPicker.Item label="Male" value="Male" />
      <RNPicker.Item label="Female" value="Female" />
      <RNPicker.Item label="Other" value="Other" />
    </RNPicker>
  </View>
);

// Row to display read-only information.
const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.readOnlyText}>{value ? String(value) : ''}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B2239',
    padding: 16,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 10,
    backgroundColor: '#FFA500',
    borderRadius: 20,
    padding: 4,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0B2239',
    marginBottom: 12,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: '#333',
    flex: 0.4,
  },
  input: {
    flex: 0.6,
    fontSize: 16,
    color: '#555',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    textAlign: 'right',
    paddingVertical: 4,
  },
  readOnlyText: {
    flex: 0.6,
    fontSize: 16,
    color: '#999',
    textAlign: 'right',
  },
  picker: {
    flex: 0.6,
    height: 40,
    color: '#555',
  },
  updateButton: {
    backgroundColor: '#FFA500',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },

  updateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default PersonalDetailsScreen;
