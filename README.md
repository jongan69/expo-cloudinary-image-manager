# Cloudinary Image Manager

A modern, cross-platform Expo React Native application for managing Cloudinary images. Upload, view, and edit image metadata with a beautiful, performant interface that works seamlessly on iOS, Android, and Web.

## ✨ Features

- 🔐 **Secure Authentication** - Email-based sign-in with Clerk (verification code flow)
- 📸 **Image Upload** - Direct upload to Cloudinary using unsigned upload presets
- 🖼️ **Photo Gallery** - Browse images with optimized thumbnails and smooth scrolling
- ✏️ **Metadata Editing** - Edit descriptions and tags for existing images
- 🔒 **Secure Storage** - API credentials stored securely using Expo SecureStore
- ⚡ **Performance Optimized** - FlashList for native, FlatList for web, image caching, and optimized Cloudinary URLs
- 🌐 **Cross-Platform** - Works on iOS, Android, and Web with platform-specific optimizations
- 💾 **Offline Support** - Photo list caching for faster load times

## 🛠️ Tech Stack

- **Framework**: Expo SDK 54 with React Native 0.81.5
- **Routing**: Expo Router (file-based routing)
- **Authentication**: Clerk Expo SDK (email verification code)
- **Image Management**: Cloudinary API
- **Image Loading**: expo-image (optimized image component)
- **Lists**: @shopify/flash-list (native) / FlatList (web)
- **Storage**: 
  - AsyncStorage (non-sensitive data)
  - Expo SecureStore (API credentials)
- **Language**: TypeScript
- **Styling**: React Native StyleSheet

## 📋 Prerequisites

