import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { 
  addMedicineHistory, 
  fetchUserMedicines,
  updateMedicineHistory,
  deleteMedicineHistory,
  auth
} from '../../services/firebase';
import { theme } from '../../config/theme';

const MedicinesScreen = () => {
  const [medicines, setMedicines] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // State to control the DateTimePicker
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [currentDateField, setCurrentDateField] = useState('');

  const [formData, setFormData] = useState({
    medicineName: '',
    dosage: '',
    frequency: '',
    startDate: '',
    endDate: '',
    prescribedBy: '',
    reason: '',
    sideEffects: '',
    notes: '',
  });

  // Frequency options for the Picker
  const frequencyOptions = ["1t", "2t", "3t", "4t", "5t", "6t", "7t", "8t"];

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    try {
      const userId = auth.currentUser.uid;
      const data = await fetchUserMedicines(userId);
      setMedicines(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      medicineName: '',
      dosage: '',
      frequency: '',
      startDate: '',
      endDate: '',
      prescribedBy: '',
      reason: '',
      sideEffects: '',
      notes: '',
    });
  };

  const handleSubmit = async () => {
    if (!formData.medicineName || !formData.dosage || !formData.frequency) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      const userId = auth.currentUser.uid;
      if (editingMedicine) {
        // Update logic
        await updateMedicineHistory(editingMedicine.id, formData);
      } else {
        // Add new medicine record
        await addMedicineHistory(userId, formData);
      }
      setModalVisible(false);
      setEditingMedicine(null);
      resetForm();
      loadMedicines();
    } catch (error) {
      Alert.alert('Error', 'Failed to save medicine details');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (medicineId) => {
    Alert.alert(
      'Delete Medicine',
      'Are you sure you want to delete this medicine record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMedicineHistory(medicineId);
              loadMedicines();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete medicine record');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      medicineName: medicine.medicineName,
      dosage: medicine.dosage,
      frequency: medicine.frequency,
      startDate: medicine.startDate || '',
      endDate: medicine.endDate || '',
      prescribedBy: medicine.prescribedBy || '',
      reason: medicine.reason || '',
      sideEffects: medicine.sideEffects || '',
      notes: medicine.notes || '',
    });
    setModalVisible(true);
  };

  const renderMedicineItem = ({ item }) => (
    <View style={styles.medicineCard}>
      <View style={styles.medicineHeader}>
        <Text style={styles.medicineName}>{item.medicineName}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => handleEdit(item)}
          >
            <MaterialIcons name="edit" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => handleDelete(item.id)}
          >
            <MaterialIcons name="delete" size={24} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.medicineDetails}>
        <Text style={styles.detailText}>
          <Text style={styles.label}>Dosage:</Text> {item.dosage}
        </Text>
        <Text style={styles.detailText}>
          <Text style={styles.label}>Frequency:</Text> {item.frequency}
        </Text>
        {item.prescribedBy && (
          <Text style={styles.detailText}>
            <Text style={styles.label}>Prescribed by:</Text> {item.prescribedBy}
          </Text>
        )}
        {item.startDate && (
          <Text style={styles.detailText}>
            <Text style={styles.label}>Start Date:</Text> {item.startDate}
          </Text>
        )}
        {item.endDate && (
          <Text style={styles.detailText}>
            <Text style={styles.label}>End Date:</Text> {item.endDate}
          </Text>
        )}
        {item.reason && (
          <Text style={styles.detailText}>
            <Text style={styles.label}>Reason:</Text> {item.reason}
          </Text>
        )}
        {item.sideEffects && (
          <Text style={styles.detailText}>
            <Text style={styles.label}>Side Effects:</Text> {item.sideEffects}
          </Text>
        )}
        {item.notes && (
          <Text style={styles.detailText}>
            <Text style={styles.label}>Notes:</Text> {item.notes}
          </Text>
        )}
      </View>
    </View>
  );

  // Handler to show the DateTimePicker for a given field (startDate or endDate)
  const showDatePicker = (fieldName) => {
    setCurrentDateField(fieldName);
    setDatePickerVisible(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => {
          resetForm();
          setEditingMedicine(null);
          setModalVisible(true);
        }}
      >
        <MaterialIcons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>Add Medicine</Text>
      </TouchableOpacity>

      <FlatList
        data={medicines}
        renderItem={renderMedicineItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading && (
            <Text style={styles.emptyText}>
              No medicine history found. Add your first medicine record.
            </Text>
          )
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingMedicine ? 'Edit Medicine' : 'Add Medicine'}
            </Text>
            <TouchableOpacity 
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Medicine Name *"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.medicineName}
              onChangeText={(text) => setFormData({ ...formData, medicineName: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Dosage (e.g., 500mg) *"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.dosage}
              onChangeText={(text) => setFormData({ ...formData, dosage: text })}
            />

            {/* Frequency Picker */}
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.frequency}
                onValueChange={(itemValue) => setFormData({ ...formData, frequency: itemValue })}
              >
                <Picker.Item label="Select Frequency *" value="" />
                {frequencyOptions.map((option) => (
                  <Picker.Item key={option} label={option} value={option} />
                ))}
              </Picker>
            </View>

            {/* Start Date */}
            <TouchableOpacity onPress={() => showDatePicker('startDate')}>
              <TextInput
                style={styles.input}
                placeholder="Start Date (YYYY-MM-DD)"
                placeholderTextColor={theme.colors.placeholder}
                value={formData.startDate}
                editable={false}
                pointerEvents="none"
              />
            </TouchableOpacity>

            {/* End Date */}
            <TouchableOpacity onPress={() => showDatePicker('endDate')}>
              <TextInput
                style={styles.input}
                placeholder="End Date (YYYY-MM-DD)"
                placeholderTextColor={theme.colors.placeholder}
                value={formData.endDate}
                editable={false}
                pointerEvents="none"
              />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Prescribed By"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.prescribedBy}
              onChangeText={(text) => setFormData({ ...formData, prescribedBy: text })}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Reason for Medicine"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.reason}
              onChangeText={(text) => setFormData({ ...formData, reason: text })}
              multiline
              numberOfLines={3}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Side Effects"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.sideEffects}
              onChangeText={(text) => setFormData({ ...formData, sideEffects: text })}
              multiline
              numberOfLines={3}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Additional Notes"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity 
              style={[styles.submitButton, saving && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={saving}
            >
              <Text style={styles.submitButtonText}>
                {saving ? 'Processing...' : (editingMedicine ? 'Update' : 'Save')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* DateTimePicker for Start/End Date */}
        {datePickerVisible && (
          <DateTimePicker
            testID="dateTimePicker"
            value={
              formData[currentDateField]
                ? new Date(formData[currentDateField])
                : new Date()
            }
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={(event, selectedDate) => {
              setDatePickerVisible(false);
              if (event.type === 'set' && selectedDate) {
                // Check if the date is in the future (should be blocked by maximumDate)
                if (selectedDate > new Date()) {
                  Alert.alert("Invalid Date", "Future dates are not allowed");
                  return;
                }
                const formattedDate = selectedDate.toISOString().split('T')[0];
                setFormData({ ...formData, [currentDateField]: formattedDate });
              }
            }}
          />
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    padding: 16,
    margin: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  medicineCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  medicineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    color: 'white',
    gap: 16,
  },
  iconButton: {
    padding: 4,
    
  },
  medicineDetails: {
    gap: 8,
  },
  detailText: {
    color: theme.colors.text,
    fontSize: 14,
    marginBottom: 4,
  },
  label: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 8,
  },
  formContainer: {
    padding: 16,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: theme.colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.placeholder,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: 16,
    marginTop: 32,
  },
});

export default MedicinesScreen;
