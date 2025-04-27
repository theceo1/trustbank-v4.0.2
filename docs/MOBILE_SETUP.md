# Mobile App Setup Guide

## Overview
Based on the existing web application architecture, we recommend creating a separate React Native project for the mobile app while maintaining code sharing capabilities with the web version.

## Project Structure

```
trustbank/
├── web/                 # Current Next.js web application
└── mobile/              # New React Native application
    ├── src/
    │   ├── shared/      # Shared business logic with web
    │   ├── components/   # Native UI components
    │   ├── screens/     # Mobile app screens
    │   └── services/    # Mobile-specific services
    └── package.json
```

## Recommended Approach

### 1. Create Separate Mobile Project
- Initialize a new React Native project using Expo
- Keep it in a separate repository for independent versioning
- Use monorepo tools like Turborepo for shared code management

### 2. Code Sharing Strategy

Shared Business Logic:
- Authentication flows
- API integrations
- Wallet management
- Transaction processing
- Data validation

Platform-Specific Implementation:
- UI components
- Navigation
- Native features (biometrics, push notifications)
- Platform-specific optimizations

### 3. Technical Considerations

#### Authentication
- Adapt Supabase authentication for mobile
- Implement secure token storage using native keystores
- Add biometric authentication support

#### State Management
- Reuse existing state management patterns
- Implement offline support for mobile
- Handle mobile-specific state requirements

#### API Integration
- Share API service layer with web app
- Implement mobile-specific error handling
- Add request caching for offline support

#### Security
- Implement certificate pinning
- Add jailbreak/root detection
- Secure local storage implementation

## Getting Started

1. Create new React Native project:
```bash
npx create-expo-app@latest -e with-typescript trustbank-mobile
```

2. Install core dependencies:
```bash
cd trustbank-mobile
npm install @supabase/supabase-js @react-navigation/native react-native-safe-area-context
```

3. Set up shared code structure:
```bash
mkdir -p src/shared src/components src/screens src/services
```

## Development Workflow

1. Start with core features:
   - Authentication
   - Wallet display
   - Basic transactions

2. Implement platform-specific features:
   - Biometric authentication
   - Push notifications
   - Native navigation

3. Optimize for mobile:
   - Performance optimization
   - Offline support
   - Mobile-specific UX

## Best Practices

1. Mobile-First Design
   - Follow platform design guidelines
   - Optimize for touch interactions
   - Consider offline states

2. Code Organization
   - Clear separation of shared/platform-specific code
   - Consistent naming conventions
   - Proper type definitions

3. Testing
   - Unit tests for shared logic
   - Integration tests for native features
   - E2E testing with native capabilities

## Next Steps

1. Set up the initial React Native project
2. Configure shared code structure
3. Implement core authentication flow
4. Add basic wallet functionality
5. Develop mobile-specific features