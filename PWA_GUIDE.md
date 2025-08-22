# PWA (Progressive Web App) Installation Guide

CicloMappa is now configured as a Progressive Web App (PWA) that can be installed on users' devices for a native app-like experience.

## Features Implemented

### 1. PWA Install Prompt Component (`PWAInstallPrompt.svelte`)
- **Automatic Detection**: Detects when the app can be installed (via `beforeinstallprompt` event)
- **Cross-Platform Support**: 
  - Android/Desktop: Shows native install prompt
  - iOS: Shows instructions for manual installation via Share > "Add to Home Screen"
- **Smart Timing**: Appears after 3-5 seconds to avoid interrupting initial user experience
- **Dismissal Logic**: Remembers user dismissal for 7 days
- **Update Notifications**: Shows prompts when new app versions are available

### 2. Install Button Component (`InstallButton.svelte`)
- **Manual Install Option**: Provides an immediate install button in the InfoBox
- **Conditional Display**: Only shows when installation is possible
- **Clean Integration**: Seamlessly integrates with existing UI components

### 3. Enhanced VitePWA Configuration
- **Complete Manifest**: Includes proper app metadata, icons, and display settings
- **Offline Capabilities**: Caches essential resources for offline use
- **Auto-Updates**: Automatically updates the service worker
- **Multiple Icon Sizes**: Supports various device screen densities
- **Maskable Icons**: Adaptive icons for modern Android devices

## How It Works

### For Users on Android/Desktop:
1. Visit the app in a supported browser (Chrome, Edge, etc.)
2. After a few seconds, an install prompt will appear at the bottom
3. Users can click "Install" to add the app to their home screen/desktop
4. Alternatively, they can use the install button in the info panel

### For Users on iOS:
1. Visit the app in Safari
2. An install prompt appears with instructions
3. Users tap the Share button, then "Add to Home Screen"
4. The app icon will be added to their home screen

### For Developers:
The PWA installation prompts will automatically appear when:
- The app meets PWA installability criteria
- The user hasn't dismissed the prompt recently
- The app isn't already installed

## Testing PWA Installation

### In Development:
1. Run `npm run dev`
2. Open Chrome DevTools > Application > Manifest
3. Check if all manifest requirements are met
4. Use "Add to Home Screen" button in DevTools for testing

### In Production:
1. Deploy the app with HTTPS (required for PWA)
2. Visit in Chrome/Edge on mobile or desktop
3. Look for browser's native install prompt
4. Test the install flow

## Browser Support

- **Chrome/Chromium**: Full support for install prompts
- **Edge**: Full support for install prompts  
- **Firefox**: Basic PWA support (manual installation)
- **Safari**: iOS 11.3+ (manual installation via Add to Home Screen)

## Benefits for Users

- **Offline Access**: Basic functionality works without internet
- **Native Feel**: Runs in standalone mode without browser UI
- **Fast Loading**: Cached resources load instantly
- **Home Screen Access**: Quick access via app icon
- **Background Updates**: App stays up-to-date automatically

## Configuration Files

- `vite.config.js`: VitePWA plugin configuration
- `public/site.webmanifest`: App manifest (generated automatically)
- Service Worker: Handles caching and updates (generated automatically)

## Customization

To modify the install prompts:
1. Edit timing in `PWAInstallPrompt.svelte` (currently 3-5 seconds)
2. Adjust dismissal period (currently 7 days)
3. Customize messaging and styling
4. Add additional install contexts if needed

The PWA installation feature enhances user engagement by providing a native app experience while maintaining the accessibility of a web application.
