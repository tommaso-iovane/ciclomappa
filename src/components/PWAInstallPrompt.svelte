<script>
    import { onMount } from 'svelte'
    import { Download, X, RefreshCw } from '@lucide/svelte'

    let deferredPrompt = $state(null)
    let showInstallPrompt = $state(false)
    let showUpdatePrompt = $state(false)
    let isInstalled = $state(false)
    let isIOS = $state(false)
    let isStandalone = $state(false)
    let updateSW = $state(null)

    onMount(() => {
        // Check if app is already installed/running in standalone mode
        isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator['standalone'] === true

        // Check if it's iOS
        isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

        // Don't show install prompt if already installed
        if (isStandalone) {
            isInstalled = true
        }

        // Import and register SW with update handling
        import('virtual:pwa-register').then(({ registerSW }) => {
            updateSW = registerSW({
                immediate: true,
                onNeedRefresh() {
                    showUpdatePrompt = true
                },
                onOfflineReady() {
                    console.log('App ready to work offline')
                }
            })
        }).catch((err) => {
            console.log('PWA register not available:', err)
        })

        // Listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault()
            // Save the event so it can be triggered later
            deferredPrompt = e
            
            // Only show if not dismissed recently and not installed
            if (!isStandalone && shouldShowPrompt()) {
                setTimeout(() => {
                    showInstallPrompt = true
                }, 3000) // Show after 3 seconds
            }
        }

        // Listen for app being installed
        const handleAppInstalled = () => {
            showInstallPrompt = false
            isInstalled = true
            deferredPrompt = null
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.addEventListener('appinstalled', handleAppInstalled)

        // For iOS, show install hint if not in standalone mode
        if (isIOS && !isStandalone && shouldShowPrompt()) {
            setTimeout(() => {
                showInstallPrompt = true
            }, 5000) // Show after 5 seconds on iOS
        }

        // Cleanup
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
            window.removeEventListener('appinstalled', handleAppInstalled)
        }
    })

    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        // Show the install prompt
        deferredPrompt.prompt()

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt')
        } else {
            console.log('User dismissed the install prompt')
        }

        // Clear the deferred prompt
        deferredPrompt = null
        showInstallPrompt = false
    }

    const dismissInstallPrompt = () => {
        showInstallPrompt = false
        // Store dismissal in localStorage to not show again for a while
        localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    }

    const handleUpdateClick = () => {
        if (updateSW) {
            updateSW(true) // Force update
        }
        showUpdatePrompt = false
    }

    const dismissUpdatePrompt = () => {
        showUpdatePrompt = false
    }

    // Check if user has dismissed the install prompt recently (within 7 days)
    const shouldShowPrompt = () => {
        const dismissedTime = localStorage.getItem('pwa-install-dismissed')
        if (!dismissedTime) return true
        
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
        return parseInt(dismissedTime) < sevenDaysAgo
    }
</script>

<!-- PWA Update Prompt -->
{#if showUpdatePrompt}
    <div class="fixed top-4 left-4 right-4 z-50 mx-auto max-w-sm">
        <div class="rounded-lg bg-blue-50 p-4 shadow-lg border border-blue-200">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <div class="flex items-center">
                        <RefreshCw class="h-5 w-5 text-blue-600 mr-2" />
                        <h3 class="text-sm font-medium text-blue-900">Update Available</h3>
                    </div>
                    <p class="mt-1 text-xs text-blue-700">
                        A new version of CicloMappa is available. Update now for the latest features.
                    </p>
                </div>
                <button
                    onclick={dismissUpdatePrompt}
                    class="ml-3 flex-shrink-0 rounded-md bg-blue-50 text-blue-400 hover:text-blue-600"
                >
                    <X class="h-4 w-4" />
                </button>
            </div>
            <div class="mt-3 flex space-x-2">
                <button
                    onclick={handleUpdateClick}
                    class="flex-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                >
                    Update
                </button>
                <button
                    onclick={dismissUpdatePrompt}
                    class="flex-1 rounded-md bg-blue-100 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-200"
                >
                    Later
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- PWA Install Prompt for Android/Desktop -->
{#if showInstallPrompt && deferredPrompt && !isInstalled}
    <div class="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
        <div class="rounded-lg bg-white p-4 shadow-lg border border-gray-200">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <div class="flex items-center">
                        <Download class="h-5 w-5 text-blue-600 mr-2" />
                        <h3 class="text-sm font-medium text-gray-900">Install CicloMappa</h3>
                    </div>
                    <p class="mt-1 text-xs text-gray-600">
                        Install this app on your device for a better experience and offline access.
                    </p>
                </div>
                <button
                    onclick={dismissInstallPrompt}
                    class="ml-3 flex-shrink-0 rounded-md bg-white text-gray-400 hover:text-gray-600"
                >
                    <X class="h-4 w-4" />
                </button>
            </div>
            <div class="mt-3 flex space-x-2">
                <button
                    onclick={handleInstallClick}
                    class="flex-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                >
                    Install
                </button>
                <button
                    onclick={dismissInstallPrompt}
                    class="flex-1 rounded-md bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200"
                >
                    Not now
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- iOS Install Instructions -->
{#if isIOS && !isStandalone && showInstallPrompt}
    <div class="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
        <div class="rounded-lg bg-white p-4 shadow-lg border border-gray-200">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <div class="flex items-center">
                        <Download class="h-5 w-5 text-blue-600 mr-2" />
                        <h3 class="text-sm font-medium text-gray-900">Install CicloMappa</h3>
                    </div>
                    <p class="mt-1 text-xs text-gray-600">
                        To install this app: tap <span class="font-medium">Share</span> then 
                        <span class="font-medium">"Add to Home Screen"</span>
                    </p>
                </div>
                <button
                    onclick={dismissInstallPrompt}
                    class="ml-3 flex-shrink-0 rounded-md bg-white text-gray-400 hover:text-gray-600"
                >
                    <X class="h-4 w-4" />
                </button>
            </div>
            <div class="mt-3">
                <button
                    onclick={dismissInstallPrompt}
                    class="w-full rounded-md bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200"
                >
                    Got it
                </button>
            </div>
        </div>
    </div>
{/if}
