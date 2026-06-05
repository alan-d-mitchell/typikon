// app/(tabs)/settings.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Switch, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MailComposer from 'expo-mail-composer';
import { syncLiturgicalData } from '../../services/calendarEngine.ts';

export default function SettingsScreen() {
  const [calendar, setCalendar] = useState('gregorian');
  const [time, setTime] = useState('8:00');
  const [amPm, setAmPm] = useState('AM');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@user_settings').then((data) => {
      if (data) {
        const parsed = JSON.parse(data);
        setCalendar(parsed.calendar || 'gregorian');

        if (parsed.notificationTime) {
            const [hour, minutes] = parsed.notificationTime.split(':');
            let hr = parseInt(hour, 10);
            let period = 'AM';

            if (hr >= 12) {
                period = 'PM';
                if (hr > 12) hr -= 12;
            } else if (hr === 0) {
                hr = 12;
            }

            setTime(`${hr}:${minutes}`);
            setAmPm(period);
        }
      }
    });
  }, []);

  const saveSettings = async () => {
      setIsSaving(true);

      try {
          let [hour, minutes] = time.split(':');
          if (!minutes) minutes = '00';

          let hr = parseInt(hour, 10);
          if (isNaN(hr)) hr = 8;

          if (amPm === 'PM' && hr !== 12) hr += 12;
          if (amPm === 'AM' && hr === 12) hr = 0;

          const formattedHour = hr.toString().padStart(2, '0');
          const finalTime = `${formattedHour}:${minutes.padStart(2, '0')}`;

          await AsyncStorage.setItem(
              '@user_settings', 
              JSON.stringify({
                  calendar,
                  notificationTime: finalTime 
              })
          );

          await syncLiturgicalData();

          Alert.alert('Saved', 'Notification time rescheduled');
      } catch (error) {
          Alert.alert('Error', 'Settings saved but failed to reschedule notification time');
      } finally {
          setIsSaving(false);
      }
  };

  const sendFeedback = async () => {
    const isAvailable = await MailComposer.isAvailableAsync();
    
    if (isAvailable) {
      await MailComposer.composeAsync({
        subject: 'Feedback for Typikon: Orthodox Fast Tracker',
        body: 'Hey Developer,\n\nI noticed an issue with the app: \n\n',
        recipients: ['mitchellalan1999@gmail.com'],
      });
    } else {
      Alert.alert('Error', 'No email app is configured on this device.');
    }
  };

return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>
      
      <View style={styles.row}>
        <Text style={styles.label}>Use Old Calendar (Julian)</Text>
        <Switch 
          value={calendar === 'julian'} 
          onValueChange={(val) => setCalendar(val ? 'julian' : 'gregorian')} 
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Change Notification Time</Text>
        <View style={styles.timeRow}>
          <TextInput 
            style={styles.timeInput} 
            value={time} 
            onChangeText={setTime} 
            placeholder="8:00" 
            keyboardType="numbers-and-punctuation"
          />

          {/* Custom AM/PM Toggle Button */}
          <TouchableOpacity 
            style={styles.amPmToggle} 
            onPress={() => setAmPm(amPm === 'AM' ? 'PM' : 'AM')}
          >
            <Text style={styles.amPmText}>{amPm}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
        onPress={saveSettings}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Settings</Text>
        )}
      </TouchableOpacity>

      <View style={styles.spacer} />

      <TouchableOpacity style={styles.feedbackButton} onPress={sendFeedback}>
        <Text style={styles.feedbackButtonText}>Report a Problem</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f7f5f0' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, color: '#2c2a27' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  label: { fontSize: 16, color: '#2c2a27', fontWeight: '500' },
  inputGroup: { marginBottom: 30 },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  timeInput: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#a8a396', paddingVertical: 10, fontSize: 16, color: '#2c2a27', marginRight: 15 },
  amPmToggle: { backgroundColor: '#e6e1d6', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  amPmText: { fontSize: 16, fontWeight: 'bold', color: '#5c574f' },
  saveButton: { backgroundColor: '#8b5a2b', padding: 16, borderRadius: 12, alignItems: 'center' },
  saveButtonDisabled: { backgroundColor: '#a8a396' },
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  spacer: { flex: 1 },
  feedbackButton: { backgroundColor: '#e6e1d6', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  feedbackButtonText: { color: '#5c574f', fontSize: 16, fontWeight: '600' }
});
