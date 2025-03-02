import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { sendVerificationEmail, isEmailVerified } from '../../services/firebase';
import { storePatientData } from '../../services/firebase';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../config/theme';
import { uploadImageToCloudinary, validateImage } from '../../services/cloudinary';

const RequiredField = () => (
  <Text style={styles.requiredField}>*</Text>
);

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    gender: '',
    address: '',
    phone: '',
    password: '',
    confirmPassword: '', // Added confirm password field
  });
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [errors, setErrors] = useState({});

  const genderOptions = ['Male', 'Female', 'Other'];

  const handleInputChange = (field, value) => {
    // For age field, only allow numbers
    if (field === 'age' && value && !/^\d+$/.test(value)) {
      return;
    }
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    
    if (!formData.age.trim()) newErrors.age = 'Age is required';
    else if (parseInt(formData.age) < 1 || parseInt(formData.age) > 120) {
      newErrors.age = 'Please enter a valid age';
    }
    
    if (!formData.gender.trim()) newErrors.gender = 'Gender is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\d{11}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
      newErrors.phone = 'Please enter a valid 11-digit phone number';
    }
    
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    // Validate confirm password field
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to upload profile picture!');
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
          setProfileImage(result.assets[0].uri);
        } catch (error) {
          alert(error.message);
        }
      }
    } catch (error) {
      alert('Error selecting image: ' + error.message);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      alert('Please fill in all required fields correctly');
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth();
      // Create user in Firebase Auth
      const { user } = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      let profileImageUrl = '';
      if (profileImage) {
        try {
          profileImageUrl = await uploadImageToCloudinary(profileImage);
        } catch (error) {
          console.error('Error uploading image:', error);
          alert('Failed to upload profile picture, but registration will continue');
        }
      }

      // Update user profile in Firebase Auth
      await updateProfile(user, {
        displayName: formData.name,
        photoURL: profileImageUrl || null,
      });

      // Store patient data in Firestore
      await storePatientData(user.uid, {
        name: formData.name,
        email: formData.email,
        age: parseInt(formData.age),
        gender: formData.gender,
        address: formData.address,
        phone: formData.phone,
        profileImage: profileImageUrl || null,
        role: 'patient',
        status: 'active'
      });

      // Send verification email
      await sendVerificationEmail(user);
      setVerificationSent(true);
      alert('Registration successful! Please check your email to verify your account.');

    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Health Hub</Text>
      <Text style={styles.subtitle}>Register</Text>

      <View style={styles.formContainer}>
        <TouchableOpacity onPress={pickImage} style={styles.imageUpload}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Text style={styles.imageUploadText}>Upload Profile Picture</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Name <RequiredField /></Text>
          <TextInput
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
            mode="outlined"
            style={[styles.input, errors.name && styles.inputError]}
            error={!!errors.name}
            disabled={loading}
          />
          {errors.name && <HelperText type="error" style={styles.errorText}>{errors.name}</HelperText>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email <RequiredField /></Text>
          <TextInput
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            mode="outlined"
            style={[styles.input, errors.email && styles.inputError]}
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!errors.email}
            disabled={loading}
          />
          {errors.email && <HelperText type="error" style={styles.errorText}>{errors.email}</HelperText>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Age <RequiredField /></Text>
          <TextInput
            value={formData.age}
            onChangeText={(value) => handleInputChange('age', value)}
            mode="outlined"
            style={[styles.input, errors.age && styles.inputError]}
            keyboardType="numeric"
            error={!!errors.age}
            disabled={loading}
            maxLength={3}
          />
          {errors.age && <HelperText type="error" style={styles.errorText}>{errors.age}</HelperText>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Gender <RequiredField /></Text>
          <TextInput
            value={formData.gender}
            onChangeText={(value) => handleInputChange('gender', value)}
            mode="outlined"
            style={[styles.input, errors.gender && styles.inputError]}
            error={!!errors.gender}
            disabled={loading}
            onFocus={() => setShowGenderDropdown(true)}
            right={<TextInput.Icon icon="chevron-down" onPress={() => setShowGenderDropdown(!showGenderDropdown)} />}
          />
          {showGenderDropdown && (
            <View style={styles.genderDropdown}>
              {genderOptions.map((gender, index) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderOption,
                    index === genderOptions.length - 1 && styles.genderOptionLast,
                    formData.gender === gender && styles.genderOptionSelected
                  ]}
                  onPress={() => {
                    handleInputChange('gender', gender);
                    setShowGenderDropdown(false);
                  }}
                >
                  <Text style={styles.genderOptionText}>{gender}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {errors.gender && <HelperText type="error" style={styles.errorText}>{errors.gender}</HelperText>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Address <RequiredField /></Text>
          <TextInput
            value={formData.address}
            onChangeText={(value) => handleInputChange('address', value)}
            mode="outlined"
            style={[styles.input, errors.address && styles.inputError]}
            multiline
            numberOfLines={3}
            error={!!errors.address}
            disabled={loading}
          />
          {errors.address && <HelperText type="error" style={styles.errorText}>{errors.address}</HelperText>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone # <RequiredField /></Text>
          <TextInput
            value={formData.phone}
            onChangeText={(value) => handleInputChange('phone', value)}
            mode="outlined"
            style={[styles.input, errors.phone && styles.inputError]}
            keyboardType="phone-pad"
            error={!!errors.phone}
            disabled={loading}
            maxLength={11}
          />
          {errors.phone && <HelperText type="error" style={styles.errorText}>{errors.phone}</HelperText>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password <RequiredField /></Text>
          <TextInput
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            mode="outlined"
            style={[styles.input, errors.password && styles.inputError]}
            secureTextEntry
            error={!!errors.password}
            disabled={loading}
          />
          {errors.password && <HelperText type="error" style={styles.errorText}>{errors.password}</HelperText>}
        </View>

        {/* Confirm Password Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password <RequiredField /></Text>
          <TextInput
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
            mode="outlined"
            style={[styles.input, errors.confirmPassword && styles.inputError]}
            secureTextEntry
            error={!!errors.confirmPassword}
            disabled={loading}
          />
          {errors.confirmPassword && <HelperText type="error" style={styles.errorText}>{errors.confirmPassword}</HelperText>}
        </View>

        {verificationSent ? (
          <View style={styles.verificationContainer}>
            <Text style={styles.verificationText}>
              A verification email has been sent to {formData.email}.
              Please check your inbox and verify your email address.
            </Text>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Login')}
              style={styles.loginButton}
            >
              Go to Login
            </Button>
          </View>
        ) : (
          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerButton}
            contentStyle={styles.registerButtonContent}
            disabled={loading}
          >
            Register
          </Button>
        )}

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 60,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  imageUpload: {
    height: 120,
    width: 120,
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 60,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  uploadPlaceholder: {
    height: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
  },
  imageUploadText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10,
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 4,
    color: 'black',
    fontWeight: '500',
    fontSize: 14,
    paddingHorizontal: 4,
  },
  input: {
    backgroundColor: 'white',
    height: 60,
  },
  requiredField: {
    color: '#DC2626',
    fontSize: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  genderDropdown: {
    position: 'absolute',
    top: 90,
    left: 0,
    right: 0,
    backgroundColor: 'black',
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
    zIndex: 1000,
  },
  genderOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  genderOptionLast: {
    borderBottomWidth: 0,
  },
  genderOptionSelected: {
    backgroundColor: theme.colors.surface,
  },
  genderOptionText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  registerButton: {
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  registerButtonContent: {
    paddingVertical: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: theme.colors.secondary,
    fontSize: 14,
  },
  loginLink: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  verificationContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
  },
  verificationText: {
    color: theme.colors.text,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: 'white',
    color:theme.colors.text,
    marginTop: 8,
    borderColor: theme.colors.primary,
  },
  inputError: {
    borderColor: '#DC2626',
  },
});

export default RegisterScreen;
