import { InlayManager } from "../manager/inlay";
import { TypeManager } from "../manager/meta";
import { InlayEventSystem, InlayEventType } from "../events/InlayEventSystem";

export class TypeTracker {
    private static eventSystem = InlayEventSystem.getInstance();
    
    /**
     * 단일 키에 대한 동기화를 수행합니다.
     * @param key 동기화할 키
     * @returns 동기화 성공 여부
     */
    static async syncKey(key: string): Promise<boolean> {
        try {
            // 이미 타입 정보가 있는지 확인
            const existingType = await TypeManager.getType(key);
            if (existingType) {
                return false; // 이미 존재하므로 동기화 불필요
            }
            
            // InlayManager에서 키가 실제로 존재하는지 확인
            const inlayKeys = await InlayManager.getKeys();
            if (!inlayKeys.includes(key)) {
                return false; // 키가 존재하지 않음
            }
            
            // Inlay 데이터 가져오기
            const inlayData = await InlayManager.getInlayData(key);
            if (inlayData && inlayData.type) {
                await TypeManager.setType(key, inlayData.type);
                
                // 개별 키 추가 이벤트 발생
                this.eventSystem.emit(InlayEventType.DATA_ADDED, {
                    keys: [key],
                    source: 'TypeTracker.syncKey'
                });
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.warn(`Error syncing key ${key}:`, error);
            return false;
        }
    }
    
    /**
     * 전체 동기화를 수행합니다.
     * syncKey 메서드를 사용하여 각 키를 개별적으로 처리합니다.
     */
    static async sync() {
        const inlayKeys = await InlayManager.getKeys();
        const typeKeys = await TypeManager.getKeys();

        const newKeys = inlayKeys.filter(key => !typeKeys.includes(key));
        const deletedKeys = typeKeys.filter(key => !inlayKeys.includes(key));
        
        // 새로운 키들에 대해 개별 동기화 수행
        const syncedKeys: string[] = [];
        for (const key of newKeys) {
            const success = await this.syncKey(key);
            if (success) {
                syncedKeys.push(key);
            }
        }

        // 삭제된 키들 일괄 처리
        if (deletedKeys.length > 0) {
            await TypeManager.bulkDelete(deletedKeys);
            
            // 삭제된 키들에 대한 이벤트 발생
            deletedKeys.forEach(key => {
                this.eventSystem.emit(InlayEventType.DATA_REMOVED, { key });
            });
        }
        
        // sync 완료 이벤트 발생
        this.eventSystem.emit(InlayEventType.SYNC_COMPLETED, {
            newKeys: syncedKeys,
            deletedKeys,
            totalKeys: inlayKeys.length
        });
    }
}