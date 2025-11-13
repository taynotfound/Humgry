# Humngry 🍽️ [![wakatime](https://wakatime.com/badge/user/c79782f6-783d-42c2-aa21-a35d975705b5/project/6d957eac-d9fa-4a69-8507-51c911892a4f.svg)](https://wakatime.com/badge/user/c79782f6-783d-42c2-aa21-a35d975705b5/project/6d957eac-d9fa-4a69-8507-51c911892a4f)

**Never forget to eat again!** A comprehensive meal tracking and nutrition management app designed for people who get absorbed in work and forget to eat. Features smart meal predictions, gamification, recipe discovery, weekly challenges, detailed analytics, and meal planning.

Perfect for anyone who:
- Gets lost in work and skips meals
- Has irregular eating patterns
- Wants to track nutrition and build healthy habits
- Enjoys gamification and challenges
- Needs recipe inspiration and meal planning
- Wants detailed insights into their eating patterns

## Features

### 🍴 Food Tracking
- **OpenFoodFacts Integration**: Search from 2+ million food products with real nutritional data
- **Smart Next Meal Algorithm**: Predicts when you should eat next based on calories, macros, portion size, and fullness
- **Food Images**: Real product images from OpenFoodFacts database
- **Quick Add**: Fast meal logging with common foods
- **Water Tracking**: Track your daily water intake (8 glasses goal)
- **Detailed Meal History**: View, search, filter, and delete past meals with full nutritional breakdown
- **Meal Comparison**: Select and compare multiple meals side-by-side

### 🏆 Gamification & Progress
- **XP System**: Earn XP for every meal logged
- **Level Progression**: Level up from 1 to 15+ with unique titles (Nutrition Novice → Master Chef → Legend)
- **Daily Quests**: Complete daily challenges for bonus XP (log 3 meals, hit protein goals, drink water, etc.)
- **Weekly Challenges**: 40+ diverse challenges with progress tracking and XP rewards
- **Achievements & Badges**: Unlock achievements and collect badges as you progress
- **Streak Tracking**: Maintain daily and weekly meal logging streaks

### 📊 Analytics & Insights
- **Nutrition Score Card**: Daily grading system (A-F) for calories, protein, fiber, and budget
- **Smart Insights**: AI-powered hunger analysis and eating pattern detection
- **Cost Analysis**: Track food spending, cost per calorie, and monthly breakdowns
- **Detailed Stats**: Calories, macros, meal frequency, weekly trends, and more
- **Visual Charts**: Bar charts for weekly calorie trends and meal frequency by hour
- **Eating Patterns**: Discover your most active eating hours and habits

### 🍳 Recipes & Meal Planning
- **Recipe Discovery**: Browse 1000+ recipes from TheMealDB API
- **Recipe Search & Filters**: Search by name or filter by category (Breakfast, Vegetarian, Seafood, etc.)
- **Recipe Cost Estimation**: Automatic cost and prep time estimates for each recipe
- **Weekly Meal Planner**: Plan meals for each day of the week (breakfast, lunch, dinner)
- **Shopping List Generator**: Auto-generate shopping lists from your meal plan with ingredient tracking
- **Export Shopping List**: Share to Bring!, AnyList, OurGroceries, or any app
- **Favorites**: Save your favorite recipes for quick access

### 🎨 Customization & Settings
- **Themes**: Dark mode and light mode (beta) support
- **Custom Accent Colors**: Choose from 5 presets or use custom hex colors with color picker
- **Text Size Options**: Small, Normal, or Large text for accessibility
- **High Contrast Mode**: Enhanced visibility option
- **Configurable Goals**: Set custom calorie, protein, fiber, and budget targets
- **Sleep Hours**: Customize quiet hours for notifications

