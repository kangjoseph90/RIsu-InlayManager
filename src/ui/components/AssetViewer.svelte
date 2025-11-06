<script lang="ts">
    import { InlayType } from "../../types";
    import Loading from "./Loading.svelte";
    import { UrlManager } from "../../manager/url";
    import { onMount, onDestroy } from "svelte";
    
    export let key: string;
    export let type: InlayType;
    export let width: string = "w-full";
    export let height: string = "h-full";
    export let objectFit: string = "object-cover";
    export let showControls: boolean = true;
    export let autoplay: boolean = false;
    export let loop: boolean = false;
    export let muted: boolean = false;
    export let isVisible: boolean = true; // For lazy loading
    
    console.log(`Asset ${key}, ${type}, ${isVisible} initialized`);

    let dataURL: string = '';
    let loading = true;
    let error: string | null = null;
    let videoElement: HTMLVideoElement;
    let audioElement: HTMLAudioElement;
    
    // Cache for the current key's dataURL to prevent re-fetching
    let cachedKey = '';
    let loadingPromise: Promise<void> | null = null;
    
    
    async function loadAsset() {
        if (!isVisible || !key) {
            return;
        }
        
        // Use cached URL if available
        if (cachedKey === key && dataURL) {
            return;
        }
        
        try {
            loading = true;
            error = null;
            const url = await UrlManager.getDataURL(key);
            console.log(`Loaded asset ${key}`);
            dataURL = url;
            cachedKey = key;
        } catch (err) {
            error = err instanceof Error ? err.message : '로드 실패';
            console.error(`Failed to load asset ${key}:`, err);
        } finally {
            loading = false;
        }
    }
    
    // Watch for isVisible changes and key changes
    $: if (isVisible && key) {
        if (cachedKey !== key) {
            dataURL = ''; // Clear old data when key changes
        }
        loadAsset();
    } else if (!isVisible) {
        // Optionally unload when not visible
        // dataURL = '';
        // error = null;
    }
    
    function handleMediaLoaded() {
        if (autoplay) {
            const element = videoElement || audioElement;
            if (element) {
                element.play().catch(err => {
                    console.warn('Autoplay was prevented:', err);
                });
            }
        }
    }
    
    onDestroy(() => {
        // Clean up if needed
    });
</script>

<div class="{width} {height} flex items-center justify-center bg-zinc-900">
    {#if loading}
        <Loading size="medium" />
    {:else if error}
        <div class="w-full h-full flex flex-col items-center justify-center text-red-400 gap-2">
            <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span class="text-sm">{error}</span>
        </div>
    {:else if dataURL}
        {#if type === InlayType.Image}
            <img
                src={dataURL}
                alt="Asset"
                class="{width} {height} {objectFit}"
                draggable="false"
            />
        {:else if type === InlayType.Video}
            <video
                bind:this={videoElement}
                src={dataURL}
                class="{width} {height} {objectFit} bg-black"
                controls={showControls}
                {autoplay}
                {loop}
                {muted}
                preload="metadata"
                playsinline
                on:loadedmetadata={handleMediaLoaded}
            >
                <track kind="captions" />
                해당 브라우저는 비디오를 지원하지 않습니다.
            </video>
        {:else if type === InlayType.Audio}
            <div class="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-zinc-800 to-zinc-900">
                <!-- Audio Visualizer Icon -->
                <div class="mb-6 flex items-end justify-center gap-1 h-24">
                    {#each Array(7) as _, i}
                        <div 
                            class="w-2 bg-blue-500 rounded-full animate-pulse"
                            style="height: {20 + (i % 3) * 20}px; animation-delay: {i * 0.1}s;"
                        />
                    {/each}
                </div>
                
                <!-- Audio Element -->
                <audio
                    bind:this={audioElement}
                    src={dataURL}
                    class="w-full max-w-md"
                    controls={showControls}
                    {autoplay}
                    {loop}
                    preload="metadata"
                    on:loadedmetadata={handleMediaLoaded}
                >
                    해당 브라우저는 오디오를 지원하지 않습니다.
                </audio>
            </div>
        {:else}
            <div class="w-full h-full flex flex-col items-center justify-center text-red-500 gap-2">
                <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.cap 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span class="text-sm">지원하지 않는 형식</span>
            </div>
        {/if}
    {:else}
        <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-400">
            <span class="text-sm">로드 대기 중...</span>
        </div>
    {/if}
</div>

<style>
    /* Custom audio controls styling */
    audio::-webkit-media-controls-panel {
        background-color: rgba(255, 255, 255, 0.1);
    }
    
    video::-webkit-media-controls-panel {
        background-color: rgba(0, 0, 0, 0.7);
    }
    
    /* Smooth animations for audio visualizer */
    @keyframes pulse {
        0%, 100% {
            opacity: 0.4;
            transform: scaleY(0.8);
        }
        50% {
            opacity: 1;
            transform: scaleY(1.2);
        }
    }
</style>