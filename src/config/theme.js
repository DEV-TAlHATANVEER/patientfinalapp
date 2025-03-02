import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1B2E47',
    secondary: '#6B7280',
    background: '#0A1C2F',  // Dark blue background from image
    surface: '#1B2E47',     // Slightly lighter blue for cards
    error: '#DC2626',
    text: '#FFFFFF',
    placeholder: '#9CA3AF',
    card: {
      doctor: '#2196F3',
      video: '#4CAF50',
      labs: '#FF9800',
      medicines: '#03A9F4',
      health: '#E91E63',
      hospitals: '#9C27B0',
      blood: '#F44336',
      blogs: '#009688'
    }
  },
  roundness: 8,
  fonts: {
    ...DefaultTheme.fonts,
    bodySmall: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    bodyMedium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    bodyLarge: {
      fontFamily: 'System',
      fontWeight: '700',
    },
  },
};

export const API_URL = 'current ngrok address'; 