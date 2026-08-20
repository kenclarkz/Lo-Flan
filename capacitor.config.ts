import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.losflan.app',
  appName: "Lo's Flan",
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      backgroundColor: '#1B120C',
      showSpinner: false,
    },
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#1B120C',
  },
}

export default config
