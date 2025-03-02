import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { API_URL } from '../../config/theme';
import { getAuth } from 'firebase/auth';
import { saveLabPayment,updateLabTestStatus } from '../../services/firebase'; // Ensure this method is implemented

// Color Palette
const COLORS = {
  primary: '#0a2d4f',
  secondary: '#1a3d6d',
  accent: '#FF69B4',
  text: '#ffffff',
  mutedText: '#a0a0a0',
  border: '#2e4f7d',
};

const SelectedTestScreen = ({ route, navigation }) => {
  const { test } = route.params;
  const { confirmPayment } = useStripe();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  // Compute totals
  const subtotal = test?.price ?? 0;
  const taxRate = 0.1; // Example 10% tax
  const taxes = Math.round(subtotal * taxRate);
  // Here, total is kept equal to the subtotal; adjust if needed (e.g. subtotal + taxes)
  const total = subtotal;

  // Payment state
  const [loading, setLoading] = useState(false);
  const [showCardField, setShowCardField] = useState(false);
  const [paymentMethodText, setPaymentMethodText] = useState('VISA');

  /**
   * Fetch the PaymentIntent client secret from your backend.
   */
  const fetchPaymentIntentClientSecret = async () => {
    try {
      const amountInCents = total * 100; // Convert to cents for Stripe

      const response = await fetch(`${API_URL}/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: total,
          currency: 'usd',
        }),
      });
      const { clientSecret } = await response.json();
      return clientSecret;
    } catch (error) {
      console.error('Error fetching client secret:', error);
      Alert.alert('Error', 'Unable to process payment');
      return null;
    }
  };

  /**
   * Handle checkout: confirm payment with Stripe and save lab payment details.
   */
  const handleCheckout = async () => {
    setLoading(true);
    const clientSecret = await fetchPaymentIntentClientSecret();
    if (!clientSecret) {
      setLoading(false);
      return;
    }

    // Confirm payment with the card details
    const billingDetails = { email: currentUser?.email || 'unknown@example.com' };
    console.log(billingDetails.email);
    
    // 3. Confirm the payment with the card details collected via CardField
    const { error, paymentIntent } = await confirmPayment(clientSecret, {
      paymentMethodType: 'Card',
      paymentMethodData: { billingDetails },
    });

    if (error) {
      Alert.alert('Payment Error', error.message);
    } else if (paymentIntent) {
      Alert.alert('Payment Successful', `Payment status: ${paymentIntent.status}`);
      // Save lab payment details
    
      if (currentUser) {
        try {
          await saveLabPayment(
            currentUser.uid,              // patientid
            test.labId,                   // labId (lab's ID)
            test.id,                      // testid (lab test's ID)
            test.name,                    // testname (name of the lab test)
            test.labName || test.name,    // name (lab name; fallback to test name)
            test.category,                // category
            test.price,                   // price
            'pending' ,                   // test report status
            'paid'                       // payment status
          );
        } catch (saveError) {
          console.error('Error saving lab payment:', saveError);
        }
        await updateLabTestStatus(test.id, 'pending');
      }
      // You can also navigate to a confirmation screen here if desired.
      navigation.navigate('Main');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.headerTitle}>Selected Test</Text>

      {/* Main Scrollable Area */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Test Card */}
        <View style={styles.cardContainer}>
          <View style={styles.imageWrapper}>
            {test?.image ? (
              <Image source={{ uri: test.image }} style={styles.testImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>🔬</Text>
              </View>
            )}
          </View>
          <Text style={styles.priceText}>
            {test?.price ? `Rs. ${test.price}` : 'Rs. 0'}
          </Text>
        </View>

        {/* Test Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Test Details</Text>
          <View style={styles.divider} />

          {test?.name && (
            <Text style={styles.detailTitle}>{test.name}</Text>
          )}

          {test?.description && (
            <Text style={styles.detailText}>{test.description}</Text>
          )}

          {typeof test?.requiresFasting === 'boolean' && (
            <View style={styles.fastingBadge}>
              <Text style={styles.fastingText}>
                {test.requiresFasting ? 'FASTING REQUIRED' : 'NO FASTING NEEDED'}
              </Text>
            </View>
          )}
        </View>

        {/* Payment Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Payment Breakdown</Text>
          <View style={styles.divider} />

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Subtotal</Text>
            <Text style={styles.paymentValue}>Rs. {subtotal}</Text>
          </View>
          <View style={[styles.paymentRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>Rs. {total}</Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.paymentMethodCard}
            onPress={() => setShowCardField(!showCardField)}
          >
            <View style={styles.paymentMethodHeader}>
              <Text style={styles.paymentMethodText}>💳 **** 4242</Text>
              <Text style={styles.changeMethodText}>
                {showCardField ? 'CANCEL' : 'CHANGE'}
              </Text>
            </View>

            {showCardField && (
              <CardField
                placeholders={{
                  number: '4242 4242 4242 4242',
                  color: COLORS.mutedText,
                }}
                style={styles.cardField}
              />
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Checkout Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.text} />
          ) : (
            <>
              <Text style={styles.checkoutText}>Confirm Payment</Text>
              <Text style={styles.checkoutAmount}>Rs. {total}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    marginTop: 50,
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 22,
    color: COLORS.text,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  cardContainer: {
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  imageWrapper: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  testImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imagePlaceholder: {
    backgroundColor: '#2e4f7d',
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    color: COLORS.mutedText,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accent,
    marginTop: 8,
  },
  detailsContainer: {
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.mutedText,
    lineHeight: 18,
    marginBottom: 12,
  },
  fastingBadge: {
    backgroundColor: '#2e4f7d',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  fastingText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
    textTransform: 'uppercase',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 6,
  },
  paymentLabel: {
    fontSize: 13,
    color: COLORS.mutedText,
  },
  paymentValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accent,
  },
  paymentMethodCard: {
    backgroundColor: '#2e4f7d',
    borderRadius: 12,
    padding: 16,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentMethodText: {
    color: COLORS.text,
    fontWeight: '500',
  },
  changeMethodText: {
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: 12,
  },
  cardField: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 16,
    backgroundColor: COLORS.primary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  checkoutButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  checkoutText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  checkoutAmount: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 16,
  },
});

export default SelectedTestScreen;
