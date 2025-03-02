import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { getAuth } from 'firebase/auth';
import { savePaymentMethod } from '../../services/firebase'; // Ensure your firebase logic supports amount/doctor
import { updateAppointmentStatus } from '../../services/firebase';
import { API_URL } from '../../config/theme';
// Replace with your backend API URL


const PaymentMethodScreen = ({ route, navigation }) => {
  const { confirmPayment } = useStripe();
 
  

  const [loading, setLoading] = useState(false);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Retrieve amount and doctor details from route params
  const { appointmentId,doctor,price,doctorId,type ,date,location} = route.params;
  console.log('the location in the appointment',location)
  // Function to fetch the PaymentIntent client secret from your backend
  const fetchPaymentIntentClientSecret = async () => {
    try {
      const response = await fetch(`${API_URL}/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // amount is in cents
        body: JSON.stringify({ price, currency: 'usd' }),
      });
      const { clientSecret } = await response.json();
      return clientSecret;
    } catch (error) {
      console.error('Error fetching client secret:', error);
      Alert.alert('Error', 'Unable to process payment');
      return null;
    }
  };

  // Handle payment confirmation when the user presses "Pay"
  const handlePayPress = async () => {
   
    setLoading(true);

    // 1. Create a PaymentIntent on your backend and retrieve the client secret
    const clientSecret = await fetchPaymentIntentClientSecret();
    if (!clientSecret) {
      setLoading(false);
      return;
    }

    // 2. Use the current user's email in billing details
    const billingDetails = { email: currentUser?.email || 'unknown@example.com' };
    console.log(billingDetails.email);
    
    // 3. Confirm the payment with the card details collected via CardField
    const { error, paymentIntent } = await confirmPayment(clientSecret, {
      paymentMethodType: 'Card',
      paymentMethodData: { billingDetails },
    });

    if (error) {
      Alert.alert('Payment Confirmation Error', error.message);
    } else if (paymentIntent) {
      Alert.alert('Payment Successful', `Status: ${paymentIntent.status}`);

      // 4. Save payment details (payment method id, amount, and doctor details) in the database
      // Assume paymentIntent.paymentMethodId contains the payment method id.
      const paymentMethodId = paymentIntent.paymentMethodId;
      console.log(doctorId);
      
      console.log(appointmentId);
     
     
      if (currentUser && paymentMethodId && paymentIntent.status === 'Succeeded') {
     
          
          await updateAppointmentStatus(appointmentId,'confirmed');
          console.log('Appointment confirmed');
          Alert.alert('Appointment Confirmed', 'Your appointment has been confirmed. Thank you!');
          
        
        await savePaymentMethod(currentUser.uid, paymentMethodId, price,doctorId,billingDetails.email,appointmentId);
        navigation.navigate('AppointmentDetail', {
          appointment: {
            id: appointmentId,
            doctor,
            price,
            doctorId,
            date,// Replace with actual date if available
            status: 'confirmed', // Replace with actual status if available
            type ,// Replace with actual type if available
            location
          }})
       
      }
    }
    setLoading(false);
  

    
    
    
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Payment Method</Text>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How Stripe Payment Works</Text>
          <Text style={styles.infoText}>
            Enter your card details below. Your card information is securely processed by Stripe and saved so that confirming your appointment with Dr. {doctor?.fullName || 'the doctor'} is just one click away. We never store your card details on our servers.
          </Text>
        </View>

        {/* Card Details Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enter Card Details</Text>
          <CardField
            placeholders={{ number: '4242 4242 4242 4242' }}
            style={styles.cardFieldContainer}
           
          />
        </View>

        {/* Pay Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handlePayPress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                Pay {`$${price}`}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PaymentMethodScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  infoSection: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#6200ee',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#6200ee',
  },
  cardFieldContainer: {
    width: '100%',
    height: 50,
    marginVertical: 12,
  },
  cardField: {
    backgroundColor: '#fff',
    textColor: '#000',
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#6200ee',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
