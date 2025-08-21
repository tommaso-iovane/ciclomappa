<script>
    let { show = $bindable(true) } = $props()
</script>

{#if show}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div class="flex flex-col items-center">
            <div class="h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <span class="mt-4 text-lg font-semibold text-blue-700">Loading...</span>
            <span class="mt-4 font-semibold text-gray-600">Be sure to enable and allow gps tracking</span>
        </div>
    </div>
{/if}
