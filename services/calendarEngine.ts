import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

export interface AppSettings {
    calendar: "gregorian" | "julian";
    notificationTime: string;
}

const DEFAULT_SETTINGS: AppSettings = {
    calendar: "gregorian",
    notificationTime: "07:00"
};

export async function getSettings(): Promise<AppSettings> {
    const data = await AsyncStorage.getItem(
        "@user_settings"
    );

    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
}

export async function syncLiturgicalData(): Promise<void> {
    const settings = await getSettings();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDate = now.getDate();

    try {
        const url = `https://orthocal.info/api/${settings.calendar}/${currentYear}/${currentMonth}/`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("network error fetching liturgical calendar");
        }

        let combinedDays = await response.json();
        if (currentDate > 21) {
            let nextMonth = currentMonth + 1;
            let nextYear = currentYear;

            if (nextMonth > 12) {
                nextMonth = 1;
                nextYear += 1;
            }

            const nextUrl = `https://orthocal.info/api/${settings.calendar}/${nextYear}/${nextMonth}/`;

            const nextResponse = await fetch(nextUrl);
            if (nextResponse.ok) {
                const nextMonthData = await nextResponse.json();
                combinedDays = combinedDays.concat(nextMonthData);
            }
        }

        await Notifications.cancelAllScheduledNotificationsAsync();

        let scheduledCount = 0;
        for (const day of combinedDays) {
            if (day.year === currentYear && day.month === currentMonth && day.day < currentDate) {
                continue;
            }

            if ((day.year < currentYear || (day.year === currentYear && day.month < currentMonth))) {
                continue;
            }

            const fastLevel = day.fast_level_desc || "No Fast";
            const fastException = day.fast_exception_desc || "";
            const body = fastException ? `${fastLevel} - ${fastException}` : fastLevel;

            const [hours, minutes] = settings.notificationTime.split(":").map(Number);
            const triggerDate = new Date(day.year, day.month - 1, day.day, hours, minutes, 0);

            if (triggerDate > new Date()) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: "Today's Fasting Rule",
                        body: body,
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
                        date: triggerDate
                    },
                });

                scheduledCount++;
            }

            if (scheduledCount >= 10) {
                break;
            }
        }
    } catch (error) {
        console.error("background sync failed: ", error);
    }
}
