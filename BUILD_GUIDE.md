# 🏗️ Building Humngry APK

## Prerequisites

1. **Install EAS CLI** (if not already installed):
```bash
npm install -g eas-cli
```

2. **Login to Expo**:
```bash
eas login
```

## Build Commands

### Option 1: Cloud Build (Recommended)
Build the APK on Expo's servers (no local Android setup needed):

```bash
npm run build:apk
```

This will:
- Build a development APK on Expo's cloud servers
- Take about 10-15 minutes
- Download the APK automatically when complete
- No need for Android Studio or Java SDK

### Option 2: Local Build
Build the APK on your local machine (requires Android SDK):

```bash
npm run build:apk-local
```

**Requirements for local build:**
- Android Studio installed
- Android SDK configured
- Java JDK 17+
- Environment variables set (ANDROID_HOME, JAVA_HOME)

## Build Profiles

### Preview Profile (Default)
- Creates installable APK
- Internal distribution
- Development-ready
- Run: `npm run build:apk`

### Production Profile
- Creates App Bundle (.aab) for Play Store
- Production-ready
- Run: `eas build --platform android --profile production`

## After Building

1. **Download the APK**: After the build completes, EAS will provide a download link
2. **Transfer to Phone**: 
   - Email the APK to yourself
   - Use USB transfer
   - Use cloud storage (Google Drive, Dropbox)
3. **Install**: 
   - Enable "Install from Unknown Sources" in Android settings
   - Tap the APK file to install
   - Accept permissions

## Build Status

Check build status:
```bash
eas build:list
```

## Troubleshooting

### Build Failed?
- Check the build logs on the Expo website
- Ensure your `app.json` has all required fields
- Verify you're logged into the correct Expo account

### Can't Install APK?
- Enable "Install Unknown Apps" for your file manager
- Check if you have enough storage space
- Try a different file transfer method

## Configuration Files

- `eas.json` - Build configuration profiles
- `app.json` - App metadata and settings
- `package.json` - Build scripts

## Quick Reference

```bash
# Build preview APK (cloud)
npm run build:apk

# Build locally
npm run build:apk-local

# Check builds
eas build:list

# Cancel a build
eas build:cancel

# View build details
eas build:view [build-id]
```

## Notes

- First build takes longer (15-20 min)
- Subsequent builds are faster (10-15 min)
- APK size: approximately 50-70 MB
- Cloud builds require internet connection
- Local builds are faster but need setup
