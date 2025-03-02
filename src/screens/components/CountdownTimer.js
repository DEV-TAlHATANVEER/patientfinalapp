import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CountdownTimer = ({ appointmentTime }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const now = new Date();
    const difference = appointmentTime - now;
    
    if (difference < 0) return { expired: true };

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (timeLeft.expired) {
    return (
      <View style={styles.container}>
        <Text style={styles.expiredText}>Consultation Time! over</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Time Until Consultation:</Text>
      <View style={styles.timerContainer}>
        {Object.entries(timeLeft).map(([unit, value]) => (
          <View key={unit} style={styles.timeBlock}>
            <Text style={styles.timeValue}>{String(value).padStart(2, '0')}</Text>
            <Text style={styles.timeLabel}>{unit.toUpperCase()}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeBlock: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  timeValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  timeLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  label: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 8,
  },
  expiredText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CountdownTimer;