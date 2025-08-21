import { platform } from '@tauri-apps/plugin-os'


export const getPlatform = () => {
    try {
        return platform()
    } catch (error) {
        return 'web'
    }
}