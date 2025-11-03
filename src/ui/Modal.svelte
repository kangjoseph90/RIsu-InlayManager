<script lang="ts">
    import { InlayType } from "../types";
    import { PLUGIN_NAME } from "../plugin";
    import { AudioTab, VideoTab, ImageTab } from "./tabs";
    import { X, Image, Video, AudioLines } from "lucide-svelte";
    import { onMount, onDestroy } from "svelte";
    import { TypeTracker } from "../tracker/type";
    import { InlayEventSystem, InlayEventType } from "../events/InlayEventSystem";

    export let onClose: () => void;

    let currentTab: InlayType = InlayType.Image;
    let keys: string[] = [];
    let eventSystem = InlayEventSystem.getInstance();

    // 주기적으로 sync 실행 (30초 간격)
    let syncInterval: NodeJS.Timeout;

    onMount(async () => {
        // 초기 sync 실행
        await TypeTracker.sync();
        
        // 30초마다 자동 sync 실행
        syncInterval = setInterval(async () => {
            await TypeTracker.sync();
        }, 30000);
    });

    onDestroy(() => {
        if (syncInterval) {
            clearInterval(syncInterval);
        }
    });
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div
  class="im-fixed im-inset-0 im-bg-black/60 im-z-50 im-flex im-items-center im-justify-center"
  on:click={onClose}
  on:keydown={(e) => e.key === 'Escape' && onClose()}
  role="button"
  tabindex="0"
>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="im-flex im-justify-center im-w-full im-h-full">
        <div class="im-flex im-flex-col im-p-3 sm:im-p-6 im-rounded-lg im-bg-zinc-900 im-w-full im-max-w-4xl im-h-full im-cursor-default" on:click|stopPropagation role="dialog" aria-modal="true">
            <!-- Header -->
            <div class="im-flex im-justify-between im-items-center im-w-full im-mb-2 im-flex-shrink-0 im-gap-2 im-flex-wrap">
                <h2 class="im-text-lg sm:im-text-2xl im-font-semibold im-text-zinc-100">{PLUGIN_NAME}</h2>
                <div class="im-flex im-items-center im-gap-2 im-flex-wrap">
                    <button class="im-px-3 im-py-2 im-rounded-lg im-text-xs sm:im-text-sm im-whitespace-nowrap {currentTab === InlayType.Image ? 'im-bg-zinc-700' : 'im-bg-zinc-800'} im-text-zinc-200 im-transition-colors im-font-medium hover:im-text-zinc-100 hover:im-bg-zinc-700 im-flex im-items-center im-gap-1" title="Image" on:click={() => currentTab = InlayType.Image} disabled={currentTab === InlayType.Image}>
                        <Image size={20} />
                        <span>이미지</span>
                    </button>

                    <button class="im-px-3 im-py-2 im-rounded-lg im-text-xs sm:im-text-sm im-whitespace-nowrap {currentTab === InlayType.Video ? 'im-bg-zinc-700' : 'im-bg-zinc-800'} im-text-zinc-200 im-transition-colors im-font-medium hover:im-text-zinc-100 hover:im-bg-zinc-700 im-flex im-items-center im-gap-1" title="Video" on:click={() => currentTab = InlayType.Video} disabled={currentTab === InlayType.Video}>
                        <Video size={20} />
                        <span>비디오</span>
                    </button>

                    <button class="im-px-3 im-py-2 im-rounded-lg im-text-xs sm:im-text-sm im-whitespace-nowrap {currentTab === InlayType.Audio ? 'im-bg-zinc-700' : 'im-bg-zinc-800'} im-text-zinc-200 im-transition-colors im-font-medium hover:im-text-zinc-100 hover:im-bg-zinc-700 im-flex im-items-center im-gap-1" title="Audio" on:click={() => currentTab = InlayType.Audio} disabled={currentTab === InlayType.Audio}>
                        <AudioLines size={20} />
                        <span>오디오</span>
                    </button>

                    <button class="im-p-2 im-rounded-lg im-bg-zinc-800 im-text-zinc-200 hover:im-bg-zinc-700 im-transition-colors" title="Close" on:click={onClose}>
                        <X size={20} />
                    </button>
                </div>
            </div>
            
            <!-- Body Container -->
            <div class="im-flex-1 im-overflow-y-auto im-min-h-0 im-pt-2">
                {#if currentTab === InlayType.Image}
                    <ImageTab />
                {:else if currentTab === InlayType.Video}
                    <VideoTab />
                {:else if currentTab === InlayType.Audio}
                    <AudioTab />
                {/if}
            </div>
        </div>
    </div>
</div>