import { type EditFunction, ScriptMode, RisuAPI } from '../api';
import { TimeManager } from '../manager/meta';
import { TypeTracker } from './type';

export class TimeTracker {
    private inlayObserver: EditFunction = async (content: string) => {
        try {
            const regex = /\{\{(inlay|inlayed|inlayeddata)::(.*?)\}\}/g;
            let match;
            while ((match = regex.exec(content)) !== null) {
                const parsed = match[2];
                
                // TimeManager.setTime은 새로운 키일 경우 true를 반환
                const isNewKey = await TimeManager.setTime(parsed, new Date());
                
                // 새로운 키인 경우 TypeTracker.syncKey 호출
                if (isNewKey) {
                    await TypeTracker.syncKey(parsed);
                }
            }
        } catch (error) {
            console.warn('Error setting timestamp:', error);
        }
        return content;
    };

    constructor() {
        RisuAPI.addRisuScriptHandler(ScriptMode.EditDisplay, this.inlayObserver);
    }

    destroy() {
        RisuAPI.removeRisuScriptHandler(ScriptMode.EditDisplay, this.inlayObserver);
    }
}