- **Node.js** 18+ and **Bun** (or npm/yarn)
- **Expo CLI**: `bun install -g expo-cli` (optional, but recommended)
- **Cloudinary Account** - [Sign up here](https://cloudinary.com/)
- **Clerk Account** - [Sign up here](https://clerk.com/) for authentication

## 🚀 Installation

1. **Clone the repository** (or navigate to the project directory)

2. **Install dependencies**:
```bash
bun install
```

3. **Set up environment variables**:
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
```

4. **Start the development server**:
```bash
# Start Expo dev server
bun start

# Or for web specifically
bun web
# or
bun dev:web
```

## ⚙️ Configuration

### Cloudinary Setup

1. **Create an Unsigned Upload Preset**:
   - Log into your [Cloudinary Dashboard](https://cloudinary.com/console)
   - Navigate to **Settings → Upload → Upload presets**
   - Click **"Add upload preset"**
   - Set **Signing mode** to **"Unsigned"**
   - Configure **Folder**: `Modeling` (or your preferred folder)
   - Save and note the preset name

2. **Get API Credentials** (for metadata editing):
   - In Cloudinary Dashboard, go to **Settings → Security**
   - Copy your **API Key** and **API Secret**

### Clerk Setup

1. **Create a Clerk Application**:
   - Sign up at [clerk.com](https://clerk.com/)
   - Create a new application
   - Configure authentication methods:
     - Enable **"Sign-in with email"**
     - Enable **"Email verification code"** as the sign-in method
   - Copy your **Publishable Key** to `.env`

## 📱 Usage

### First Time Setup

1. **Sign In**:
   - Enter your email address
   - Check your email for the verification code
   - Enter the 6-digit code to sign in

2. **Configure Cloudinary** (Settings tab):
   - **Cloud Name** (required) - Your Cloudinary cloud name
   - **Upload Preset** (required) - Your unsigned upload preset name
   - **Folder Name** (optional) - Defaults to "Modeling"
   - **API Key** (optional) - Required for editing metadata
   - **API Secret** (optional) - Required for editing metadata

### Uploading Images

1. Navigate to the **Upload** tab
2. Tap **"Select Image"** to choose from your device
3. Optionally add:
   - **Description** - Image description
   - **Tags** - Comma-separated tags (e.g., `commercial, fashion, lifestyle`)
4. Tap **"Upload to Modeling Folder"**
5. Wait for upload confirmation

### Viewing Photos

1. Navigate to the **Photos** tab
2. Browse your image gallery (optimized thumbnails)
3. Pull down to refresh and fetch latest images
4. Tap any image to view details

### Editing Metadata

1. Open a photo from the **Photos** tab
2. Edit the **Description** and/or **Tags**
3. Tap **"Save Changes"** when ready
4. Changes are synced to Cloudinary

**Note**: Metadata editing requires API Key and API Secret to be configured in Settings.

## 🏗️ Architecture

### Project Structure

```
src/
├── app/
│   ├── (auth)/              # Authentication routes
│   │   ├── sign-in.tsx     # Email code sign-in
│   │   └── sign-up.tsx     # User registration
│   ├── (tabs)/             # Main app tabs
│   │   ├── photos.tsx      # Photo gallery
│   │   ├── upload.tsx      # Image upload
│   │   └── settings.tsx    # Cloudinary configuration
│   ├── photo/
│   │   └── [id].tsx        # Photo detail/edit screen
│   ├── api/                # API routes
│   │   ├── fetch-photos+api.ts    # Fetch photos from Cloudinary
│   │   └── update-metadata+api.ts  # Update image metadata
│   └── _layout.tsx         # Root layout with ClerkProvider
├── components/
│   ├── SecureTextInput.tsx # Password input with visibility toggle
│   └── SignOutButton.tsx   # Sign out component
├── services/
│   ├── cloudinaryService.ts # Cloudinary API integration
│   └── uploadService.ts     # Image upload logic
├── utils/
│   ├── storage.ts          # Credential storage (SecureStore/AsyncStorage)
│   ├── imageOptimization.ts # Cloudinary URL optimization
│   └── photoCache.ts        # Photo list caching
└── types/
    └── index.ts            # TypeScript type definitions
```

### Key Components

- **Expo Router**: File-based routing with nested layouts
- **Clerk Provider**: Authentication context for the entire app
- **API Routes**: Server-side functions for Cloudinary Admin API operations
- **Image Optimization**: Automatic Cloudinary transformations for performance
- **Caching**: AsyncStorage-based caching for photo lists (5-minute TTL)

## ⚡ Performance Optimizations

- **FlashList** (native) / **FlatList** (web) - High-performance list rendering
- **expo-image** - Optimized image loading with disk caching
- **Cloudinary Transformations** - Automatic format and quality optimization
- **Photo List Caching** - Reduces API calls with 5-minute cache
- **Memoized Components** - Prevents unnecessary re-renders
- **Optimized Thumbnails** - Smaller images for grid view (300px)
- **Lazy Loading** - Images load as you scroll

## 🌐 Platform Support

### Web
- Runs in browser with `bun web` or `expo start --web`
- Uses FlatList (FlashList doesn't support web)
- SecureStore falls back to AsyncStorage
- Full feature parity with native

### iOS
- Native performance with FlashList
- SecureStore for encrypted credential storage
- Native image picker integration

### Android
- Native performance with FlashList
- SecureStore for encrypted credential storage
- Native image picker integration

## 🔧 Development

### Available Scripts

```bash
# Development
bun start              # Start Expo dev server
bun web                # Start web development server
bun dev:web            # Alias for web
bun dev:android        # Run on Android device
bun dev:ios            # Run on iOS device
bun dev:tunnel         # Start with tunnel (for testing on physical devices)

# Building
bun prebuild           # Generate native projects
bun build:all          # Build for all platforms (EAS)
bun export:web         # Export web build

# Code Quality
bun lint               # Run ESLint
bun lint:fix           # Fix ESLint errors
bun format             # Format with Prettier
bun format:fix         # Fix and format
bun test               # Run tests
bun test:watch         # Run tests in watch mode

# Maintenance
bun clean              # Clean node_modules and reinstall
bun doc-fix            # Check and fix Expo package versions
```

### Development Tips

- **Hot Reload**: Enabled by default in Expo
- **Debugging**: Use React Native Debugger or Chrome DevTools
- **API Routes**: Test API routes at `http://localhost:8081/api/fetch-photos` (web)
- **Caching**: Clear cache by pulling down to refresh in Photos tab

## 🚢 Production

- **Env vars**: Ensure `.env` contains `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` before building.
- **Native builds**: Run `bun build:all` (EAS) or the platform-specific EAS builds you need.
- **Web bundle**: Run `bun export:web` to generate a static web build in `dist`.
- **Versioning**: Update `app.json` version + build numbers before submitting to stores.
- **Sanity checks**:
  - `bun lint` (already configured via `.eslintrc.js`)
  - Launch `bun start --no-dev` to spot prod-only issues.
  - Test signing in/out on every platform after updating Clerk or Expo versions.

## 🔒 Security

- **API Credentials**: Stored in Expo SecureStore (encrypted, native) or AsyncStorage (web fallback)
- **Upload Presets**: Stored in AsyncStorage (non-sensitive)
- **Unsigned Uploads**: No server required for image uploads
- **API Routes**: Server-side operations require API credentials
- **Clerk Authentication**: Secure session management

## 🐛 Troubleshooting

### "No credentials" error
- Ensure Cloudinary credentials are configured in Settings
- Check that Cloud Name and Upload Preset are correct

### "API credentials required" error
- Add Cloudinary API Key and Secret in Settings to enable metadata editing
- Verify credentials are correct in Cloudinary Dashboard

### Upload fails
- Verify Upload Preset is set to "Unsigned" in Cloudinary
- Check folder name matches your Cloudinary folder structure
- Ensure you have internet connectivity

### Photos not loading
- Verify API Key and Secret are configured in Settings
- Check folder name is correct
- Try pulling down to refresh
- Check browser console (web) or Metro logs for errors

### Sign-in issues
- Verify `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is set in `.env`
- Check that Clerk is configured for email verification code sign-in
- Ensure you're checking the correct email for verification codes

### Image optimization errors (400 Bad Request)
- Fixed: Width values are now rounded to integers (Cloudinary requirement)
- If issues persist, check Cloudinary transformation syntax

### Hooks order errors
- Fixed: All hooks are now called before any early returns
- If you see this error, ensure hooks are always called in the same order

## 📦 Dependencies

### Core
- `expo` ^54.0.0
- `expo-router` ~6.0.15
- `react` 19.1.0
- `react-native` 0.81.5

### Authentication
- `@clerk/clerk-expo` ^2.19.2

### Image Management
- `expo-image` ^3.0.10
- `cloudinary` ^2.8.0

### Performance
- `@shopify/flash-list` ^2.2.0
- `@react-native-async-storage/async-storage` ^2.2.0
- `expo-secure-store` ~15.0.7

### UI
- `expo-image-picker` ~17.0.8
- `react-native-safe-area-context` ~5.6.0

## 📄 License

Private project

## 🤝 Contributing

This is a private project. For issues or questions, please contact the project maintainer.

---

Built with ❤️ using Expo and React Native
# expo-cloudinary-image-manager
