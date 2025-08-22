<script>
    import { onMount } from 'svelte'
    import CycleMap from './components/CycleMap.svelte'
    import ToastContainer from './components/ToastContainer.svelte'

    onMount(async () => {

    })
</script>


<div class="relative h-full w-full" id="main">
    <ToastContainer />

    <CycleMap></CycleMap>
</div>
