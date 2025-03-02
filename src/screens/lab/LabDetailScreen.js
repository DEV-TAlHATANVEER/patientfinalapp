import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { theme } from '../../config/theme';

const LabDetailScreen = ({ route, navigation }) => {
    console.log(route.params);
    
  const { labId } = route.params; // or destructure the whole lab if you passed it directly
  console.log(labId);
  
  const [lab, setLab] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLabData = async () => {
      try {
        const docRef = doc(db, 'labs', labId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLab(docSnap.data());
        } else {
          console.log('No such lab document found!');
        }
      } catch (error) {
        console.log('Error fetching lab data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (labId) {
      fetchLabData();
    } else {
      // If we passed the whole lab object directly, you could do: setLab(route.params.lab);
      setLoading(false);
    }
  }, [labId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!lab) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No lab data found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Lab Photo */}
      <View style={styles.imageContainer}>
        {lab.labPhotos  ? (
          <Image
            source={{ uri: lab.labPhotos }}
            style={styles.labImage}
            resizeMode="cover"
          />
        ) : (
          <Image
            source={require('../../../assets/labs-icon.png')} 
            style={styles.labImage}
            resizeMode="cover"
          />
        )}
      </View>

      {/* Lab Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{lab.labName}</Text>
        
        {lab.city && <Text style={styles.subtitle}>{lab.city}</Text>}
        {lab.specialization && (
          <Text style={styles.specialization}>{lab.specialization}</Text>
        )}

        {lab.address && <Text style={styles.address}>{lab.address}</Text>}
        {lab.phone && (
          <Text style={styles.contact}>Contact: {lab.phone}</Text>
        )}
        {lab.email && (
          <Text style={styles.contact}>Email: {lab.email}</Text>
        )}

        {/* Add more fields here if needed (e.g., operatingHours, contactPerson, etc.) */}
      </View>

      {/* Button to view all services/tests */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('TestsList', { labId })}
      >
        <Text style={styles.buttonText}>View All Services</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  /* Container & Loading/Error styles */
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: theme.colors.error || 'red',
    fontSize: 16,
  },

  /* Image */
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labImage: {
    width: '100%',
    height: '100%',
  },

  /* Info */
  infoContainer: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginBottom: 4,
  },
  specialization: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  contact: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },

  /* Button */
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LabDetailScreen;
