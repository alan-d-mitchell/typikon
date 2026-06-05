import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { syncLiturgicalData } from './calendarEngine';

const BACKGROUND_SYNC_TASK = 'BACKGROUND_LITURGICAL_SYNC';

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
    try {
        await syncLiturgicalData();
        return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});

export async function registerBackgroundSync() {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    
    if (!isRegistered) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
            minimumInterval: 60 * 60 * 24,
            stopOnTerminate: false,
            startOnBoot: true,
        });
    }
}
