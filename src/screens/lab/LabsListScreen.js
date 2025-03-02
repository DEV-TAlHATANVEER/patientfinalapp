import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  SafeAreaView,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { fetchApprovedLabs } from '../../services/firebase';
import { theme } from '../../config/theme';

const LabsListScreen = ({ navigation }) => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [sortByNearest, setSortByNearest] = useState(false);

  useEffect(() => {
    const loadLabs = async () => {
      try {
        const labsData = await fetchApprovedLabs();
        setLabs(labsData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadLabs();
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to find nearby labs');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const sortByDistance = (labsList) => {
    if (!userLocation) return labsList;
    return [...labsList].sort((a, b) => {
      const distA = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        parseFloat(a.latitude),
        parseFloat(a.longitude)
      );
      const distB = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        parseFloat(b.latitude),
        parseFloat(b.longitude)
      );
      return distA - distB;
    });
  };

  const getDistance = (labLat, labLon) => {
    if (!userLocation) return null;
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      parseFloat(labLat),
      parseFloat(labLon)
    );
    return distance.toFixed(1);
  };

  // Filter labs by searchQuery (labName, specialization, etc.)
  const filteredLabs = labs.filter((lab) =>
    lab.labName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lab.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Optionally sort labs if sortByNearest is true
  const displayedLabs = sortByNearest && userLocation ? sortByDistance(filteredLabs) : filteredLabs;

  const renderLabItem = ({ item }) => {
    console.log(item.lat, item.lng)
    const distance = getDistance(item.lat, item.lng);
    console.log(distance);
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('LabDetail', { labId: item.id })}
      >
        <View style={styles.imageContainer}>
          {item.labPhotos ? (
            <Image
              source={{ uri: item.labPhotos }}
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
        <View style={styles.infoContainer}>
          <Text style={styles.labName}>{item.labName}</Text>
          <Text style={styles.specialization}>{item.specialization}</Text>
          <Text style={styles.cityText}>{item.city}</Text>
          {distance && (
            <Text style={styles.distanceText}>{distance} km away</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Header with "List of Labs" title and Orders button at the end
  const ListHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>List of Labs</Text>
      <TouchableOpacity
        style={styles.orderButton}
        onPress={() => navigation.navigate('BookingTest')}
      >
        <Text style={styles.orderButtonText}>Orders</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Search bar with Nearby toggle */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search LABS"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={[styles.nearbyButton, sortByNearest && styles.nearbyButtonActive]}
          onPress={() => setSortByNearest(!sortByNearest)}
        >
          <Text style={[styles.nearbyButtonText, sortByNearest && styles.nearbyButtonTextActive]}>
            Nearby
          </Text>
        </TouchableOpacity>
      </View>

      {/* Labs list */}
      <FlatList
        data={displayedLabs}
        renderItem={renderLabItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading && (
            <Text style={styles.emptyText}>
              No labs found matching your search.
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  nearbyButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: theme.colors.text,
  },
  nearbyButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  nearbyButtonText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  nearbyButtonTextActive: {
    color: theme.colors.primary,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  orderButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginTop: 16,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  imageContainer: {
    marginRight: 12,
  },
  labImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  infoContainer: {
    flex: 1,
  },
  labName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  specialization: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  cityText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  distanceText: {
    fontSize: 12,
    color: theme.colors.text,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
  },
});

export default LabsListScreen;
