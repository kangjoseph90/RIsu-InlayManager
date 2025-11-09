import { InlayType } from "../types";
import { InlayManager } from "./inlay";
import { Queue } from '@datastructures-js/queue';


const dataCache = new Map<string, { url: string, type: InlayType }>();
const dataEntry = new Queue<string>();
const MAX_CACHE_SIZE = 100;

function base64ToBlob(b64: string): Blob {
    const splitDataURI = b64.split(',');
    const byteString = atob(splitDataURI[1]);
    const mimeString = splitDataURI[0].split(':')[1].split(';')[0];

    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeString });
}

export class DataManager {
    static async getDataType(key: string): Promise<InlayType | null> {
        const data = await this.getData(key);
        return data?.type ?? null;
    }

    static async getDataURL(key: string): Promise<string | null> {
        const data = await this.getData(key);
        return data?.url ?? null;
    }

    static async getData(key: string): Promise<{ url: string, type: InlayType } | null> {
        if (dataCache.has(key)) {
            return dataCache.get(key)!;
        }
        const data = await InlayManager.getInlayData(key);
        if (!data) {
            return null;
        }

        const type = data.type ?? InlayType.Image;

        if (typeof data.data === 'string') {
            const blob = base64ToBlob(data.data);
            const url = URL.createObjectURL(blob);
            dataCache.set(key, { url, type });
            this.pushDataEntry(key);
            return { url, type };
        } else if (data.data instanceof Blob) {
            const url = URL.createObjectURL(data.data);
            dataCache.set(key, { url, type });
            this.pushDataEntry(key);
            return { url, type };
        }
        return null;
    }

    static revokeAll(): void {
        for (const { url } of dataCache.values()) {
            URL.revokeObjectURL(url);
        }
        dataCache.clear();
        dataEntry.clear();
    }

    private static pushDataEntry(key: string): void {
        dataEntry.enqueue(key);

        if (dataEntry.size() > MAX_CACHE_SIZE) {
            const oldestKey = dataEntry.dequeue();
            if (oldestKey && dataCache.has(oldestKey)) {
                const data = dataCache.get(oldestKey)!;
                URL.revokeObjectURL(data.url);
                dataCache.delete(oldestKey);
            }
        }
    }

}
