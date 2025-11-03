<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { InlayType , type InlayData } from "../../types";
    import { TimeManager, TypeManager } from "../../manager/meta";
    import { InlayManager } from "../../manager/inlay";
    import { UrlManager } from "../../manager/url";
    import { InlayEventSystem, InlayEventType } from "../../events/InlayEventSystem";

    let keys: string[] = [];
    let sortedKeys: string[] = [];
    let timeMap = new Map<string, Date>();
    let eventSystem = InlayEventSystem.getInstance();

    // 키 정렬 함수
    async function sortKeysByTime() {
        const newTimeMap = new Map<string, Date>();
        for (const key of keys) {
            const time = await TimeManager.getTime(key);
            newTimeMap.set(key, time ?? new Date(0));
        }
        timeMap = newTimeMap;
        sortedKeys = [...keys].sort((a, b) =>
            (timeMap.get(b) ?? new Date(0)).getTime() - (timeMap.get(a) ?? new Date(0)).getTime()
        );
    }

    // 메타데이터 로드 함수
    async function loadMetadatas() {
        keys = await TypeManager.getKeys(InlayType.Audio);
        await sortKeysByTime();
    }

    // 이벤트 핸들러들
    async function handleTypeChanged(data: { key: string, type: InlayType }) {
        if (data.type === InlayType.Audio && !keys.includes(data.key)) {
            keys = [...keys, data.key];
            await sortKeysByTime();
        } else if (data.type !== InlayType.Audio && keys.includes(data.key)) {
            keys = keys.filter(k => k !== data.key);
            await sortKeysByTime();
        }
    }

    async function handleTimeUpdated(data: { key: string, timestamp: Date }) {
        if (keys.includes(data.key)) {
            timeMap.set(data.key, data.timestamp);
            sortedKeys = [...keys].sort((a, b) =>
                (timeMap.get(b) ?? new Date(0)).getTime() - (timeMap.get(a) ?? new Date(0)).getTime()
            );
        }
    }

    async function handleDataRemoved(data: { key: string }) {
        if (keys.includes(data.key)) {
            keys = keys.filter(k => k !== data.key);
            timeMap.delete(data.key);
            sortedKeys = sortedKeys.filter(k => k !== data.key);
        }
    }

    async function handleSyncCompleted() {
        await loadMetadatas();
    }

    onMount(async () => {
        await loadMetadatas();
        
        // 이벤트 리스너 등록
        eventSystem.on(InlayEventType.TYPE_CHANGED, handleTypeChanged);
        eventSystem.on(InlayEventType.TIME_UPDATED, handleTimeUpdated);
        eventSystem.on(InlayEventType.DATA_REMOVED, handleDataRemoved);
        eventSystem.on(InlayEventType.SYNC_COMPLETED, handleSyncCompleted);
    });

    onDestroy(() => {
        // 이벤트 리스너 정리
        eventSystem.off(InlayEventType.TYPE_CHANGED, handleTypeChanged);
        eventSystem.off(InlayEventType.TIME_UPDATED, handleTimeUpdated);
        eventSystem.off(InlayEventType.DATA_REMOVED, handleDataRemoved);
        eventSystem.off(InlayEventType.SYNC_COMPLETED, handleSyncCompleted);
    });
</script>

{#each sortedKeys as key (key)}
    <div class="im-mb-4 im-p-2 im-bg-zinc-800 im-rounded-lg im-flex im-items-center im-gap-4">
        <div class="im-w-24 im-h-24 im-bg-black im-rounded im-overflow-hidden im-flex-shrink-0 im-flex im-items-center im-justify-center">
            {#if key}
                {#await InlayManager.getInlayData(key) then inlayData}
                    {#if inlayData}
                        {#if inlayData.type === InlayType.Audio}
                            {#await UrlManager.getDataURL(key, inlayData) then dataURL}
                                <audio src={dataURL} class="im-w-full im-h-full" controls>
                                    해당 브라우저는 오디오를 지원하지 않습니다.
                                </audio>
                            {:catch error}
                                <div class="im-w-full im-h-full im-flex im-items-center im-justify-center im-text-red-500">Error</div>
                            {/await}
                        {:else}
                            <div class="im-w-full im-h-full im-flex im-items-center im-justify-center im-text-red-500">Not an audio</div>
                        {/if}
                    {:else}
                        <div class="im-w-full im-h-full im-flex im-items-center im-justify-center im-text-gray-500">No Data</div>
                    {/if}
                {:catch error}
                    <div class="im-w-full im-h-full im-flex im-items-center im-justify-center im-text-red-500">Error</div>
                {/await}
            {:else}
                <div class="im-w-full im-h-full im-flex im-items-center im-justify-center im-text-gray-500">No Key</div>
            {/if}
        </div>
        <div class="im-flex-1">
            <h3 class="im-text-white im-font-medium">{key}</h3>
            <p class="im-text-zinc-400 im-text-sm">
                {#if timeMap.has(key)}
                    생성 시간: {timeMap.get(key)?.toLocaleString('ko-KR')}
                {:else}
                    사용 기록 없음
                {/if}
            </p>
        </div>
    </div>
{:else}
    <div class="im-flex im-flex-col im-items-center im-justify-center im-h-64 im-text-zinc-500">
        <svg class="im-w-16 im-h-16 im-mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 0-1.105 1.343-2 3-2s3 .895 3 2m-6-4l6 6m0 0l-6-6" />
        </svg>
        <p class="im-text-lg im-font-medium">오디오가 없습니다</p>
        <p class="im-text-sm im-mt-2">RisuAI에서 오디오 인레이를 추가해주세요</p>
    </div>
{/each}