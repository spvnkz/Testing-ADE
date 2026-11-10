# CaloriePulse — Vanilla Calorie & Nutrition Tracker

A modern, responsive, and feature-rich daily calorie and macronutrient tracker built with **vanilla HTML, CSS (Tailwind via CDN), and vanilla JavaScript**. It requires **no backend**, contains **no CSS variables**, and stores all logs and user settings persistently inside the browser via `localStorage`.

---

## 🚀 Quick Start

1. Open [`index.html`](index.html) in any web browser (Chrome, Edge, Firefox, Safari).
2. Start logging your meals, workouts, water intake, and personal nutrition goals.

---

## ✨ Features

- **Daily Calorie Dashboard & Progress Gauge**:
  - Computes `Food (consumed) - Exercise (burned) = Net Calories`.
  - Visual animated progress bar against your daily calorie budget.
  - Dynamically switches to "Over Budget" warning state if intake exceeds target.

- **Macronutrient Tracking**:
  - Tracks Protein, Carbohydrates, and Fats in grams and percentages against your custom daily targets.

- **Water / Hydration Counter**:
  - Quick `+` / `-` glass logger with real-time liter conversion (250ml per glass).

- **Categorized Meal Management**:
  - 4 meal categories: **Breakfast**, **Lunch**, **Dinner**, and **Snacks**.
  - Add food items with name, calories, and optional protein/carb/fat macros.
  - Edit or delete logged items with instant UI updates.
  - 1-click **Quick-Add** chips for common foods (Boiled Egg, Banana, Whey Shake, Chicken Breast, Rice, Coffee).

- **Exercise & Workout Logging**:
  - Log workouts with activity name, duration (minutes), and calories burned.
  - Exercise offsets your daily calorie intake, dynamically expanding your remaining allowance.

- **Calendar & Date Navigator**:
  - Switch dates seamlessly using `<` Previous, `>` Next, native Date Picker, or the `Today` shortcut.
  - Interactive **7-Day Bar Chart** comparing daily intake against your target with 1-click day switching.

- **Custom Nutrition Goals & Presets**:
  - Set custom daily goals for calories, protein, carbs, fats, and water.
  - Quick 1-click presets for **Weight Loss** (1,600 kcal), **Maintenance** (2,000 kcal), and **Muscle Gain** (2,600 kcal).

- **Backup, Restore & Reset**:
  - Export all historical logs and goals as a standalone `.json` backup file.
  - Import and restore data from any previous backup file.
  - Load demo dataset with 7 days of realistic logs.
  - Reset all local storage data.

- **Clean Vanilla Architecture**:
  - No frameworks (No React, Vue, Angular).
  - No CSS variables.
  - No backend, server, or database needed.