### 🔔 Smart Notifications
- **Meal Reminders**: Get notified when it's time to eat
- **Water Reminders**: Stay hydrated with periodic reminders
- **Quest Reminders**: Don't miss daily quest completions
- **Challenge Updates**: Get notified about challenge progress
- **Streak Alerts**: Maintain your streaks
- **Quiet Hours**: Respects your sleep schedule (customizable)
- **Frequency Control**: Choose low, medium, or high notification frequency

### 🎯 Additional Features
- **Floating Navigation**: Quick access menu to all app sections
- **Meal Tagging**: Organize meals with tags (Breakfast, Lunch, Dinner, Snack, Takeout, etc.)
- **Mood & Ratings**: Track how meals made you feel and rate them
- **Cost Tracking**: Log meal costs with category markers ($-$$$$)
- **Notes**: Add custom notes to any meal
- **Data Export**: Export your meal history and stats
- **Social Sharing**: Share achievements, level-ups, perfect days, and streaks
- **Smooth Animations**: Polished UI with fade-in effects and transitions

## Tech Stack

- **Expo SDK 54** with React Native 0.81.5 & React 19
- **React Native Paper 5.14** for Material Design 3 UI components
- **Expo Router 6** for file-based navigation with typed routes
- **AsyncStorage** for local data persistence
- **Expo Notifications** for smart meal reminders
- **date-fns 3.6** for date formatting and calculations
- **Reanimated Color Picker** for custom color selection
- **React Native Reanimated** for smooth animations
- **TheMealDB API** for recipe data
- **OpenFoodFacts API** for food product database

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm start
   ```

## Running the App

### Development Mode

```bash
npm start
```

This opens the Expo developer tools. From here you can:
- Press `w` to open in web browser
- Press `a` to open in Android emulator/device
- Press `i` to open in iOS simulator (macOS only)
- Scan QR code with Expo Go app

### Web

```bash
npm run web
```

Opens at [http://localhost:8081](http://localhost:8081)

### Android

```bash
npm run android
```

Requirements:
- Android Studio with SDK tools
- Android emulator running OR physical device with USB debugging

### iOS (macOS only)

```bash
npm run ios
```

Requirements:
- Xcode installed
- iOS Simulator

### Building for Production

```bash
npm run build:apk          # Build APK via EAS
npm run build:apk-local    # Build APK locally
```

## How It Works

### 🔍 Food Search & Tracking
When you type a food name, the app searches OpenFoodFacts (2M+ products) with:
- 500ms debounce for smooth searching
- Product images and brands
- Complete nutritional data (calories, protein, carbs, fat, fiber)
- Nutriscore grades (A-E rating)
- Quick add shortcuts for common foods

### 🧠 Smart Meal Prediction Algorithm
Calculates when you should eat next based on:

**Nutritional Factors:**
- **Calories**: Higher energy = longer satiety (600+ kcal adds 1.5 hours)
- **Protein**: Slows digestion (25g+ adds 1 hour)
- **Fiber**: Promotes fullness (10g+ adds 0.5 hours)
- **Fat**: Significantly slows digestion (20g+ adds 1 hour)
- **Carbs**: Quick energy, faster digestion

**Personal Factors:**
- **Portion Size**: Small (-30 min), Medium (baseline), Large (+30 min)
- **Fullness Rating**: 1-5 scale (±30 min at extremes)
- **Time of Day**: Different intervals for breakfast/lunch/dinner
- **Sleep Schedule**: Respects quiet hours (configurable)

**Advanced Features:**
- Pattern recognition based on your eating history
- Hunger score calculation (1-10 scale)
- Food effectiveness analysis (which foods keep you full longer)

### 🎮 XP & Leveling System
- **XP Gain**: Earn XP for logging meals and completing challenges
- **15 Levels**: From "Nutrition Novice" to "Legendary Master Chef"
- **Progressive Unlocks**: New features unlock as you level up
- **Daily Quests**: 4 quests per day (log meals, hit goals, drink water, stay in budget)
- **Weekly Challenges**: 40+ challenges with varying difficulty (easy/medium/hard)
- **Challenge Types**: Nutrition-based, habit-building, special achievements

### 📈 Nutrition Scoring System
Daily scorecard with A-F grades for:
- **Calories**: Hit your target without going over
- **Protein**: Meet your daily protein goals
- **Fiber**: Ensure adequate fiber intake
- **Budget**: Stay within your food spending limit

Earn XP daily based on your overall nutrition score.

### 🍳 Recipe Integration
- Fetches recipes from TheMealDB API
- AI-powered cost estimation based on ingredients
- Prep time calculation
- Servings estimation
- Cost per serving analysis
- Categories: Breakfast, Vegetarian, Seafood, Chicken, Beef, Pasta, Dessert, Vegan

### 💾 Data Management
All data stored locally using AsyncStorage:
- Meal entries with full nutritional data
- XP and level progression
- Challenge completion history
- Meal plan for the week
- User preferences and settings
- Custom nutrition targets
- No cloud sync - your data stays on your device

## Project Structure

```
app/
  (tabs)/
    index.tsx          # Main tracker screen with FoodPicker, water tracking, quick add
    history.tsx        # History screen with search, filters, comparison, delete
    stats.tsx          # Detailed stats with badges, streaks, charts, budget tracking
    scorecard.tsx      # Daily nutrition scoring with A-F grades and XP
    challenges.tsx     # Weekly challenges with progress tracking
    goals.tsx          # Goals management, daily quests, and meal planner
    insights.tsx       # Hunger analysis, cost analysis, eating patterns
    recipes.tsx        # Recipe discovery with search, filters, favorites
    settings.tsx       # App settings, customization, notifications, about
  _layout.tsx          # Root layout with settings context
  about.tsx            # About page with developer info
  modal.tsx            # Modal screens

