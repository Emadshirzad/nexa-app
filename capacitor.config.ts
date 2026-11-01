import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nexa.crm',
  appName: 'Nexa CRM',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    CapacitorSQLite: {
      androidIsEncryption: true,
      androidBiometric: {
        biometricAuth: false,
        biometricTitle: 'Nexa CRM Biometric Authentication',
        biometricSubTitle: 'احراز هویت بیومتریک نکسا'
      }
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_nexa',
      iconColor: '#10B981',
      sound: 'beep.wav'
    }
  }
};

export default config;
