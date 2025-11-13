# Humngry 🍽️

**Never forget to eat again!** A smart meal tracking app designed for people who get absorbed in work and forget to eat. Uses real nutritional data to predict when you should eat next, sends gentle reminders, and makes tracking fun with gamification.

Perfect for anyone who:
- Gets lost in work and skips meals
- Has irregular eating patterns
- Needs friendly reminders to refuel
- Wants to build better eating habits
[![wakatime](https://wakatime.com/badge/user/c79782f6-783d-42c2-aa21-a35d975705b5/project/6d957eac-d9fa-4a69-8507-51c911892a4f.svg)](https://wakatime.com/badge/user/c79782f6-783d-42c2-aa21-a35d975705b5/project/6d957eac-d9fa-4a69-8507-51c911892a4f)
## Features

- 🍴 **OpenFoodFacts Integration**: Search from 2+ million food products with real nutritional data
- 🎯 **Smart Nutrition-Based Algorithm**: Calculates next meal time using calories, protein, carbs, fat, and fiber
- 🖼️ **Food Images**: See real product images from the OpenFoodFacts database
- 📊 **Comprehensive Stats**: Track calories, protein, badges, streaks, and more
- 📜 **History with Delete**: View all your meals with full nutritional breakdown, swipe to delete
- 😴 **Sleep Time Respect**: Won't notify you between 10 PM - 7 AM
- 💡 **Rotating Tips**: Get helpful nutrition tips that change every 30 seconds
- 🎮 **Gamification**: Earn 10 points per meal, unlock up to 7 badges
- 👀 **Fun UI**: Emojis, vibrant colors, motivational messages, and smooth animations
- 🌙 **Dark Mode**: Stunning Material Design 3 dark theme
- 📱 **Cross-Platform**: Works seamlessly on Web and Android

## Tech Stack

- **Expo SDK 54** with React Native 0.81
- **React Native Paper** for Material Design 3 UI components
- **Expo Router** for navigation
- **AsyncStorage** for data persistence
- **Expo Notifications** for meal reminders (Android)
- **date-fns** for date formatting

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

### Web

```bash
npm run web
```

Opens the app at [http://localhost:8081](http://localhost:8081)

### Android

```bash
npm run android
```

Make sure you have:
- Android Studio installed
- Android emulator running, or
- Physical Android device connected with USB debugging enabled

You can also use Expo Go:
1. Install Expo Go from Play Store
2. Run `npm start`
3. Scan the QR code with Expo Go

## How It Works

### OpenFoodFacts Integration

When you start typing a food name, the app searches the OpenFoodFacts database (2M+ products) and shows:
- Product name and brand
- Product image
- Calories per 100g
- Nutriscore grade (A-E rating)
- Detailed macros (protein, carbs, fat, fiber)

### Advanced Next Meal Algorithm

The app calculates your next meal time using science-based nutrition:

**Base Factors:**
- **Calories**: Higher calories = longer wait (e.g., 600+ kcal adds 1.5 hours)
- **Protein**: Slows digestion, keeps you full longer (25g+ adds 1 hour)
- **Fiber**: Also slows digestion (10g+ adds 0.5 hours)
- **Fat**: Significantly slows digestion (20g+ adds 1 hour)
- **Simple Carbs**: Digest quickly (high carbs, low protein/fat reduces wait time)

**Personal Factors:**
- **Portion size**: Small (-0.5h), Medium (baseline), Large (+0.5h)
- **Fullness rating**: 1-5 scale adjusts ±1 hour at extremes

**Sleep Respect:**
- If next meal falls between 10 PM - 7 AM, it's pushed to 7:30 AM
- Ensures you're not woken up for meal notifications

**Range**: 1-8 hours between meals

### Gamification & Stats

- **Points**: Earn 10 points for each meal logged
- **Badges**: Unlock star badges (1 star per 50 points, max 7 stars)
- **Progress Tracking**: Visual progress bar to next badge
- **Today Stats**: Meals, total calories, total protein
- **Weekly Stats**: Total meals, average meals per day
- **Motivational Messages**: Change based on your point level

### Data Storage

All data is stored locally on your device using AsyncStorage:
- Meal entries (food name, brand, nutritional data, images, timestamps)
- Points total
- Full meal history with detailed macros

## Project Structure

```
app/
  (tabs)/
    index.tsx          # Main tracker screen with FoodPicker
    stats.tsx          # Stats screen with points, badges, today/weekly stats
    history.tsx        # History screen with delete functionality
    settings.tsx       # Settings screen with About section
components/
  FoodPicker.tsx       # OpenFoodFacts search with autocomplete (500ms debounce)
  Stats.tsx            # Stats display component (legacy)
  MealEntryForm.tsx    # Form component (legacy)
hooks/
  useEntries.ts        # Hook for managing meal entries, points, delete
services/
  openfoodfacts.ts     # OpenFoodFacts API integration & smart algorithm
  notifications.ts     # Notification scheduling (Android only)
```

## Platform-Specific Features

### Android
- Full notification support with scheduled reminders
- Push notifications when it's time to eat

### Web
- Notifications are logged to console (browser push notifications not implemented)
- All other features work identically

## Screenshots & UI

The app features:
- **Purple accent color (#bb86fc)** throughout for a fun, energetic vibe
- **Rotating tips** at the top that change every 30 seconds
- **Emojis everywhere** (🍽️, 🔥, 🥩, ⏰, 📊, 📜) for visual appeal
- **Segmented buttons** for easy portion/fullness selection
- **Progress bars** for badge tracking
- **Product images** from OpenFoodFacts database
- **Nutriscore badges** with color coding (green A to red E)
- **Delete buttons** with red icon in history
- **Motivational messages** that adapt to your progress

## Known Issues

- Notifications only work on Android (Expo Notifications has limited web support)
- OpenFoodFacts database quality varies by region/product
- Some products may not have complete nutritional data

## Future Enhancements

- [ ] Barcode scanner for easy food entry
- [ ] Custom foods (for homemade meals)
- [ ] Meal categories (breakfast, lunch, dinner, snack)
- [ ] Weekly/monthly charts and graphs
- [ ] Export data as CSV/JSON
- [ ] Customizable sleep hours
- [ ] Water tracking
- [ ] Weight tracking integration
- [ ] Social features (share achievements)
- [ ] iOS optimizations

## Developer

Created with ❤️ by **Tay März**

🌐 [taymaerz.de](https://taymaerz.de)

Built to help people who forget to eat maintain healthy eating habits through gentle reminders and smart tracking.

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [OpenFoodFacts API](https://world.openfoodfacts.org/data)
