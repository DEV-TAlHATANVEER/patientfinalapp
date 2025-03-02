import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TextInput } from 'react-native-paper';

// Expanded theme for consistency
const theme = {
  colors: {
    background: '#0A192F', // Main background
    primary: '#FFFFFF',    // Primary text and card fallback
    secondary: '#A8B2D1',  // Subtitle and secondary text
    accent: '#1E293B',     // For components like search input and service icons
  },
};

const HomeScreen = ({ navigation }) => {
  // Two big top cards (Doctor Appointment & Instant Video Consultation)
  const topCards = [
    {
      title: 'Doctor\nAppointment',
      image: require('../../../assets/doctor-appointment-bg.png'),
      navigateTo: 'Appointment',
    },
    {
      title: 'Instant Video\nConsultation',
      image: require('../../../assets/video-consult-bg.png'),
      navigateTo: 'VideoCall',
    },
  ];

  // Services (grid) + Payment
  const services = [
    {
      title: 'Lab',
      image: require('../../../assets/labs-icon.png'),
    },
    {
      title: 'Medicines',
      image: require('../../../assets/medicines-icon.png'),
    },
    {
      title: 'Health Record',
      image: require('../../../assets/healthcare.png'),
    },
    {
      title: 'Blood Bank',
      image: require('../../../assets/bloodbank.png'),
    },
    {
      title: 'Blogs',
      image: require('../../../assets/blog.png'),
    },
    {
      title: 'Payment', // Use Ionicons instead of an image
      image: null,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Health Hub</Text>
        <Text style={styles.headerSubtitle}>
          Welcome to Health hub – where cutting-edge healthcare meets impeccable style.
          We connect doctors, patients, labs, blood banks, and more for a seamless care experience.
        </Text>
      </View>

      {/* Search/Location Bar */}
      <View style={styles.searchContainer}>
        {/* Add your search/location components here */}
      </View>

      {/* Two Large Cards */}
      <View style={styles.topRow}>
        {topCards.map((card, index) => (
          <TouchableOpacity
            key={index}
            style={styles.largeCard}
            onPress={() => navigation.navigate(card.navigateTo)}
          >
            <ImageBackground
              source={card.image}
              style={styles.cardBg}
              imageStyle={{ marginTop: 0, marginLeft: 16 }}
              resizeMode="cover"
            >
              <View style={styles.cardTextWrapper}>
                <Text style={styles.cardTitle}>{card.title}</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </View>

      {/* Grid of Services */}
      <View style={styles.gridContainer}>
        {services.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.serviceItem}
            onPress={() => navigation.navigate(item.title.replace(/\s/g, ''))}
          >
            <View style={styles.serviceIconContainer}>
              {item.image ? (
                <Image
                  source={item.image}
                  style={styles.serviceIcon}
                  resizeMode="contain"
                />
              ) : (
                <Ionicons name="card-outline" size={32} color={theme.colors.primary} />
              )}
            </View>
            <Text style={styles.serviceTitle}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

// ------------------- STYLES -------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerText: {
    color: theme.colors.primary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: theme.colors.secondary,
    fontSize: 16,
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 15,
    marginBottom: 10,
  },
  cityText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  searchInput: {
    flex: 1,
    height: 45,
    backgroundColor: theme.colors.accent,
    borderRadius: 8,
  },
  // Large Cards Row
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  largeCard: {
    width: '48%',
    height: 180,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: theme.colors.primary,
  },
  cardBg: {
    flex: 1,
  },
  cardTextWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  cardTitle: {
    color: theme.colors.background,
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  // Services Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  serviceItem: {
    width: '33%',
    alignItems: 'center',
    marginBottom: 29,
  },
  serviceIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  serviceIcon: {
    width: 40,
    height: 40,
  },
  serviceTitle: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default HomeScreen;
