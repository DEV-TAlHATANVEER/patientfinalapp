import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { fetchLabTests } from '../../services/firebase';
import { theme } from '../../config/theme';

const TestsListScreen = ({ route, navigation }) => {
  const { labId } = route.params;
  console.log('Lab ID:', labId);

  const [tests, setTests] = useState([]);

  useEffect(() => {
    const loadTests = async () => {
      try {
        const testsData = await fetchLabTests(labId);
        // Example structure from Firestore might be:
        // [
        //   {
        //     id: '1',
        //     name: 'Blood Test',
        //     price: 15.99,
        //     category: 'Routine Tests',
        //     image: 'https://...',
        //     description: 'Checks your RBC/WBC counts...',
        //     requiresFasting: true,
        //     turnaroundTime: '24 hours',
        //     status: 'active',
        //     createdAt: ...
        //     labId: ...
        //   },
        //   ...
        // ]
        setTests(testsData);
      } catch (error) {
        console.error('Error fetching tests:', error);
      }
    };

    if (labId) {
      loadTests();
    }
  }, [labId]);

  // Group tests by category if "category" field is present.
  const groupedTests = tests.reduce((acc, test) => {
    const category = test.category || 'Others'; // fallback category if none
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(test);
    return acc;
  }, {});

  const categories = Object.keys(groupedTests);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.headerTitle}>List of test</Text>

      {/* Scrollable content */}
      <ScrollView>
        {categories.map((category) => {
          const categoryTests = groupedTests[category];

          return (
            <View key={category} style={styles.categoryContainer}>
              {/* Category title row */}
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>{category}</Text>
                <TouchableOpacity
                  onPress={() => {
                    // If you want a "See all" screen, handle it here.
                    // For now, we can just console.log or do nothing.
                    console.log(`See all for category: ${category}`);
                  }}
                >
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>

              {/* Horizontal list of tests */}
              <FlatList
                data={categoryTests}
                horizontal
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => {
                  return (
                    <TouchableOpacity
                      style={styles.testCard}
                      onPress={() =>
                        navigation.navigate('SelectTest', { test: item })
                      }
                    >
                      {/* Test image */}
                      <Image
                        source={
                          item.image
                            ? { uri: item.image }
                            : require('../../../assets/labs-icon.png')
                        }
                        style={styles.testImage}
                        resizeMode="contain"
                      />
                      {/* Test name */}
                      <Text style={styles.testName}>{item.name}</Text>
                      {/* Test price */}
                      <Text style={styles.testPrice}>Rs. {item.price}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

/* --- Styles --- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a2d4f', // Dark navy
    paddingTop: 50, // Some top padding for status bar
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  seeAll: {
    fontSize: 14,
    color: '#ffffff',
    textDecorationLine: 'underline',
  },
  testCard: {
    width: 120,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    marginLeft: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  testImage: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  testName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  testPrice: {
    fontSize: 14,
    color: '#333',
  },
});

export default TestsListScreen;
