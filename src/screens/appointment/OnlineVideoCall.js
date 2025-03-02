import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, Button, View } from 'react-native';

import { WebView } from 'react-native-webview';


export default function OnlineVideoCall() {
  // Request camera permission using expo-camera hook
  
  

  


  
  // Once permissions are granted, load the Daily.co room in a WebView.
  // Replace the URL below with your actual Daily.co room URL.
  const dailyRoomUrl = 'https://finalhealthhub.daily.co/eShgFh3fnxpr1Tnv4aIs';

  return (
    <View style={{ flex: 1 }}>
      <WebView
        source={{ uri: dailyRoomUrl }}
        style={{ flex: 1 }}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        // These props help ensure media playback works inline
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    textAlign: 'center',
    marginBottom: 10,
  },
});
