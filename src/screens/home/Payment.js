// PaymentListScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import Icon from 'react-native-vector-icons/MaterialIcons';

const PaymentListScreen = () => {
  const [payments, setPayments] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPaymentDetails = async (payment) => {
    let doctorName = 'Unknown Doctor';
    let appointmentDate = 'N/A';
    let type='N/A'
    
    try {
      const doctorDoc = await getDoc(doc(db, 'doctors', payment.doctorId));
      if (doctorDoc.exists()) {
        doctorName = doctorDoc.data().fullName;
      }
    } catch (err) {
      console.error('Error fetching doctor:', err);
    }

    try {
      const appointmentDoc = await getDoc(doc(db, 'appointments', payment.appointmentid));
      if (appointmentDoc.exists()) {
        const date = appointmentDoc.data().date?.toDate();
        type=appointmentDoc.data().type
        appointmentDate = date ? date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : 'N/A';
    
      }
    } catch (err) {
      console.error('Error fetching appointment:', err);
    }

    return { ...payment, doctorName, appointmentDate ,type};
  };

  const fetchPayments = async () => {
    try {
      if (!auth.currentUser) {
        setError('User not authenticated.');
        setLoading(false);
        return;
      }

      const patientId = auth.currentUser.uid;
      const paymentsQuery = query(collection(db, 'payments'), where('patientId', '==', patientId));
      const querySnapshot = await getDocs(paymentsQuery);
      
      let total = 0;
      const paymentsWithDetails = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const payment = { id: docSnap.id, ...docSnap.data() };
          total += payment.amount;
          return await fetchPaymentDetails(payment);
        })
      );

      setPayments(paymentsWithDetails);
      setTotalAmount(total);
      setError(null);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to fetch payments. Please pull down to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPayments();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment History</Text>
      
      <View style={styles.totalContainer}>
        <View style={styles.totalLeft}>
          <Icon name="account-balance-wallet" size={24} color="#fff" />
          <Text style={styles.totalLabel}>Total Spent</Text>
        </View>
        <Text style={styles.totalAmount}>${(totalAmount)}</Text>
      </View>

      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.date}>{item.appointmentDate}</Text>
              <View style={styles.statusBadge}>
                <Icon name="check-circle" size={16} color="#4CAF50" />
                <Text style={styles.statusText}>Paid</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Icon name="local-hospital" size={20} color="#6366f1" />
              <Text style={styles.doctorName}>{item.doctorName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Icon name="calendar-today" size={18} color="#6366f1" />
              <Text style={styles.infoText}>Mode: {item.type}</Text>
            </View>

            <View style={styles.amountContainer}>
              <Text style={styles.amountText}>${(item.amount)}</Text>
              <Icon name="arrow-forward" size={20} color="#6366f1" />
            </View>

            <View style={styles.infoRow}>
              <Icon name="email" size={18} color="#6366f1" />
              <Text style={styles.infoText}>{item.billingEmail}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No payments found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 24,
    textAlign: 'center',
  },
  totalContainer: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  totalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  totalAmount: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    alignItems: 'center',
  },
  date: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 6,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
  },
  infoText: {
    fontSize: 14,
    color: '#718096',
    flexShrink: 1,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  amountText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4CAF50',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default PaymentListScreen;