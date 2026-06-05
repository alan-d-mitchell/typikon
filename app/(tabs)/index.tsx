// app/(tabs)/index.tsx
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { getSettings, syncLiturgicalData } from '../../services/calendarEngine';
import { useFocusEffect } from 'expo-router';

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [dayData, setDayData] = useState<any>(null);

  // Fetch today's full live display details from the API
  const loadTodayData = async () => {
    try {
      setLoading(true);
      const settings = await getSettings();
      
      // Hit the "Today" endpoint for the selected calendar path
      const response = await fetch(`https://orthocal.info/api/${settings.calendar}/`);
      if (!response.ok) throw new Error('failed to fetch today\'s calendar details');
      
      const data = await response.json();
      setDayData(data);
    } catch (error) {
      console.error(error);
      Alert.alert('error', 'could not load today\'s liturgical calendar.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
      useCallback(() => {
          loadTodayData();
      }, [])
  );

  const handleManualSync = async () => {
    try {
      setSyncing(true);
      await syncLiturgicalData();
      Alert.alert('sync complete', 'the next 10 days of fasting rules have been scheduled to your device alerts.');
    } catch (error) {
      Alert.alert('sync failed', 'failed to register local notifications.');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8b5a2b" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Title Header Block */}
      <View style={styles.card}>
        <Text style={styles.dateLabel}>
          {dayData?.year}-{dayData?.month}-{dayData?.day}
        </Text>
        <Text style={styles.titleText}>
          {dayData?.summary_title || 'Ordinary Day'}
        </Text>
      </View>

      {/* Fasting Highlight Block */}
      <View style={[styles.card, styles.fastCard]}>
        <Text style={styles.sectionHeader}>Today's Fasting Rule</Text>
        <Text style={styles.fastLevel}>
          {dayData?.fast_level_desc || 'No Fast'}
        </Text>
        {dayData?.fast_exception_desc ? (
          <Text style={styles.fastException}>
            Custom Dispensation: {dayData.fast_exception_desc}
          </Text>
        ) : null}
      </View>

      {/* Commemorated Saints Block */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Saints Commemorated</Text>
        {dayData?.saints && dayData.saints.length > 0 ? (
          dayData.saints.map((saint: string, index: number) => (
            <Text key={index} style={styles.bulletItem}>• {saint}</Text>
          ))
        ) : (
          <Text style={styles.bodyText}>No major commemorations listed.</Text>
        )}
      </View>

      {/* Scripture Citations Block */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Scripture Readings</Text>
        {dayData?.readings && dayData.readings.length > 0 ? (
          dayData.readings.map((reading: any, index: number) => (
            <Text key={index} style={styles.bulletItem}>
              • {reading.source}: {reading.display}
            </Text>
          ))
        ) : (
          <Text style={styles.bodyText}>No assigned readings found.</Text>
        )}
      </View>

      {/* Debug/Testing Sync Action Button */}
      <TouchableOpacity 
        style={styles.syncButton} 
        onPress={handleManualSync}
        disabled={syncing}
      >
        <Text style={styles.syncButtonText}>
          {syncing ? 'Scheduling Alerts...' : 'Force Local Notification Sync'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#f7f5f0',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f5f0',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e6e1d6',
  },
  fastCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#8b5a2b',
  },
  dateLabel: {
    fontSize: 14,
    color: '#706b5e',
    fontWeight: '600',
    marginBottom: 4,
  },
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c2a27',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5c574f',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fastLevel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8b5a2b',
  },
  fastException: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#5c574f',
    marginTop: 4,
  },
  bodyText: {
    fontSize: 15,
    color: '#2c2a27',
  },
  bulletItem: {
    fontSize: 15,
    color: '#2c2a27',
    marginBottom: 6,
    lineHeight: 20,
  },
  syncButton: {
    backgroundColor: '#2c2a27',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  syncButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
