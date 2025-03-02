import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';


import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

import PatientHealthHubScreen from '../screens/profile/PatientHealthHubScreen';
import HealthDetailsScreen from '../screens/profile/HealthDetailsScreen';
import CompleteProfileScreen from '../screens/profile/CompleteProfileScreen';
import PersonalDetailsScreen from '../screens/profile/PersonalDetailsScreen';
import PaymentMethodScreen from '../screens/payment/PaymentMethodScreen';

import HomeScreen from '../screens/home/HomeScreen';

import AppointmentScreen from '../screens/appointment/AppointmentScreen';
import LabsListScreen from '../screens/lab/LabsListScreen';
import LabDetailScreen from '../screens/lab/LabDetailScreen';
import TestsListScreen from '../screens/lab/TestsListScreen';

// Doctor screens:
import DoctorScreen from '../screens/doctor/TopDoctorsScreen'; // List of approved doctors
import DoctorDetailScreen from '../screens/doctor/DoctorDetailScreen'; // Doctor detail view
import AppointmentDetailScreen from '../screens/appointment/AppointmentDetailScreen'; // Appointment detail view
import { theme } from '../config/theme';
import PaymentListScreen from '../screens/home/Payment';
import VideoConsultScreen from '../screens/appointment/VideoConsultScreen';
import SelectedTestScreen from '../screens/lab/SelectedTestScreen';
import HealthRecordScreen from '../screens/health/HealthRecordScreen';
import PDFViewerScreen from '../screens/health/PDFViewerScreen';
import BloodBankScreen from '../screens/bloodbank/BloodBankScreen';
import MedicinesScreen from '../screens/medicines/MedicinesScreen';
import BlogsScreen from '../screens/blogs/BlogsScreen';
import MapScreen from '../screens/appointment/MapScreen';
import OnlineVideoCall from '../screens/appointment/OnlineVideoCall';
import BookingTest from '../screens/lab/BookingTest';
import { MaterialIcons } from '@expo/vector-icons';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="HealthHub" 
      component={PatientHealthHubScreen}
      options={{
        headerShown: true,
        headerTitle: 'Health Hub',
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
      }}
    />
    <Stack.Screen 
      name="PersonalInfo" 
      component={PersonalDetailsScreen}
      options={{
        headerShown: true,
        headerTitle: 'Health Hub',
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
      }}
    />
    <Stack.Screen 
      name="CompleteProfile" 
      component={CompleteProfileScreen} 
      options={{
        headerShown: true,
        headerTitle: 'Complete Your Profile',
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
      }}
    />
    <Stack.Screen 
      name="HealthDetails" 
      component={HealthDetailsScreen} 
      options={{
        headerShown: true,
        headerTitle: 'Complete Your Profile',
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
      }}
    />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen}  options={{
        headerShown: true,
        headerTitle: 'Health Details',
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
      }}   />
    <Stack.Screen 
      name="Health Record" 
      component={HealthDetailsScreen} 
      options={{
        headerShown: true,
        headerTitle: 'Health Details',
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
      }}
    />
  </Stack.Navigator>
);

const DoctorStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="TopDoctors" 
      component={DoctorScreen}
      options={{
        headerShown: true,
        headerTitle: 'Top Doctors',
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
      }}
    />
    <Stack.Screen 
      name="DoctorDetail" 
      component={DoctorDetailScreen}
      options={{
        headerShown: true,
        headerTitle: 'Doctor Detail',
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
      }}
    />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Home') {
          iconName = 'home';
        } else if (route.name === 'Appointment') {
          iconName = 'event';
        } else if (route.name === 'Doctor') {
          iconName = 'medical-services';
        } else if (route.name === 'Profile') {
          iconName = 'person';
        }

        return <MaterialIcons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Appointment" component={AppointmentScreen} />
    {/* Use DoctorStack for navigation within the Doctor section */}
    <Tab.Screen name="Doctor" component={DoctorStack} />
    <Tab.Screen name="Profile" component={ProfileStack} />
   

  </Tab.Navigator>
);

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen}  />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen 
  name="Lab" 
  component={LabsListScreen} 
  options={{ headerTitle: 'Labs',headerShown: true,headerStyle: {
    backgroundColor: theme.colors.primary,
  },
  headerTintColor: '#FFFFFF'}} 
/>
<Stack.Screen 
  name="LabDetail" 
  component={LabDetailScreen} 
  options={{ headerTitle: 'Lab Details',headerStyle: {
    backgroundColor: theme.colors.primary,
  },
  headerTintColor: '#FFFFFF', headerShown: true}} 
/>
<Stack.Screen 
  name="TestsList" 
  component={TestsListScreen} 
  options={{headerShown: true, headerTitle: 'Available Tests' ,headerStyle: {
    backgroundColor: theme.colors.primary,
  },
  headerTintColor: '#FFFFFF',}} 
/>
<Stack.Screen 
  name="BookingTest" 
  component={BookingTest} 
  options={{headerShown: true, headerTitle: 'Available Tests' ,headerStyle: {
    backgroundColor: theme.colors.primary,
  },
  headerTintColor: '#FFFFFF',}} 
/>
<Stack.Screen 
  name="SelectTest" 
  component={SelectedTestScreen} 
  options={{headerShown: true, headerTitle: 'Available Tests' ,headerStyle: {
    backgroundColor: theme.colors.primary,
  },
  headerTintColor: '#FFFFFF',}} 
/>
        <Stack.Screen 
      name="PaymentMethod" 
      component={PaymentMethodScreen} 
      options={{
        headerShown: true,
        headerTitle: 'Payment Method',
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
      }}
    />
        <Stack.Screen 
      name="Payment" 
      component={PaymentListScreen} 
      options={{
        headerShown: true,
        headerTitle: 'Payment list Details',
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
      }}
    />
     <Stack.Screen 
          name="AppointmentDetail" 
          component={AppointmentDetailScreen} // Register the new screen
          options={{
            headerShown: true,
            headerTitle: 'Appointment Details',
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: '#FFFFFF',
          }}
        />
     <Stack.Screen 
          name="VideoCall" 
          component={VideoConsultScreen} // Register the new screen
          options={{
            headerShown: true,
            headerTitle: 'Video Consultation',
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: '#FFFFFF',
          }}
        />
     <Stack.Screen 
          name="OnlineVideoCall" 
          component={OnlineVideoCall} // Register the new screen
          options={{
            headerShown: true,
            headerTitle: 'Video Consultation',
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: '#FFFFFF',
          }}
        />
        <Stack.Screen 
          name="HealthRecord" 
          component={HealthRecordScreen} 
          options={{
            headerShown: true,
            headerTitle: 'Health Records',
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: '#FFFFFF',
          }}
        />
        <Stack.Screen 
          name="PDFViewer" 
          component={PDFViewerScreen} 
          options={{
            headerShown: true,
            headerTitle: 'View Report',
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
          headerTintColor: '#FFFFFF',
          }}
        />
        <Stack.Screen 
          name="BloodBank" 
          component={BloodBankScreen} 
          options={{
            headerShown: true,
            headerTitle: 'Blood Bank',
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: '#FFFFFF',
          }}
        />
        <Stack.Screen 
          name="Medicines" 
          component={MedicinesScreen} 
          options={{
            headerShown: true,
            headerTitle: 'Medicine History',
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: '#FFFFFF',
          }}
        />
        <Stack.Screen 
          name="Blogs" 
          component={BlogsScreen} 
          options={{
            headerShown: true,
            headerTitle: 'Health Blog',
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: '#FFFFFF',
          }}
        />
        <Stack.Screen 
          name="Map" 
          component={MapScreen} 
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
