import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  SafeAreaView,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { fetchBloodBanks } from '../../services/firebase';
import { theme } from '../../config/theme';
import * as Location from 'expo-location';

const BloodBankScreen = () => {
  const [bloodBanks, setBloodBanks] = useState([]);
  const [filteredBanks, setFilteredBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [sortByNearest, setSortByNearest] = useState(false);

  useEffect(() => {
    const loadBloodBanks = async () => {
      try {
        const data = await fetchBloodBanks();
        setBloodBanks(data);
        setFilteredBanks(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadBloodBanks();
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to find nearby blood banks');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    console.log('lat1:', lat1, 'lon1:', lon1, 'lat2:', lat2, 'lon2:', lon2);
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const sortByDistance = (banks) => {
    if (!userLocation) return banks;
    
    return [...banks].sort((a, b) => {
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

  useEffect(() => {
    let filtered = [...bloodBanks];

    // Filter by search query (organization name, city, or blood type)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = bloodBanks.filter(bank => 
        bank.organizationName?.toLowerCase().includes(query) ||
        bank.city?.toLowerCase().includes(query) ||
        // Search in blood inventory
        Object.entries(bank.bloodInventory || {}).some(([type, quantity]) => 
          type.toLowerCase().includes(query) && quantity > 0
        )
      );
    }

    // Sort by distance if enabled
    if (sortByNearest && userLocation) {
      filtered = sortByDistance(filtered);
    }

    setFilteredBanks(filtered);
  }, [searchQuery, sortByNearest, bloodBanks, userLocation]);

  const handleCall = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  const handleLocation = (latitude, longitude) => {
    const scheme = Platform.select({ ios: 'maps:', android: 'geo:' });
    const url = Platform.select({
      ios: `${scheme}${latitude},${longitude}`,
      android: `${scheme}${latitude},${longitude}`,
    });
    Linking.openURL(url);
  };

  const getBloodTypeColor = (quantity) => {
    if (quantity === 0) return '#DC2626';
    if (quantity <= 2) return '#FCD34D';
    return '#10B981';
  };

  const renderBloodInventory = (inventory) => (
    <View style={styles.inventoryGrid}>
      {Object.entries(inventory).map(([type, quantity]) => (
        <TouchableOpacity 
          key={type} 
          style={[
            styles.bloodItem,
            { borderColor: getBloodTypeColor(quantity) }
          ]}
          onPress={() => setSearchQuery(type)}
        >
          <Text style={styles.bloodType}>{type}</Text>
          <Text style={[styles.bloodQuantity, { color: getBloodTypeColor(quantity) }]}>
            {quantity}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOperatingHours = (hours) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return (
      <View style={styles.hoursContainer}>
        <Text style={styles.todayText}>
          Today ({today}): {hours[today]?.closed ? 'Closed' : `${hours[today]?.open} - ${hours[today]?.close}`}
        </Text>
      </View>
    );
  };

  const getDistance = (bankLat, bankLon) => {
    if (!userLocation) return null;
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      parseFloat(bankLat),
      parseFloat(bankLon)
    );
    return distance.toFixed(1);
  };

  const renderBloodBankItem = ({ item }) => {
    const distance = getDistance(item.latitude, item.longitude);
    
    return (
      <View style={styles.card}>
        <View style={styles.headerSection}>
          <Text style={styles.bankName}>{item.organizationName}</Text>
          <TouchableOpacity 
            style={styles.locationButton}
            onPress={() => handleLocation(item.latitude, item.longitude)}
          >
            <MaterialIcons name="location-on" size={20} color={theme.colors.card.blood} />
            <Text style={styles.locationText}>
              {item.location}, {item.city}
              {distance && ` (${distance} km)`}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Blood Inventory</Text>
        {renderBloodInventory(item.bloodInventory)}

        {renderOperatingHours(item.operatingHours)}

        <View style={styles.contactSection}>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => handleCall(item.contact)}
          >
            <MaterialIcons name="phone" size={20} color={theme.colors.card.blood} />
            <Text style={styles.contactText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => handleCall(item.emergencyContact)}
          >
            <FontAwesome5 name="ambulance" size={16} color={theme.colors.card.blood} />
            <Text style={styles.contactText}>Emergency</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by blood type, name, or city..."
          placeholderTextColor={theme.colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity 
          style={[
            styles.nearbyButton,
            sortByNearest && styles.nearbyButtonActive
          ]}
          onPress={() => setSortByNearest(!sortByNearest)}
        >
          <MaterialIcons 
            name="near-me" 
            size={20} 
            color={sortByNearest ? theme.colors.card.blood : theme.colors.text} 
          />
          <Text style={[
            styles.nearbyText,
            sortByNearest && styles.nearbyTextActive
          ]}>Nearby</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredBanks}
        renderItem={renderBloodBankItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading && (
            <Text style={styles.emptyText}>
              No blood banks found matching your search.
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  nearbyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.text,
  },
  nearbyButtonActive: {
    borderColor: theme.colors.card.blood,
    backgroundColor: theme.colors.surface,
  },
  nearbyText: {
    color: theme.colors.text,
    marginLeft: 4,
    fontSize: 14,
  },
  nearbyTextActive: {
    color: theme.colors.card.blood,
  },
  listContent: {
    padding: 16,
  },
  card: {
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
  headerSection: {
    marginBottom: 16,
  },
  bankName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: theme.colors.text,
    marginLeft: 8,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  inventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bloodItem: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
  },
  bloodType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  bloodQuantity: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  hoursContainer: {
    backgroundColor: theme.colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  todayText: {
    color: theme.colors.text,
    fontSize: 14,
  },
  contactSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.card.blood,
  },
  contactText: {
    color: theme.colors.text,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: 16,
    marginTop: 32,
  },
});

export default BloodBankScreen;
