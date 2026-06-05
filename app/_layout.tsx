import { useEffect, useState } from 'react';
import { View, Animated, StyleSheet, Text, Image } from 'react-native';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { syncLiturgicalData } from '@/services/calendarEngine';
import { registerBackgroundSync } from '@/services/backgroundSync';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowList: true,
    }),
});

export default function RootLayout() {
    const [appIsReady, setAppIsReady] = useState(false);
    const fadeAnimation = useState(new Animated.Value(1))[0];

    useEffect(() => {
        async function initializeApp() {
            try {
                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;

                if (existingStatus !== "granted") {
                    const { status } = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }

                if (finalStatus === "granted") {
                    await syncLiturgicalData();
                    await registerBackgroundSync();
                } else {
                    console.log("failed to get token for push notification");
                }

                await new Promise(resolve => setTimeout(resolve, 5000));
            } catch (e) {
                console.warn(e);
            } finally {
                setAppIsReady(true);
            }
        }

        initializeApp();
    }, []);

    useEffect(() => {
        if (appIsReady) {
            SplashScreen.hideAsync();

            Animated.timing(fadeAnimation, {
                toValue: 0,
                duration: 2500,
                useNativeDriver: true,
            }).start();
        }
    }, [appIsReady])

return (
    <View style={styles.mainContainer}>
      {/* Your existing Router setup */}
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>

      {/* The Animated Splash Screen Overlay */}
      <Animated.View
        pointerEvents="none" // Lets the user tap the screen once it fades out!
        style={[
          styles.splashOverlay,
          { opacity: fadeAnimation }
        ]}
      >
      <Image
        source={require('../assets/images/typikon-logo.jpg')}
        style={styles.logoImage}
        resizeMode="contain"
      />
      <Text style={styles.logoSubtitle}>The Typikon: Orthodox Fast Tracker</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { 
    flex: 1 
  },

  splashOverlay: {
    ...StyleSheet.absoluteFill, 
    backgroundColor: '#f7f5f0', 
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999, 
  },

  logoImage: {
    width: 193,  
    height: 250,
    marginBottom: 24,
  },

  logoSubtitle: {
    color: '#2c2a27',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  }
});
