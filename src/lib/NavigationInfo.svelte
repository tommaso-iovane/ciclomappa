<script>
    import { Download, MapPin, Minus, Plus, Rotate3d, Route } from '@lucide/svelte'
    import { slide } from 'svelte/transition'

    let {
        recenterOnUser,
        zoomOut,
        zoomIn,
        enableRotation = $bindable(),
        isTracking,
        toggleTracking,
        speedKmh,
        totalDistance,
        downloadRoute
    } = $props()
</script>

<div class="absolute bottom-0 z-10 flex max-h-28 w-full flex-col gap-1 rounded-t-2xl bg-white px-3 pt-3 shadow-2xl">
    <div class="flex items-center justify-between">
        <button onclick={recenterOnUser} class="btn hover:text-white">
            <MapPin size={16}></MapPin>
        </button>

        <div class="flex items-center gap-1">
            <!-- <button onclick={zoomOut} class="btn" title="Top"><Minus size={16}></Minus></button>
            <button onclick={zoomIn} class="btn" title="Left"><Plus size={16}></Plus></button> -->
            <button class:btn-secondary={enableRotation} onclick={() => (enableRotation = !enableRotation)} class="btn"
                ><Rotate3d size={16}></Rotate3d>
            </button>
            <button class:btn-secondary={isTracking} onclick={toggleTracking} class="btn"><Route size={16}></Route> </button>
            {#if isTracking}
                <button onclick={downloadRoute} transition:slide={{ duration: 200, axis: 'x' }} class="btn">
                    <Download size={16}></Download>
                </button>
            {/if}
        </div>
    </div>
    <div class="flex items-center justify-between text-gray-800">
        <div>
            <span class="font-bold">{speedKmh || 0}</span>
            <span>Km/h</span>
        </div>
        {#if isTracking}
            <div>
                <span>Total distance: </span>
                <span class="font-bold">{(totalDistance / 1000).toFixed(2)}</span>
                <span>Km</span>
            </div>
        {/if}
    </div>
</div>
