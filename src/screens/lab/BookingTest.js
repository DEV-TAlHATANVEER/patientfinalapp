import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Card } from 'react-native-paper';
import { auth, fetchLabReports } from '../../services/firebase';
import { theme } from '../../config/theme';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as WebBrowser from 'expo-web-browser';

export default function BookingTest({navigation}) {
    const [reports, setReports] = useState([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState(null);
   
     useEffect(() => {
       loadReports();
     }, []);
   
     const loadReports = async () => {
       try {
         const userId = auth.currentUser?.uid;
         if (!userId) {
           setError('User not authenticated');
           setLoading(false);
           return;
         }
   
         const fetchedReports = await fetchLabReports(userId);
         setReports(fetchedReports);
         setLoading(false);
       } catch (err) {
         console.error('Error loading reports:', err);
         setError('Failed to load reports');
         setLoading(false);
       }
     };
   
     const handleViewReport = (reportUrl) => {
       navigation.navigate('PDFViewer', { url: reportUrl });
     };
     const getStatusColor = (status) => {
       switch (status.toLowerCase()) {
         case 'completed':
           return '#4CAF50';
         case 'pending':
           return '#FFC107';
         default:
           return '#F44336';
       }
     };
   
     if (loading) {
       return (
         <View style={styles.centerContainer}>
           <ActivityIndicator size="large" color={theme.colors.primary} />
         </View>
       );
     }
   
     if (error) {
       return (
         <View style={styles.centerContainer}>
           <Text style={styles.errorText}>{error}</Text>
         </View>
       );
     }
   
     if (reports.length === 0) {
       return (
         <View style={styles.centerContainer}>
           <MaterialIcons name="medical-services" size={64} color={theme.colors.secondary} />
           <Text style={styles.noReportsText}>No lab reports found</Text>
           <Text style={styles.subText}>You haven't booked any tests yet</Text>
         </View>
       );
     }
   
     return (
       <ScrollView style={styles.container}>
         <Text style={styles.headerText}>Your Health Records</Text>
         {reports.map((report) => (
           <Card key={report.id} style={styles.card}>
             <Card.Content>
               <View style={styles.cardHeader}>
                 <View>
                   <Text style={styles.testName}>{report.testname}</Text>
                   <Text style={styles.category}>{report.category}</Text>
                 </View>
                 <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
                   <Text style={styles.statusText}>{report.status}</Text>
                 </View>
               </View>
   
               <View style={styles.detailsContainer}>
                 <Text style={styles.label}>Lab: <Text style={styles.value}>{report.name}</Text></Text>
                 <Text style={styles.label}>Price: <Text style={styles.value}>₹{report.price}</Text></Text>
                 {report.remarks && (
                   <Text style={styles.label}>Remarks: <Text style={styles.value}>{report.remarks}</Text></Text>
                 )}
                 <Text style={styles.date}>
                   {new Date(report.createdAt.seconds * 1000).toLocaleDateString()}
                 </Text>
               </View>
   
               {report.status === 'completed' && report.reportUrl && (
                 <TouchableOpacity
                   style={styles.viewButton}
                   onPress={() => handleViewReport(report.reportUrl)}
                 >
                   <Text style={styles.viewButtonText}>View Report</Text>
                 </TouchableOpacity>
               )}
   
               {report.status === 'pending' && (
                 <Text style={styles.pendingText}>
                   Please wait while your report is being processed
                 </Text>
               )}
             </Card.Content>
           </Card>
         ))}
       </ScrollView>
     );
    }
    const styles = StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
          padding: 16,
        },
        centerContainer: {
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        },
        headerText: {
          fontSize: 24,
          fontWeight: 'bold',
          color: theme.colors.text,
          marginBottom: 16,
        },
        card: {
          marginBottom: 16,
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          elevation: 4,
        },
        cardHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 12,
        },
        testName: {
          fontSize: 18,
          fontWeight: 'bold',
          color: theme.colors.text,
        },
        category: {
          fontSize: 14,
          color: theme.colors.secondary,
          marginTop: 4,
        },
        statusBadge: {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
        },
        statusText: {
          color: '#FFF',
          fontSize: 12,
          fontWeight: 'bold',
          textTransform: 'capitalize',
        },
        detailsContainer: {
          marginVertical: 12,
        },
        label: {
          fontSize: 14,
          color: theme.colors.secondary,
          marginBottom: 8,
        },
        value: {
          color: theme.colors.text,
          fontWeight: '500',
        },
        date: {
          fontSize: 12,
          color: theme.colors.secondary,
          marginTop: 8,
        },
        viewButton: {
          backgroundColor: theme.colors.primary,
          padding: 12,
          borderRadius: 8,
          alignItems: 'center',
          marginTop: 12,
        },
        viewButtonText: {
          color: '#FFF',
          fontWeight: 'bold',
          fontSize: 14,
        },
        pendingText: {
          color: theme.colors.secondary,
          fontStyle: 'italic',
          textAlign: 'center',
          marginTop: 12,
        },
        errorText: {
          color: theme.colors.error,
          fontSize: 16,
          textAlign: 'center',
        },
        noReportsText: {
          fontSize: 20,
          fontWeight: 'bold',
          color: theme.colors.text,
          marginTop: 16,
        },
        subText: {
          fontSize: 16,
          color: theme.colors.secondary,
          marginTop: 8,
          textAlign: 'center',
        },
      });
      