components/
  FloatingNav.tsx      # Floating navigation menu overlay
  FoodPicker.tsx       # OpenFoodFacts search with autocomplete (500ms debounce)
  MealDetailModal.tsx  # Modal for viewing/editing meal details
  MealComparisonModal.tsx  # Modal for comparing multiple meals
  Charts.tsx           # Bar chart component for analytics
  ColorPickerWheel.tsx # Color picker for customization
  Stats.tsx            # Stats display component
  ui/                  # Reusable UI components

hooks/
  useEntries.ts        # Meal entries management with CRUD operations
  useGameProgress.ts   # XP, levels, and challenge completion
  useLevels.ts         # Level progression calculations
  useNutritionTargets.ts  # Custom nutrition goal management
  use-color-scheme.ts  # Theme detection

contexts/
  settings-context.tsx # Global settings (theme, colors, text size, contrast)

services/
  openfoodfacts.ts     # OpenFoodFacts API integration & meal prediction
  recipes.ts           # TheMealDB API integration
  socialChallenges.ts  # Challenge system with 40+ challenges
  nutritionScoreCard.ts  # Daily scoring and grading system
  hungerAnalysis.ts    # Hunger score calculation and food effectiveness
  costAnalysis.ts      # Food cost tracking and budget analysis
  advancedAlgorithms.ts  # ML-like pattern recognition and predictions
  recipeCostEstimator.ts  # Recipe cost and prep time estimation
  notifications.ts     # Smart notification scheduling
  sharing.ts           # Social sharing functionality

constants/
  theme.ts             # Theme definitions
  themes.ts            # Color schemes
