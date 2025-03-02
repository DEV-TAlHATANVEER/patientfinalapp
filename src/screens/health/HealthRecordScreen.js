import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
  Alert,
  StyleSheet,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  fetchPatientProfile,
  fetchLabReports,
  auth,
  db,
} from '../../services/firebase';
import { uploadImageToCloudinary, validateImage } from '../../services/cloudinary';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

const HealthRecordScreen = ({ navigation }) => {
  const [selectedChip, setSelectedChip] = useState('Lab Test');
  const [adminLabReports, setAdminLabReports] = useState([]);
  const [selfLabReports, setSelfLabReports] = useState([]);
  const [adminPrescriptions, setAdminPrescriptions] = useState([]);
  const [selfPrescriptions, setSelfPrescriptions] = useState([]);
  const [patientProfile, setPatientProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const currentUserId = auth.currentUser?.uid;

  // Modal and form state for add options
  const [modalVisible, setModalVisible] = useState(false);
  const [addType, setAddType] = useState(null); // 'labTest' or 'prescription'
  const [imageUri, setImageUri] = useState(null);
  const [testName, setTestName] = useState('');
  const [prescriptionName, setPrescriptionName] = useState('');

  // Update modal state
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [updateType, setUpdateType] = useState(null); // 'labTest' or 'prescription'
  const [updateId, setUpdateId] = useState(null);
  const [updateName, setUpdateName] = useState('');
  const [updateImageUri, setUpdateImageUri] = useState(null);

  // Helper function to save self-uploaded records
  const saveSelfEHRRecord = async (recordData) => {
    try {
      const ehrRef = collection(db, 'EHR');
      await addDoc(ehrRef, {
        ...recordData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('Record saved to EHR collection.');
    } catch (error) {
      console.error('Error saving self-uploaded record:', error);
      throw error;
    }
  };

  // Fetch patient profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await fetchPatientProfile(currentUserId);
        setPatientProfile(profile);
      } catch (error) {
        console.error('Error fetching patient profile:', error);
      }
    };
    fetchProfile();
  }, []);

  // Subscribe to Lab Test records
  useEffect(() => {
    if (selectedChip === 'Lab Test' && currentUserId) {
      setLoading(true);
      const fetchReports = async () => {
        try {
          const reports = await fetchLabReports(currentUserId);
          const completedReports = reports.filter((r) => r.status === 'completed');
          setAdminLabReports(completedReports);
        } catch (error) {
          console.error('Error fetching lab reports:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchReports();

      const ehrRef = collection(db, 'EHR');
      const labTestQuery = query(
        ehrRef,
        where('patientId', '==', currentUserId),
        where('type', '==', 'labTest')
      );
      const unsubscribe = onSnapshot(
        labTestQuery,
        (snapshot) => {
          let labReports = [];
          snapshot.forEach((docSnap) => {
            labReports.push({ id: docSnap.id, ...docSnap.data() });
          });
          const selfReports = labReports.filter((r) => r.status === 'self-uploaded');
          setSelfLabReports(selfReports);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching lab test records:', error);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    }
  }, [selectedChip, currentUserId]);

  // Subscribe to Prescription records
  useEffect(() => {
    if (selectedChip === 'Prescription' && currentUserId) {
      setLoading(true);

      // Function to fetch admin prescriptions from the 'prescriptions' collection
      const fetchAdminPrescriptions = () => {
        const prescriptionsRef = collection(db, 'prescriptions');
        const adminQuery = query(
          prescriptionsRef,
          where('patientId', '==', currentUserId)
        );
        return onSnapshot(
          adminQuery,
          (snapshot) => {
            let adminPrescData = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              // Only include admin prescriptions (uploadedBy !== 'self')
                adminPrescData.push({ id: doc.id, ...data });
             
            });
            // Optionally sort by createdAt (assuming Firestore Timestamp)
            adminPrescData.sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);
            console.log(adminPrescData);
            
            setAdminPrescriptions(adminPrescData);
          },
          (error) => {
            console.error('Error fetching admin prescriptions:', error);
          }
        );
      };

      // Query self prescriptions from the 'EHR' collection
      const ehrRef = collection(db, 'EHR');
      const selfQuery = query(
        ehrRef,
        where('patientId', '==', currentUserId),
        where('type', '==', 'prescription')
      );
      const unsubscribeSelf = onSnapshot(
        selfQuery,
        (snapshot) => {
          let selfPrescData = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.uploadedBy === 'self') {
              selfPrescData.push({ id: docSnap.id, ...data });
            }
          });
          setSelfPrescriptions(selfPrescData);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching self prescriptions:', error);
          setLoading(false);
        }
      );

      // Subscribe to admin prescriptions
      const unsubscribeAdmin = fetchAdminPrescriptions();

      return () => {
        unsubscribeSelf();
        unsubscribeAdmin();
      };
    }
  }, [selectedChip, currentUserId]);

  // Image picker for adding new records
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to upload images!');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      if (!result.canceled && result.assets[0].uri) {
        try {
          await validateImage(result.assets[0].uri);
          setImageUri(result.assets[0].uri);
        } catch (error) {
          alert(error.message);
        }
      }
    } catch (error) {
      alert('Error selecting image: ' + error.message);
    }
  };

  // Image picker for updating records
  const pickUpdateImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to upload images!');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      if (!result.canceled && result.assets[0].uri) {
        try {
          await validateImage(result.assets[0].uri);
          setUpdateImageUri(result.assets[0].uri);
        } catch (error) {
          alert(error.message);
        }
      }
    } catch (error) {
      alert('Error selecting image: ' + error.message);
    }
  };

  // Handle adding a new lab test
  const handleAddLabTest = async () => {
    try {
      if (!imageUri) {
        Alert.alert('Please select an image');
        return;
      }
      await validateImage(imageUri);
      const uploadedUrl = await uploadImageToCloudinary(imageUri);
      await saveSelfEHRRecord({
        patientId: currentUserId,
        reportUrl: uploadedUrl,
        type: 'labTest',
        status: 'self-uploaded',
        testname: testName || 'New Lab Test',
        uploadedBy: 'self',
      });
      setAddType(null);
      setImageUri(null);
      setTestName('');
    } catch (error) {
      console.error('Error adding lab test:', error);
      Alert.alert('Error', error.message);
    }
  };

  // Handle adding a new prescription
  const handleAddPrescription = async () => {
    try {
      if (!imageUri) {
        Alert.alert('Please select an image');
        return;
      }
      await validateImage(imageUri);
      const uploadedUrl = await uploadImageToCloudinary(imageUri);
      await saveSelfEHRRecord({
        patientId: currentUserId,
        reportUrl: uploadedUrl,
        type: 'prescription',
        status: 'self-uploaded',
        uploadedBy: 'self',
        prescriptionName: prescriptionName || 'New Prescription',
      });
      setAddType(null);
      setImageUri(null);
      setPrescriptionName('');
    } catch (error) {
      console.error('Error adding prescription:', error);
      Alert.alert('Error', error.message);
    }
  };

  // Handle updating self-uploaded lab test
  const handleUpdateSelfLabTest = (reportId, currentTestName) => {
    setUpdateType('labTest');
    setUpdateId(reportId);
    setUpdateName(currentTestName);
    setUpdateImageUri(null);
    setUpdateModalVisible(true);
  };

  // Handle deleting self-uploaded lab test
  const handleDeleteSelfLabTest = (reportId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this lab test?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'EHR', reportId));
              console.log('Lab test deleted');
            } catch (error) {
              console.error('Error deleting lab test:', error);
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  // Handle updating self-uploaded prescription
  const handleUpdateSelfPrescription = (prescriptionId, currentPrescriptionName) => {
    setUpdateType('prescription');
    setUpdateId(prescriptionId);
    setUpdateName(currentPrescriptionName);
    setUpdateImageUri(null);
    setUpdateModalVisible(true);
  };

  // Handle deleting self-uploaded prescription
  const handleDeleteSelfPrescription = (prescriptionId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this prescription?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'EHR', prescriptionId));
              console.log('Prescription deleted');
            } catch (error) {
              console.error('Error deleting prescription:', error);
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  // Render lab test item
  const renderLabTestItem = ({ item }) => (
    <View style={styles.reportItem}>
      <Text style={styles.reportTitle}>{item.testname}</Text>
      {item.reportUrl && (
        <Image source={{ uri: item.reportUrl }} style={styles.reportImage} />
      )}
      {item.status === 'self-uploaded' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.button, styles.editButton]}
            onPress={() => handleUpdateSelfLabTest(item.id, item.testname)}>
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={() => handleDeleteSelfLabTest(item.id)}>
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const adminrenderprescription = ({ item }) => (
    <View style={styles.prescriptionItem}>
      <Text style={styles.prescriptionPatient}>Patient: {item.patientName}</Text>
      <Text style={styles.prescriptionDate}>
        {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : 'Unknown Date'}
      </Text>
      <Text style={styles.prescriptionNotes}>Notes: {item.notes}</Text>
  
      {item.medicines && item.medicines.length > 0 && (
        <>
          <Text style={styles.medicineTitle}>Medicines:</Text>
          {item.medicines.map((medicine, index) => (
            <View key={index} style={styles.medicineItem}>
              <Text style={styles.medicineName}>Name: {medicine.name}</Text>
              <Text style={styles.medicineDosage}>Dosage: {medicine.dosage}</Text>
              <Text style={styles.medicineDuration}>
                Duration: {medicine.duration} days
              </Text>
              <Text style={styles.medicineFrequency}>
                Frequency: {medicine.frequency}
              </Text>
              <Text style={styles.medicineInstructions}>
                Instructions: {medicine.instructions}
              </Text>
              <Text style={styles.medicineNotes}>Notes: {medicine.notes}</Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
  

  // Render prescription item
  const renderPrescriptionItem = ({ item }) => (
    
    
    <View style={styles.reportItem}>
      <Text style={styles.reportTitle}>
        {item.prescriptionName || 'Prescription'}
      </Text>
      {item.reportUrl && (
        <Image source={{ uri: item.reportUrl }} style={styles.reportImage} />
      )}
      {item.status === 'self-uploaded' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.button, styles.editButton]}
            onPress={() => handleUpdateSelfPrescription(item.id, item.prescriptionName)}>
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={() => handleDeleteSelfPrescription(item.id)}>
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Render vital details
  const renderVitalDetails = () => {
    if (patientProfile) {
      if (patientProfile.status !== 'complete') {
        return <Text>Please first complete your profile</Text>;
      }
      return (
        <View style={styles.vitalContainer}>
          <Text style={styles.vitalText}>Name: {patientProfile.name}</Text>
          <Text style={styles.vitalText}>Age: {patientProfile.age}</Text>
          <Text style={styles.vitalText}>BMI: {patientProfile.bmi}</Text>
          <Text style={styles.vitalText}>
            Blood Pressure: {patientProfile.bloodPressureMin} - {patientProfile.bloodPressureMax}
          </Text>
          <Text style={styles.vitalText}>
            Blood Sugar: {patientProfile.bloodSugarMin} - {patientProfile.bloodSugarMax}
          </Text>
        </View>
      );
    }
    return null;
  };

  // Main content renderer
  const renderContent = () => {
    switch (selectedChip) {
      case 'Lab Test':
        return (
          <View>
            <Text style={styles.sectionHeader}>Lab Admin Reports</Text>
            {loading ? <Text>Loading...</Text> : (
              <FlatList
                scrollEnabled={false}
                data={adminLabReports}
                keyExtractor={(item) => item.id}
                renderItem={renderLabTestItem}
                ListEmptyComponent={<Text>No admin lab reports found</Text>}
              />
            )}
            <Text style={styles.sectionHeader}>Your Lab Reports</Text>
            {loading ? <Text>Loading...</Text> : (
              <FlatList
                scrollEnabled={false}
                data={selfLabReports}
                keyExtractor={(item) => item.id}
                renderItem={renderLabTestItem}
                ListEmptyComponent={<Text>No self-uploaded lab reports found</Text>}
              />
            )}
          </View>
        );
      case 'Prescription':
        return (
          <View>
            <Text style={styles.sectionHeader}>Doctor Prescriptions</Text>
            {loading ? <Text>Loading...</Text> : (
              <FlatList
                scrollEnabled={false}
                data={adminPrescriptions}
                keyExtractor={(item) => item.id}
                renderItem={adminrenderprescription}
                ListEmptyComponent={<Text>No admin prescriptions found</Text>}
              />
            )}
            <Text style={styles.sectionHeader}>Your Prescriptions</Text>
            {loading ? <Text>Loading...</Text> : (
              <FlatList
                scrollEnabled={false}
                data={selfPrescriptions}
                keyExtractor={(item) => item.id}
                renderItem={renderPrescriptionItem}
                ListEmptyComponent={<Text>No self-uploaded prescriptions found</Text>}
              />
            )}
          </View>
        );
      case 'Vital':
        return (
          <View>
            {renderVitalDetails()}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Chip Navigation */}
      <View style={styles.chipContainer}>
        {['Lab Test', 'Prescription', 'Vital'].map((chip) => (
          <TouchableOpacity
            key={chip}
            onPress={() => setSelectedChip(chip)}>
            <View style={[styles.chip, selectedChip === chip && styles.activeChip]}>
              <Text style={[styles.chipText, selectedChip === chip && styles.activeChipText]}>
                {chip}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Content */}
      <FlatList
        style={styles.contentContainer}
        data={[selectedChip]} // Using the selected chip as the data key
        keyExtractor={(item) => item}
        renderItem={({ item }) => renderContent()}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal for Add Options */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalHeader}>Add Options</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                setAddType('labTest');
                setModalVisible(false);
              }}>
              <Text style={styles.buttonText}>Add Lab Test</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                setAddType('prescription');
                setModalVisible(false);
              }}>
              <Text style={styles.buttonText}>Add Prescription</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal for Adding Lab Test */}
      {addType === 'labTest' && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!addType}
          onRequestClose={() => setAddType(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalHeader}>Add Lab Test</Text>
              <TextInput
                style={styles.input}
                placeholder="Test Name"
                value={testName}
                onChangeText={setTestName}
              />
              <TouchableOpacity
                style={styles.button}
                onPress={pickImage}>
                <Text style={styles.buttonText}>Pick Image</Text>
              </TouchableOpacity>
              {imageUri && (
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
              )}
              <TouchableOpacity
                style={styles.button}
                onPress={handleAddLabTest}>
                <Text style={styles.buttonText}>Upload</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setAddType(null);
                  setImageUri(null);
                  setTestName('');
                }}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Modal for Adding Prescription */}
      {addType === 'prescription' && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!addType}
          onRequestClose={() => setAddType(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalHeader}>Add Prescription</Text>
              <TextInput
                style={styles.input}
                placeholder="Prescription Name"
                value={prescriptionName}
                onChangeText={setPrescriptionName}
              />
              <TouchableOpacity
                style={styles.button}
                onPress={pickImage}>
                <Text style={styles.buttonText}>Pick Image</Text>
              </TouchableOpacity>
              {imageUri && (
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
              )}
              <TouchableOpacity
                style={styles.button}
                onPress={handleAddPrescription}>
                <Text style={styles.buttonText}>Upload</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setAddType(null);
                  setImageUri(null);
                  setPrescriptionName('');
                }}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Update Modal */}
      {updateModalVisible && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={updateModalVisible}
          onRequestClose={() => setUpdateModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalHeader}>
                {updateType === 'labTest' ? 'Update Lab Test' : 'Update Prescription'}
              </Text>
              <TextInput
                style={styles.input}
                value={updateName}
                onChangeText={setUpdateName}
                placeholder="Enter new name"
              />
              <TouchableOpacity
                style={styles.button}
                onPress={pickUpdateImage}>
                <Text style={styles.buttonText}>Pick New Image</Text>
              </TouchableOpacity>
              {updateImageUri && (
                <Image source={{ uri: updateImageUri }} style={styles.previewImage} />
              )}
              <TouchableOpacity
                style={styles.button}
                onPress={async () => {
                  try {
                    const docRef = doc(db, 'EHR', updateId);
                    let updates = { updatedAt: serverTimestamp() };
                    if (updateType === 'labTest') {
                      updates.testname = updateName;
                    } else {
                      updates.prescriptionName = updateName;
                    }
                    if (updateImageUri) {
                      await validateImage(updateImageUri);
                      const newUrl = await uploadImageToCloudinary(updateImageUri);
                      updates.reportUrl = newUrl;
                    }
                    await updateDoc(docRef, updates);
                    console.log('Record updated');
                    setUpdateModalVisible(false);
                    setUpdateName('');
                    setUpdateId(null);
                    setUpdateType(null);
                    setUpdateImageUri(null);
                  } catch (error) {
                    console.error('Error updating record:', error);
                    Alert.alert('Error', error.message);
                  }
                }}>
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setUpdateModalVisible(false);
                  setUpdateName('');
                  setUpdateId(null);
                  setUpdateType(null);
                  setUpdateImageUri(null);
                }}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  chipContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#F0F1F5',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  activeChip: {
    backgroundColor: '#5E7EB6',
    shadowColor: '#5E7EB6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  chipText: {
    color: '#6B7280',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  activeChipText: {
    color: '#FFF',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginVertical: 16,
    paddingLeft: 8,
  },
  reportItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reportTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  reportImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  vitalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  vitalText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginVertical: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#5E7EB6',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#FFF',
    fontSize: 28,
    marginBottom: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginVertical: 12,
    backgroundColor: '#F3F4F6',
  },
  input: {
    backgroundColor: '#F8F9FD',
    borderRadius: 8,
    padding: 14,
    marginVertical: 8,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  button: {
    backgroundColor: '#5E7EB6',
    borderRadius: 8,
    padding: 14,
    marginTop: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  editButton: {
    backgroundColor: '#10B981',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  prescriptionItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  prescriptionHeader: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  prescriptionPatient: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    marginBottom: 4,
  },
  prescriptionDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  prescriptionNotes: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    marginBottom: 8,
  },
  medicineTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  medicineItem: {
    backgroundColor: '#F8F9FD',
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
  },
  medicineName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  medicineDosage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  medicineDuration: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  medicineFrequency: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  medicineInstructions: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  medicineNotes: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
});

export default HealthRecordScreen;
