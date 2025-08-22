<script>
    import { Download } from '@lucide/svelte'
    import { onMount } from 'svelte'

    let deferredPrompt = $state(null)
    let canInstall = $state(false)
    let isStandalone = $state(false)

    onMount(() => {
        // Check if app is already installed
        isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator['standalone'] === true

        if (isStandalone) return

        // Listen for beforeinstallprompt
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault()
            deferredPrompt = e
            canInstall = true
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        // Cleanup
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        }
    })

    let handleInstall = $state(async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        
        if (outcome === 'accepted') {
            console.log('App installed')
        }
        
        deferredPrompt = null
        canInstall = false
    })

    export { canInstall, handleInstall, isStandalone }
</script>

{#if canInstall && !isStandalone}
    <button
        onclick={handleInstall}
        class="btn btn-primary btn-sm gap-2"
        title="Install CicloMappa as an app"
    >
        <Download class="h-4 w-4" />
        Install App
    </button>
{/if}
