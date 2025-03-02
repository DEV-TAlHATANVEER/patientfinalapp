import React from 'react';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { StripeProvider } from '@stripe/stripe-react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/config/theme';

const combinedTheme = {
  ...DefaultTheme,
  ...theme,
};

export default function App() {
  return (
    <StripeProvider
      publishableKey="pk_test_51QtRQrIzt6ajPAdfLvnKThuESEVfxtgMd7kjTdKhbeWG0lEEhoxCIp47VSRyOx5GVxcweGmVUFeW2dGckYHtqmwr00e0LlWwNd"
      merchantIdentifier="merchant.com.healthhub"
      urlScheme="your-url-scheme"
    >
      <PaperProvider theme={theme}>
        <AppNavigator />
      </PaperProvider>
    </StripeProvider>
  );
}
