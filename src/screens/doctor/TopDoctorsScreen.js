// TopDoctorsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fetchApprovedDoctors } from '../../services/firebase';

const TopDoctorsScreen = ({ navigation }) => {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState([]);

  useEffect(() => {
    const getDoctors = async () => {
      try {
        const fetchedDoctors = await fetchApprovedDoctors();
        setDoctors(fetchedDoctors);
        setFilteredDoctors(fetchedDoctors);
      } catch (error) {
        console.error('Error fetching approved doctors:', error);
      }
    };
    getDoctors();
  }, []);

  // Filter doctors by city or specialist whenever `search` or `doctors` changes
  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    setFilteredDoctors(search.trim() ? doctors.filter(doc => 
      doc.city?.toLowerCase().includes(lowerSearch) || 
      doc.specialist?.toLowerCase().includes(lowerSearch)
    ) : doctors);
  }, [search, doctors]);

  const renderDoctorItem = ({ item }) => (
    <TouchableOpacity
      style={styles.doctorCard}
      onPress={() => navigation.navigate('DoctorDetail', { doctorId: item.id })}
    >
      {/* Doctor Image */}
      <View style={styles.doctorImageContainer}>
        {item.profilePicture ? (
          <Image
            source={{ uri: item.profilePicture }}
            style={styles.doctorImage}
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="person-circle" size={60} color="#ccc" />
        )}
      </View>

      {/* Doctor Info */}
      <View style={styles.doctorInfoContainer}>
        <Text style={styles.doctorName}>{item.fullName}</Text>
        <Text style={styles.doctorSpecialist}>{item.specialist}</Text>

        {/* Rating & Distance Row */}
        <View style={styles.row}>
          {/* Rating */}
          <View style={styles.row}>
            <Ionicons name="eye" size={16} color="#FFD700" style={{ marginRight: 4 }} />
            <Text style={styles.ratingText}>
              {item.experience ? item.experience.toFixed(1) : '4.7'}
            </Text>
          </View>
          {/* Distance */}
          <View style={[styles.row, { marginLeft: 16 }]}>
           
           
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Top Header (similar to screenshot) */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Health Hub</Text>
        <Ionicons name="medkit" size={24} color="#fff" />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={{ marginHorizontal: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search By City / Specialty"
          placeholderTextColor="#999"
          onChangeText={(text) => setSearch(text)}
          value={search}
        />
      </View>

      {/* Title */}
      <Text style={styles.topDoctorsTitle}>Top Doctors</Text>

      {/* Doctors List */}
      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item.id}
        renderItem={renderDoctorItem}
        contentContainerStyle={styles.listContentContainer}
      />

     
    </View>
  );
};

export default TopDoctorsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1C2F', // Dark background to match the screenshot theme
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    backgroundColor: '#0A1C2F',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2F3F',
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  topDoctorsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 8,
  },
  listContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80, // space for bottom nav
  },
  doctorCard: {
    flexDirection: 'row',
    backgroundColor: '#1E2F3F',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  doctorImageContainer: {
    marginRight: 12,
  },
  doctorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  doctorInfoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  doctorSpecialist: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#fff',
    fontSize: 14,
  },
  distanceText: {
    color: '#ccc',
    fontSize: 14,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    height: 60,
    width: '100%',
    backgroundColor: '#1E2F3F',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
});
