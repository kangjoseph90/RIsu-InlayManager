import localForage from 'localforage';

const timeDB = localForage.createInstance({
    name: 'inlay',
    storeName: 'time',
});

export class TimeManager {
    static async getKeys(): Promise<string[]> {
        return await timeDB.keys();
    }

    static async getTime(key: string): Promise<Date> {
        const timestamp = await timeDB.getItem<string>(key);
        return timestamp ? new Date(timestamp) : new Date(0);
    }

    static async setTime(key: string, timestamp: Date): Promise<void> {
        const existingTime = await timeDB.getItem<string>(key);
        if (!existingTime) {
            await timeDB.setItem(key, timestamp.toISOString());
        }
    }

    static async bulkDelete(keys: string[]): Promise<void> {
        await Promise.all(keys.map(key => timeDB.removeItem(key)));
    }
}