```

## Platform-Specific Features

### Android (Recommended Platform)
- Full notification support with customizable meal reminders
- Scheduled push notifications for breakfast, lunch, and dinner
- All features fully optimized and tested
- Native performance with smooth animations
- Material Design 3 rendering optimized for Android

### iOS
- All core features supported
- Notification support available
- Material Design 3 components render slightly differently
- Less extensively tested than Android

### Web
- Meal logging, tracking, and stats fully functional
- Recipe discovery and meal planning work perfectly
- Notifications logged to console only (browser limitation)
- No native sharing functionality
- AsyncStorage works via browser local storage
- Touch interactions may feel slightly different
- Some Material Design 3 components render with web adaptations

## Screenshots & UI

The app features a modern Material Design 3 interface with extensive customization:

### Design System
- **Material Design 3** with Paper 5.14 components
- **Customizable themes**: Light, Dark, System, High Contrast Light/Dark
- **Custom accent colors**: Pick any color with hex support
- **Text size options**: Small, Medium, Large
- **Floating navigation**: Quick access to all 10 screens
- **Smooth animations**: React Native Reanimated for 60fps transitions

### Visual Elements
- **Color-coded cards**: Different colors for challenges, recipes, meals
- **Progress indicators**: Bars, charts, and percentage displays
- **Emojis throughout**: Visual feedback and gamification (🎮, 🏆, 🔥, 📊)
- **Product images**: Real product photos from OpenFoodFacts
- **Nutriscore badges**: A-E rating with color coding (green to red)
- **Grade display**: A-F scoring for daily nutrition on scorecard
- **Badge system**: 15+ achievement badges with progress tracking
- **Level badges**: Visual XP progression with level numbers

### Interactive Components
- **Segmented buttons**: Portion sizes and meal ratings
- **Chip filters**: Category, dietary, search filters
- **Search bars**: Real-time product and recipe search
- **Modal dialogs**: Detailed meal information and comparisons
- **Expandable cards**: Collapsible sections for organized content
- **Radio buttons**: Day selection for meal planning
- **Color picker wheel**: 360° hue selection with brightness control

## Known Issues

### Platform Limitations
- **Web notifications**: Browser push notifications not implemented (logged to console only)
- **iOS testing**: Less extensively tested than Android, may have minor visual differences

### Data Quality
- **OpenFoodFacts variability**: Database quality varies by region and product
- **Incomplete nutrition data**: Some products missing protein, fiber, or other nutrients
- **Recipe accuracy**: TheMealDB data sometimes lacks precise nutritional information
- **Cost estimation**: Recipe costs are estimates based on average prices

### Features Not Yet Implemented
- **Cloud sync**: All data is local only (no backup or cross-device sync)
- **User accounts**: No authentication system
- **Social features**: Sharing is basic (no following, comments, or social feed)
- **Barcode scanning**: Not yet implemented (planned feature)
- **Photo upload**: No meal photo capture/storage
- **Export formats**: Limited to CSV only (no PDF or other formats)


## Developer

Created with ❤️ by **Tay März**

🌐 [taymaerz.de](https://taymaerz.de)

Built to help people who forget to eat maintain healthy eating habits through gamification, smart tracking, and gentle reminders.

### Development Transparency

This project was developed with the assistance of **Generative AI** (GitHub Copilot and Claude) to:
- Help write and structure code across 60+ files
- Generate and maintain this README documentation
- Assist with implementing complex algorithms (meal prediction, hunger analysis, cost tracking)
- Design and refine the gamification system
- Improve code quality, TypeScript types, and best practices
- Debug issues and optimize performance

The core architecture, feature requirements, design system, and all creative decisions were made by the developer. AI served as a coding assistant, documentation tool, and technical advisor to accelerate development and maintain code quality.

## Learn More

### Official Documentation
- [Expo Documentation](https://docs.expo.dev/) - Cross-platform React Native framework
- [React Native Paper](https://callstack.github.io/react-native-paper/) - Material Design 3 components
- [Expo Router](https://docs.expo.dev/router/introduction/) - File-based navigation
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) - Local notifications
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) - Advanced animations

### APIs Used
- [OpenFoodFacts API](https://world.openfoodfacts.org/data) - 2M+ food products database
- [TheMealDB API](https://www.themealdb.com/api.php) - Recipe database

### Community Resources
- [Expo Discord](https://chat.expo.dev/) - Community support
- [React Native Community](https://reactnative.dev/community/overview) - RN resources
