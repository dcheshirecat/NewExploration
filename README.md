# Dini's Money Jar 2.0 🫙🐾

A budgeting app for Android that combines **Dini's Money Jar** (monthly budget
tracker) with **PetVault** (a pet game that rewards saving).

## Features

- **Fun Jar:** set a monthly fun budget and watch the jar empty as you spend.
- **Life:** income, regular expenses and per-category plans.
- **Recurring items:** rent, bills, subscriptions and salary are added automatically on their day each month.
- **Budget warnings:** banners and alerts when a budget or plan reaches 70/80/90% (you choose) or goes over.
- **Insights:** spending donut by category, month-to-month comparison, daily calendar heatmap, running balance and history (CSV export).
- **Savings goals:** targets with progress bars, optional target dates with a monthly pace, plus "I skipped a purchase" logging.
- **Pets:** earn coins by logging, saving, skipping purchases, finishing daily challenges and staying under budget. Spend them on eggs, food and items. Pets get hungry over real time and level up as you save.
- **Daily reminder:** a notification to log your spending.
- **Backup & restore:** save everything to a JSON file and restore it on any phone.
- **Light, dark and automatic themes.**

Budget periods run from the **15th to the 14th** of the next month.

## Getting the APK

Every push runs the **Build APK** workflow (GitHub → Actions). Open the latest
run and download the `DinisMoneyJar-APK` artifact, unzip it and install the APK
on your phone.

The app keeps the original package name and debug signing, so it installs
**over** the old Money Jar as an update and moves your existing data into the
new format automatically. The old data is left in place, untouched.

## Development

```bash
npm install
npx expo start          # run with Expo Go
npx tsc --noEmit        # type-check
npx expo export --platform web   # web build (used for automated UI testing)
```

Code layout:

| Path | What's there |
|---|---|
| `App.tsx` | Navigation (bottom tabs) and layout |
| `src/types.ts` | Data model |
| `src/storage.ts` | Loading, saving and migrating old data |
| `src/actions.ts` | Money logic: entries, warnings, recurring items, goals, bonuses |
| `src/game.ts` | Pet game: pets, eggs, items, coin rules |
| `src/services.ts` | Backup files and reminder notifications |
| `src/screens/` | Home, Budget, Insights, Goals, Pets, Settings |
| `src/components/` | UI kit, charts, jar, pet art, forms |
