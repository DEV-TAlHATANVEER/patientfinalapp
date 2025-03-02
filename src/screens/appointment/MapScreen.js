import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Dimensions } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE} from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';

const MapScreen = ({ route, navigation }) => {
  const { doctorLocation } = route.params;
  console.log('doctorLocation', doctorLocation);
  
  const [userLocation, setUserLocation] = useState(null);
  const [region, setRegion] = useState({
    latitude: doctorLocation.latitude || 0,
    longitude: doctorLocation.longitude || 0,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to show your position on the map.');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const currentLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserLocation(currentLocation);

        // Update region to show both markers
        const newRegion = {
          latitude: (doctorLocation.latitude + currentLocation.latitude) / 2,
          longitude: (doctorLocation.longitude + currentLocation.longitude) / 2,
          latitudeDelta: Math.abs(doctorLocation.latitude - currentLocation.latitude) * 2,
          longitudeDelta: Math.abs(doctorLocation.longitude - currentLocation.longitude) * 2,
        };
        setRegion(newRegion);
      } catch (error) {
        Alert.alert('Error', 'Failed to get your location');
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
      provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        
      >
        {/* Doctor's Location Marker */}
        <Marker
          coordinate={{
            latitude: doctorLocation.latitude,
            longitude: doctorLocation.longitude,
          }}
          title="Doctor's Location"
          pinColor="#FFD700"
        />

        {/* User's Location Marker */}
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="Your Location"
            pinColor="#4A90E2"
          />
        )}

        {/* Draw line between points */}
        {userLocation && (
          <Polyline
            coordinates={[
              {
                latitude: doctorLocation.latitude,
                longitude: doctorLocation.longitude,
              },
              {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              },
            ]}
            strokeColor="#00008B"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialIcons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: '#FFD700',
    padding: 10,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default MapScreen;
