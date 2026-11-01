# Nexa CRM — Android Release Signing

## 1. Keystore Generation
The release signing key must be generated once using `keytool` and stored securely outside version control:

```bash
keytool -genkey -v -keystore nexa-release-key.jks \
  -keyalg RSA -keysize 4096 -validity 10000 \
  -alias nexa-key
```

## 2. Secure Signing Configuration
In `android/keystore.properties` (added to `.gitignore`):
```properties
storeFile=../../nexa-release-key.jks
storePassword=SECURE_STORE_PASSWORD
keyAlias=nexa-key
keyPassword=SECURE_KEY_PASSWORD
```

In `android/app/build.gradle`:
```groovy
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

## 3. Verification & Checksums
Always verify APK signature and generate SHA-256 before release distribution:
```bash
apksigner verify --verbose --print-certs app-release.apk
sha256sum app-release.apk > app-release.apk.sha256
```
