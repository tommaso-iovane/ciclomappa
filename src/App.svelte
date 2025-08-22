<script>
    import { onMount } from 'svelte'
    import CycleMap from './components/CycleMap.svelte'
    import ToastContainer from './components/ToastContainer.svelte'
    import PWAInstallPrompt from './components/PWAInstallPrompt.svelte'

    onMount(async () => {
        // Fix mobile viewport height issue
        function setViewportHeight() {
            const vh = window.innerHeight * 0.01
            document.documentElement.style.setProperty('--vh', `${vh}px`)
        }
        
        // Set initial viewport height
        setViewportHeight()
        
        // Update on resize and orientation change
        window.addEventListener('resize', setViewportHeight)
        window.addEventListener('orientationchange', () => {
            // Delay to account for browser UI changes
            setTimeout(setViewportHeight, 500)
        })

        // Enhanced PWA update checking
        if ('serviceWorker' in navigator) {
            try {
                // Listen for controlled page changes (when SW takes control)
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    console.log('New service worker activated, reloading page...')
                    window.location.reload()
                })

                // Check for updates when the page becomes visible
                document.addEventListener('visibilitychange', () => {
                    if (!document.hidden && navigator.serviceWorker.controller) {
                        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })
                    }
                })
            } catch (error) {
                console.error('PWA update setup failed:', error)
            }
        }

        // Periodic connectivity check for update availability
        if (navigator.onLine) {
            setInterval(() => {
                if (navigator.onLine && 'serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then((registrations) => {
                        registrations.forEach((registration) => {
                            if (registration.waiting) {
                                // Update available, handle it
                                console.log('Update available in waiting service worker')
                            }
                        })
                    })
                }
            }, 300000) // Check every 5 minutes
        }
    })
</script>


<div class="relative h-full w-full overflow-hidden" id="main">
    <ToastContainer />
    <PWAInstallPrompt />

    <CycleMap></CycleMap>
</div>
