/**
 * CaloriePulse - Vanilla JS Daily Calorie & Nutrition Tracker
 * Persistent browser storage (localStorage), no backend, no CSS variables.
 */

(function () {
  'use strict';

  // --- Constants & Keys ---
  const STORAGE_KEY = 'calorie_pulse_data_v1';

  const DEFAULT_SETTINGS = {
    dailyCalorieGoal: 2000,
    proteinGoal: 140,
    carbsGoal: 220,
    fatGoal: 65,
    waterGoal: 8
  };

  // --- App State ---
  let appState = {
    settings: { ...DEFAULT_SETTINGS },
    days: {} // format: { 'YYYY-MM-DD': { water: 0, entries: [], exercises: [] } }
  };

  let currentDateString = getLocalDateString(new Date());

  // --- Helper Date Functions ---
  function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDisplayDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const todayStr = getLocalDateString(new Date());

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = getLocalDateString(tomorrow);

    let prefix = '';
    if (dateStr === todayStr) prefix = 'Today · ';
    else if (dateStr === yesterdayStr) prefix = 'Yesterday · ';
    else if (dateStr === tomorrowStr) prefix = 'Tomorrow · ';

    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return prefix + date.toLocaleDateString(undefined, options);
  }

  function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  // --- Storage Management ---
  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        appState = {
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
          days: parsed.days || {}
        };
      } else {
        // First visit: initialize with demo data for a delightful out-of-the-box experience
        loadDemoDataset(false);
      }
    } catch (e) {
      console.error('Failed to load state from localStorage:', e);
      appState = { settings: { ...DEFAULT_SETTINGS }, days: {} };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
      showToast('Storage quota exceeded or unavailable.', 'error');
    }
  }

  function getDayData(dateStr) {
    if (!appState.days[dateStr]) {
      appState.days[dateStr] = {
        water: 0,
        entries: [],
        exercises: []
      };
    }
    return appState.days[dateStr];
  }

  // --- DOM Elements ---
  const datePicker = document.getElementById('datePicker');
  const prevDayBtn = document.getElementById('prevDayBtn');
  const nextDayBtn = document.getElementById('nextDayBtn');
  const todayBtn = document.getElementById('todayBtn');
  const selectedDateDisplay = document.getElementById('selectedDateDisplay');

  // Stats Elements
  const statGoalCalories = document.getElementById('statGoalCalories');
  const statFoodCalories = document.getElementById('statFoodCalories');
  const statBurnedCalories = document.getElementById('statBurnedCalories');
  const statRemainingCalories = document.getElementById('statRemainingCalories');
  const remainingLabel = document.getElementById('remainingLabel');
  const calorieProgressBar = document.getElementById('calorieProgressBar');
  const progressPercentText = document.getElementById('progressPercentText');
  const netCaloriesText = document.getElementById('netCaloriesText');
  const calorieStatusBadge = document.getElementById('calorieStatusBadge');

  // Macros Elements
  const currProtein = document.getElementById('currProtein');
  const targetProtein = document.getElementById('targetProtein');
  const proteinBar = document.getElementById('proteinBar');
  const currCarbs = document.getElementById('currCarbs');
  const targetCarbs = document.getElementById('targetCarbs');
  const carbsBar = document.getElementById('carbsBar');
  const currFat = document.getElementById('currFat');
  const targetFat = document.getElementById('targetFat');
  const fatBar = document.getElementById('fatBar');

  // Hydration Elements
  const currentWaterCount = document.getElementById('currentWaterCount');
  const targetWaterCount = document.getElementById('targetWaterCount');
  const waterLiters = document.getElementById('waterLiters');
  const incrementWaterBtn = document.getElementById('incrementWaterBtn');
  const decrementWaterBtn = document.getElementById('decrementWaterBtn');

  // Meal Lists & Subtotals
  const breakfastList = document.getElementById('breakfastList');
  const lunchList = document.getElementById('lunchList');
  const dinnerList = document.getElementById('dinnerList');
  const snackList = document.getElementById('snackList');
  const breakfastCaloriesSubtotal = document.getElementById('breakfastCaloriesSubtotal');
  const lunchCaloriesSubtotal = document.getElementById('lunchCaloriesSubtotal');
  const dinnerCaloriesSubtotal = document.getElementById('dinnerCaloriesSubtotal');
  const snackCaloriesSubtotal = document.getElementById('snackCaloriesSubtotal');

  // Exercise Elements
  const exerciseList = document.getElementById('exerciseList');
  const exerciseCaloriesSubtotal = document.getElementById('exerciseCaloriesSubtotal');

  // Chart Elements
  const weeklyChartContainer = document.getElementById('weeklyChartContainer');
  const weeklyLabelsContainer = document.getElementById('weeklyLabelsContainer');
  const chartGoalRef = document.getElementById('chartGoalRef');

  // Modals & Controls
  const foodModal = document.getElementById('foodModal');
  const foodForm = document.getElementById('foodForm');
  const foodModalTitle = document.getElementById('foodModalTitle');
  const foodEditId = document.getElementById('foodEditId');
  const foodName = document.getElementById('foodName');
  const foodCategory = document.getElementById('foodCategory');
  const foodCalories = document.getElementById('foodCalories');
  const foodProtein = document.getElementById('foodProtein');
  const foodCarbs = document.getElementById('foodCarbs');
  const foodFat = document.getElementById('foodFat');
  const closeFoodModalBtn = document.getElementById('closeFoodModalBtn');
  const cancelFoodModalBtn = document.getElementById('cancelFoodModalBtn');

  const exerciseModal = document.getElementById('exerciseModal');
  const exerciseForm = document.getElementById('exerciseForm');
  const exerciseName = document.getElementById('exerciseName');
  const exerciseCalories = document.getElementById('exerciseCalories');
  const exerciseDuration = document.getElementById('exerciseDuration');
  const openAddExerciseBtn = document.getElementById('openAddExerciseBtn');
  const closeExerciseModalBtn = document.getElementById('closeExerciseModalBtn');
  const cancelExerciseModalBtn = document.getElementById('cancelExerciseModalBtn');

  const goalsModal = document.getElementById('goalsModal');
  const goalsForm = document.getElementById('goalsForm');
  const goalCalories = document.getElementById('goalCalories');
  const goalProtein = document.getElementById('goalProtein');
  const goalCarbs = document.getElementById('goalCarbs');
  const goalFat = document.getElementById('goalFat');
  const goalWater = document.getElementById('goalWater');
  const openGoalsModalBtn = document.getElementById('openGoalsModalBtn');
  const closeGoalsModalBtn = document.getElementById('closeGoalsModalBtn');
  const cancelGoalsModalBtn = document.getElementById('cancelGoalsModalBtn');

  const dataModal = document.getElementById('dataModal');
  const openDataModalBtn = document.getElementById('openDataModalBtn');
  const closeDataModalBtn = document.getElementById('closeDataModalBtn');
  const exportDataBtn = document.getElementById('exportDataBtn');
  const triggerImportBtn = document.getElementById('triggerImportBtn');
  const importFileInput = document.getElementById('importFileInput');
  const loadDemoDataBtn = document.getElementById('loadDemoDataBtn');
  const clearAllDataBtn = document.getElementById('clearAllDataBtn');
  const toastContainer = document.getElementById('toastContainer');

  // --- Toast Notification ---
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const baseClasses = 'pointer-events-auto px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0';
    
    let colorClasses = 'bg-slate-900 text-white';
    let iconSvg = '<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';

    if (type === 'error') {
      colorClasses = 'bg-rose-600 text-white';
      iconSvg = '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
    } else if (type === 'info') {
      colorClasses = 'bg-blue-600 text-white';
      iconSvg = '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    }

    toast.className = `${baseClasses} ${colorClasses}`;
    toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;

    toastContainer.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 300);
    }, 2800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Rendering UI ---
  function renderAll() {
    datePicker.value = currentDateString;
    selectedDateDisplay.textContent = formatDisplayDate(currentDateString);

    const dayData = getDayData(currentDateString);
    const settings = appState.settings;

    // Calculate Totals
    let totalFoodCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    const categoryCalories = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0
    };

    dayData.entries.forEach(entry => {
      const cal = Number(entry.calories) || 0;
      totalFoodCalories += cal;
      totalProtein += Number(entry.protein) || 0;
      totalCarbs += Number(entry.carbs) || 0;
      totalFat += Number(entry.fat) || 0;

      if (categoryCalories[entry.category] !== undefined) {
        categoryCalories[entry.category] += cal;
      }
    });

    let totalBurnedCalories = 0;
    dayData.exercises.forEach(ex => {
      totalBurnedCalories += Number(ex.caloriesBurned) || 0;
    });

    const netCalories = totalFoodCalories - totalBurnedCalories;
    const remainingCalories = settings.dailyCalorieGoal - netCalories;

    // Update Calories Cards
    statGoalCalories.textContent = settings.dailyCalorieGoal.toLocaleString();
    statFoodCalories.textContent = totalFoodCalories.toLocaleString();
    statBurnedCalories.textContent = totalBurnedCalories.toLocaleString();
    netCaloriesText.textContent = netCalories.toLocaleString();

    if (remainingCalories >= 0) {
      remainingLabel.textContent = 'Remaining';
      remainingLabel.className = 'text-xs text-blue-700 block uppercase tracking-wider font-semibold';
      statRemainingCalories.textContent = remainingCalories.toLocaleString();
      statRemainingCalories.className = 'text-lg sm:text-2xl font-bold text-blue-700';

      calorieStatusBadge.textContent = 'On Track';
      calorieStatusBadge.className = 'text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800';
    } else {
      remainingLabel.textContent = 'Over Budget';
      remainingLabel.className = 'text-xs text-rose-700 block uppercase tracking-wider font-semibold';
      statRemainingCalories.textContent = Math.abs(remainingCalories).toLocaleString();
      statRemainingCalories.className = 'text-lg sm:text-2xl font-bold text-rose-700';

      calorieStatusBadge.textContent = 'Over Target';
      calorieStatusBadge.className = 'text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800';
    }

    // Calorie Progress Bar
    const progressPercent = Math.min(Math.round((totalFoodCalories / settings.dailyCalorieGoal) * 100), 100);
    progressPercentText.textContent = `${Math.round((totalFoodCalories / settings.dailyCalorieGoal) * 100)}%`;
    calorieProgressBar.style.width = `${progressPercent}%`;

    if (totalFoodCalories > settings.dailyCalorieGoal) {
      calorieProgressBar.className = 'bg-gradient-to-r from-rose-500 to-red-600 h-full rounded-full transition-all duration-500';
    } else {
      calorieProgressBar.className = 'bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500';
    }

    // Macros
    currProtein.textContent = Math.round(totalProtein);
    targetProtein.textContent = settings.proteinGoal;
    proteinBar.style.width = `${Math.min(100, Math.round((totalProtein / settings.proteinGoal) * 100))}%`;

    currCarbs.textContent = Math.round(totalCarbs);
    targetCarbs.textContent = settings.carbsGoal;
    carbsBar.style.width = `${Math.min(100, Math.round((totalCarbs / settings.carbsGoal) * 100))}%`;

    currFat.textContent = Math.round(totalFat);
    targetFat.textContent = settings.fatGoal;
    fatBar.style.width = `${Math.min(100, Math.round((totalFat / settings.fatGoal) * 100))}%`;

    // Hydration
    const currentWater = dayData.water || 0;
    currentWaterCount.textContent = currentWater;
    targetWaterCount.textContent = settings.waterGoal || 8;
    waterLiters.textContent = (currentWater * 0.25).toFixed(2);

    // Subtotals
    breakfastCaloriesSubtotal.textContent = `${categoryCalories.breakfast.toLocaleString()} kcal`;
    lunchCaloriesSubtotal.textContent = `${categoryCalories.lunch.toLocaleString()} kcal`;
    dinnerCaloriesSubtotal.textContent = `${categoryCalories.dinner.toLocaleString()} kcal`;
    snackCaloriesSubtotal.textContent = `${categoryCalories.snack.toLocaleString()} kcal`;
    exerciseCaloriesSubtotal.textContent = `-${totalBurnedCalories.toLocaleString()} kcal`;

    // Render Food Lists
    renderMealList(breakfastList, 'breakfast', dayData.entries);
    renderMealList(lunchList, 'lunch', dayData.entries);
    renderMealList(dinnerList, 'dinner', dayData.entries);
    renderMealList(snackList, 'snack', dayData.entries);

    // Render Exercise List
    renderExerciseList(dayData.exercises);

    // Render Weekly History Chart
    renderWeeklyChart();
  }

  function renderMealList(container, category, entries) {
    const items = entries.filter(item => item.category === category);
    if (items.length === 0) {
      container.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center py-6 text-slate-300">
          <p class="text-xs italic">No items logged yet</p>
        </div>
      `;
      return;
    }

    let html = '';
    items.forEach(item => {
      const p = item.protein ? `${item.protein}g P` : '';
      const c = item.carbs ? `${item.carbs}g C` : '';
      const f = item.fat ? `${item.fat}g F` : '';
      const macroParts = [p, c, f].filter(Boolean);
      const macroString = macroParts.length > 0 ? `· <span class="text-slate-400 font-normal">${macroParts.join(' ')}</span>` : '';

      html += `
        <div class="group flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-all">
          <div class="flex-1 min-w-0 pr-3">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-xs font-semibold text-slate-800 truncate">${escapeHtml(item.name)}</span>
              ${item.time ? `<span class="text-[10px] text-slate-400 font-mono">(${escapeHtml(item.time)})</span>` : ''}
            </div>
            <p class="text-[11px] font-medium text-emerald-700">
              ${Number(item.calories).toLocaleString()} kcal ${macroString}
            </p>
          </div>
          <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button class="edit-food-btn p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors" title="Edit item" data-id="${item.id}">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            </button>
            <button class="delete-food-btn p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors" title="Delete item" data-id="${item.id}">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function renderExerciseList(exercises) {
    if (!exercises || exercises.length === 0) {
      exerciseList.innerHTML = `
        <div class="py-6 text-center text-slate-400 text-xs italic">
          No workouts or exercises logged today. Tap "+ Add Workout" to record burned calories.
        </div>
      `;
      return;
    }

    let html = '';
    exercises.forEach(ex => {
      html += `
        <div class="group flex items-center justify-between p-3 rounded-xl bg-orange-50/50 hover:bg-orange-50 border border-orange-100 transition-all">
          <div class="flex items-center gap-3">
            <span class="text-base">⚡</span>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-slate-800">${escapeHtml(ex.name)}</span>
                ${ex.duration ? `<span class="text-[10px] text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded-full font-medium">${ex.duration} min</span>` : ''}
                ${ex.time ? `<span class="text-[10px] text-slate-400 font-mono">(${escapeHtml(ex.time)})</span>` : ''}
              </div>
              <p class="text-xs font-semibold text-orange-600">-${Number(ex.caloriesBurned).toLocaleString()} kcal burned</p>
            </div>
          </div>
          <button class="delete-exercise-btn p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors" title="Delete workout" data-id="${ex.id}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      `;
    });

    exerciseList.innerHTML = html;
  }

  // --- 7-Day Chart Render ---
  function renderWeeklyChart() {
    chartGoalRef.textContent = appState.settings.dailyCalorieGoal.toLocaleString();

    // Generate last 7 days ending with currentDate
    const daysToShow = [];
    const [y, m, d] = currentDateString.split('-').map(Number);
    const anchorDate = new Date(y, m - 1, d);

    for (let i = 6; i >= 0; i--) {
      const dt = new Date(anchorDate);
      dt.setDate(dt.getDate() - i);
      daysToShow.push(getLocalDateString(dt));
    }

    let maxCalorieValue = appState.settings.dailyCalorieGoal * 1.25;

    // Check if any day exceeds max
    daysToShow.forEach(dateStr => {
      const dayData = appState.days[dateStr];
      if (dayData && dayData.entries) {
        const total = dayData.entries.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);
        if (total > maxCalorieValue) maxCalorieValue = total * 1.1;
      }
    });

    let chartHtml = '';
    let labelHtml = '';

    daysToShow.forEach(dateStr => {
      const dayData = appState.days[dateStr];
      let dayTotal = 0;
      if (dayData && dayData.entries) {
        dayTotal = dayData.entries.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);
      }

      const heightPercent = Math.min(100, Math.round((dayTotal / maxCalorieValue) * 100));
      const isSelected = dateStr === currentDateString;
      const isOverGoal = dayTotal > appState.settings.dailyCalorieGoal;

      let barColor = 'bg-emerald-500 hover:bg-emerald-600';
      if (dayTotal === 0) barColor = 'bg-slate-200';
      else if (isOverGoal) barColor = 'bg-rose-500 hover:bg-rose-600';

      const [itemY, itemM, itemD] = dateStr.split('-').map(Number);
      const itemObj = new Date(itemY, itemM - 1, itemD);
      const dayName = itemObj.toLocaleDateString(undefined, { weekday: 'short' });
      const dayNum = itemObj.getDate();

      chartHtml += `
        <div class="h-full flex flex-col items-center justify-end group cursor-pointer chart-bar-item" data-date="${dateStr}">
          <span class="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity mb-1 whitespace-nowrap">
            ${dayTotal > 0 ? `${dayTotal} kcal` : '0'}
          </span>
          <div class="w-full max-w-[42px] bg-slate-100 rounded-t-xl h-full flex items-end p-1 transition-all ${isSelected ? 'ring-2 ring-emerald-500 ring-offset-1 bg-emerald-50/50' : ''}">
            <div class="w-full ${barColor} rounded-t-lg transition-all duration-500" style="height: ${Math.max(6, heightPercent)}%"></div>
          </div>
        </div>
      `;

      labelHtml += `
        <div class="cursor-pointer chart-label-item ${isSelected ? 'font-bold text-emerald-700' : ''}" data-date="${dateStr}">
          <span class="block">${dayName}</span>
          <span class="text-[10px] text-slate-400">${dayNum}</span>
        </div>
      `;
    });

    weeklyChartContainer.innerHTML = chartHtml;
    weeklyLabelsContainer.innerHTML = labelHtml;
  }

  // --- Modal Open / Close ---
  function openFoodModal(category = 'breakfast', itemToEdit = null) {
    foodForm.reset();
    if (itemToEdit) {
      foodModalTitle.textContent = 'Edit Food Item';
      foodEditId.value = itemToEdit.id;
      foodName.value = itemToEdit.name;
      foodCategory.value = itemToEdit.category;
      foodCalories.value = itemToEdit.calories;
      foodProtein.value = itemToEdit.protein || '';
      foodCarbs.value = itemToEdit.carbs || '';
      foodFat.value = itemToEdit.fat || '';
    } else {
      foodModalTitle.textContent = 'Add Food Item';
      foodEditId.value = '';
      foodCategory.value = category;
    }
    foodModal.classList.remove('hidden');
    foodName.focus();
  }

  function closeFoodModal() {
    foodModal.classList.add('hidden');
    foodForm.reset();
  }

  function openExerciseModal() {
    exerciseForm.reset();
    exerciseModal.classList.remove('hidden');
    exerciseName.focus();
  }

  function closeExerciseModal() {
    exerciseModal.classList.add('hidden');
    exerciseForm.reset();
  }

  function openGoalsModal() {
    goalCalories.value = appState.settings.dailyCalorieGoal;
    goalProtein.value = appState.settings.proteinGoal;
    goalCarbs.value = appState.settings.carbsGoal;
    goalFat.value = appState.settings.fatGoal;
    goalWater.value = appState.settings.waterGoal || 8;
    goalsModal.classList.remove('hidden');
  }

  function closeGoalsModal() {
    goalsModal.classList.add('hidden');
  }

  function openDataModal() {
    dataModal.classList.remove('hidden');
  }

  function closeDataModal() {
    dataModal.classList.add('hidden');
  }

  // --- Food Operations ---
  function handleFoodSubmit(e) {
    e.preventDefault();
    const name = foodName.value.trim();
    const calories = Number(foodCalories.value);
    const category = foodCategory.value;
    const protein = foodProtein.value ? Number(foodProtein.value) : 0;
    const carbs = foodCarbs.value ? Number(foodCarbs.value) : 0;
    const fat = foodFat.value ? Number(foodFat.value) : 0;
    const editId = foodEditId.value;

    if (!name || isNaN(calories) || calories < 0) {
      showToast('Please provide a valid name and calories.', 'error');
      return;
    }

    const dayData = getDayData(currentDateString);

    if (editId) {
      // Editing existing item
      const index = dayData.entries.findIndex(i => i.id === editId);
      if (index !== -1) {
        dayData.entries[index] = {
          ...dayData.entries[index],
          name,
          category,
          calories,
          protein,
          carbs,
          fat
        };
        showToast(`Updated "${name}"`);
      }
    } else {
      // Adding new item
      const newItem = {
        id: 'food_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        name,
        category,
        calories,
        protein,
        carbs,
        fat,
        time: getCurrentTime()
      };
      dayData.entries.push(newItem);
      showToast(`Logged "${name}" (+${calories} kcal)`);
    }

    saveState();
    closeFoodModal();
    renderAll();
  }

  function deleteFoodItem(id) {
    const dayData = getDayData(currentDateString);
    const itemIndex = dayData.entries.findIndex(i => i.id === id);
    if (itemIndex !== -1) {
      const removed = dayData.entries.splice(itemIndex, 1)[0];
      saveState();
      renderAll();
      showToast(`Removed "${removed.name}"`, 'info');
    }
  }

  function editFoodItem(id) {
    const dayData = getDayData(currentDateString);
    const item = dayData.entries.find(i => i.id === id);
    if (item) {
      openFoodModal(item.category, item);
    }
  }

  // --- Exercise Operations ---
  function handleExerciseSubmit(e) {
    e.preventDefault();
    const name = exerciseName.value.trim();
    const caloriesBurned = Number(exerciseCalories.value);
    const duration = exerciseDuration.value ? Number(exerciseDuration.value) : null;

    if (!name || isNaN(caloriesBurned) || caloriesBurned <= 0) {
      showToast('Please enter a valid workout name and calories burned.', 'error');
      return;
    }

    const dayData = getDayData(currentDateString);
    const newExercise = {
      id: 'ex_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name,
      caloriesBurned,
      duration,
      time: getCurrentTime()
    };

    dayData.exercises.push(newExercise);
    saveState();
    closeExerciseModal();
    renderAll();
    showToast(`Logged workout "${name}" (-${caloriesBurned} kcal)`);
  }

  function deleteExerciseItem(id) {
    const dayData = getDayData(currentDateString);
    const index = dayData.exercises.findIndex(e => e.id === id);
    if (index !== -1) {
      const removed = dayData.exercises.splice(index, 1)[0];
      saveState();
      renderAll();
      showToast(`Removed workout "${removed.name}"`, 'info');
    }
  }

  // --- Hydration Operations ---
  function incrementWater() {
    const dayData = getDayData(currentDateString);
    dayData.water = (dayData.water || 0) + 1;
    saveState();
    renderAll();
  }

  function decrementWater() {
    const dayData = getDayData(currentDateString);
    if (dayData.water && dayData.water > 0) {
      dayData.water -= 1;
      saveState();
      renderAll();
    }
  }

  // --- Goals Operations ---
  function handleGoalsSubmit(e) {
    e.preventDefault();
    const newCalGoal = Number(goalCalories.value);
    const newProtein = Number(goalProtein.value);
    const newCarbs = Number(goalCarbs.value);
    const newFat = Number(goalFat.value);
    const newWater = Number(goalWater.value);

    if (newCalGoal < 500) {
      showToast('Daily calorie target should be at least 500 kcal.', 'error');
      return;
    }

    appState.settings = {
      dailyCalorieGoal: newCalGoal,
      proteinGoal: newProtein,
      carbsGoal: newCarbs,
      fatGoal: newFat,
      waterGoal: newWater
    };

    saveState();
    closeGoalsModal();
    renderAll();
    showToast('Goals updated successfully!');
  }

  // --- Data Export & Import ---
  function exportData() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `calorie-pulse-backup-${currentDateString}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Backup downloaded!');
  }

  function importData(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported && (imported.settings || imported.days)) {
          appState = {
            settings: { ...DEFAULT_SETTINGS, ...(imported.settings || {}) },
            days: imported.days || {}
          };
          saveState();
          closeDataModal();
          renderAll();
          showToast('Data imported successfully!');
        } else {
          showToast('Invalid backup file format.', 'error');
        }
      } catch (err) {
        showToast('Error parsing JSON backup file.', 'error');
      }
    };
    reader.readAsText(file);
    // Reset file input
    importFileInput.value = '';
  }

  // --- Reset All Data ---
  function clearAllData() {
    if (confirm('Are you sure you want to erase all data and reset to fresh defaults? This cannot be undone.')) {
      localStorage.removeItem(STORAGE_KEY);
      appState = {
        settings: { ...DEFAULT_SETTINGS },
        days: {}
      };
      saveState();
      renderAll();
      showToast('All local data cleared.', 'info');
    }
  }

  // --- Demo Dataset Generator ---
  function loadDemoDataset(showMessage = true) {
    const today = new Date();
    const demoDays = {};

    // Generate 7 days of realistic logs
    for (let offset = 6; offset >= 0; offset--) {
      const dt = new Date(today);
      dt.setDate(dt.getDate() - offset);
      const dStr = getLocalDateString(dt);

      if (offset === 0) {
        // Today
        demoDays[dStr] = {
          water: 5,
          entries: [
            { id: 'd_1', name: 'Oatmeal with Blueberries & Chia Seeds', category: 'breakfast', calories: 360, protein: 12, carbs: 64, fat: 6, time: '08:15' },
            { id: 'd_2', name: 'Almond Milk Cappuccino', category: 'breakfast', calories: 85, protein: 2, carbs: 8, fat: 4.5, time: '08:45' },
            { id: 'd_3', name: 'Grilled Chicken & Quinoa Salad', category: 'lunch', calories: 520, protein: 48, carbs: 42, fat: 14, time: '12:30' },
            { id: 'd_4', name: 'Greek Yogurt with Honey & Walnuts', category: 'snack', calories: 230, protein: 16, carbs: 22, fat: 9, time: '16:00' },
            { id: 'd_5', name: 'Pan-Seared Salmon & Asparagus', category: 'dinner', calories: 490, protein: 44, carbs: 12, fat: 28, time: '19:30' }
          ],
          exercises: [
            { id: 'e_1', name: 'Morning Jog & Stretch', caloriesBurned: 280, duration: 35, time: '07:15' }
          ]
        };
      } else if (offset === 1) {
        // Yesterday
        demoDays[dStr] = {
          water: 8,
          entries: [
            { id: 'd_y1', name: 'Scrambled Eggs (3) with Sourdough', category: 'breakfast', calories: 410, protein: 24, carbs: 32, fat: 19, time: '08:30' },
            { id: 'd_y2', name: 'Turkey Breast Wrap with Avocado', category: 'lunch', calories: 510, protein: 38, carbs: 48, fat: 16, time: '13:00' },
            { id: 'd_y3', name: 'Whey Protein Shake + Banana', category: 'snack', calories: 245, protein: 26, carbs: 30, fat: 2, time: '17:15' },
            { id: 'd_y4', name: 'Brown Rice with Beef Stir-Fry', category: 'dinner', calories: 640, protein: 45, carbs: 68, fat: 18, time: '20:00' }
          ],
          exercises: [
            { id: 'e_y1', name: 'Weight Training (Legs)', caloriesBurned: 350, duration: 50, time: '16:15' }
          ]
        };
      } else {
        // Earlier days
        const randomCalories = 1750 + Math.floor(Math.random() * 450);
        demoDays[dStr] = {
          water: Math.floor(Math.random() * 5) + 4,
          entries: [
            { id: 'demo_b_' + offset, name: 'Breakfast Bowl & Fresh Fruit', category: 'breakfast', calories: Math.round(randomCalories * 0.25), protein: 20, carbs: 55, fat: 10, time: '08:00' },
            { id: 'demo_l_' + offset, name: 'Nutrient Meal Bowl', category: 'lunch', calories: Math.round(randomCalories * 0.35), protein: 40, carbs: 60, fat: 15, time: '12:45' },
            { id: 'demo_d_' + offset, name: 'Dinner Plate & Greens', category: 'dinner', calories: Math.round(randomCalories * 0.40), protein: 42, carbs: 50, fat: 18, time: '19:15' }
          ],
          exercises: [
            { id: 'demo_ex_' + offset, name: 'Cardio / Walking', caloriesBurned: 220, duration: 30, time: '18:00' }
          ]
        };
      }
    }

    appState = {
      settings: { ...DEFAULT_SETTINGS },
      days: demoDays
    };

    saveState();
    renderAll();
    if (showMessage) {
      showToast('Loaded demo dataset with 7 days of logs!');
    }
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Date Navigation
    datePicker.addEventListener('change', (e) => {
      if (e.target.value) {
        currentDateString = e.target.value;
        renderAll();
      }
    });

    prevDayBtn.addEventListener('click', () => {
      const [y, m, d] = currentDateString.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() - 1);
      currentDateString = getLocalDateString(dt);
      renderAll();
    });

    nextDayBtn.addEventListener('click', () => {
      const [y, m, d] = currentDateString.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() + 1);
      currentDateString = getLocalDateString(dt);
      renderAll();
    });

    todayBtn.addEventListener('click', () => {
      currentDateString = getLocalDateString(new Date());
      renderAll();
    });

    // Hydration
    incrementWaterBtn.addEventListener('click', incrementWater);
    decrementWaterBtn.addEventListener('click', decrementWater);

    // Food Modal Trigger Buttons (from meal headers)
    document.querySelectorAll('.open-add-food-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category') || 'breakfast';
        openFoodModal(cat);
      });
    });

    closeFoodModalBtn.addEventListener('click', closeFoodModal);
    cancelFoodModalBtn.addEventListener('click', closeFoodModal);
    foodForm.addEventListener('submit', handleFoodSubmit);

    // Quick Add Buttons
    document.querySelectorAll('.quick-food-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        const cal = Number(btn.getAttribute('data-cal'));
        const pro = Number(btn.getAttribute('data-pro')) || 0;
        const carb = Number(btn.getAttribute('data-carb')) || 0;
        const fat = Number(btn.getAttribute('data-fat')) || 0;
        const cat = btn.getAttribute('data-cat') || 'snack';

        const dayData = getDayData(currentDateString);
        dayData.entries.push({
          id: 'food_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          name,
          category: cat,
          calories: cal,
          protein: pro,
          carbs: carb,
          fat,
          time: getCurrentTime()
        });

        saveState();
        renderAll();
        showToast(`Quick-added "${name}" (+${cal} kcal)`);
      });
    });

    // Delegated actions for Edit/Delete food
    document.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.edit-food-btn');
      if (editBtn) {
        const id = editBtn.getAttribute('data-id');
        editFoodItem(id);
        return;
      }

      const delBtn = e.target.closest('.delete-food-btn');
      if (delBtn) {
        const id = delBtn.getAttribute('data-id');
        deleteFoodItem(id);
        return;
      }

      const delExBtn = e.target.closest('.delete-exercise-btn');
      if (delExBtn) {
        const id = delExBtn.getAttribute('data-id');
        deleteExerciseItem(id);
        return;
      }

      const chartBar = e.target.closest('.chart-bar-item, .chart-label-item');
      if (chartBar) {
        const targetDate = chartBar.getAttribute('data-date');
        if (targetDate) {
          currentDateString = targetDate;
          renderAll();
        }
        return;
      }
    });

    // Exercise Modal
    openAddExerciseBtn.addEventListener('click', openExerciseModal);
    closeExerciseModalBtn.addEventListener('click', closeExerciseModal);
    cancelExerciseModalBtn.addEventListener('click', closeExerciseModal);
    exerciseForm.addEventListener('submit', handleExerciseSubmit);

    // Goals Modal
    openGoalsModalBtn.addEventListener('click', openGoalsModal);
    closeGoalsModalBtn.addEventListener('click', closeGoalsModal);
    cancelGoalsModalBtn.addEventListener('click', closeGoalsModal);
    goalsForm.addEventListener('submit', handleGoalsSubmit);

    // Preset Goal Buttons
    document.querySelectorAll('.preset-goal-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        goalCalories.value = btn.getAttribute('data-cal');
        goalProtein.value = btn.getAttribute('data-pro');
        goalCarbs.value = btn.getAttribute('data-carb');
        goalFat.value = btn.getAttribute('data-fat');
      });
    });

    // Data Management Modal
    openDataModalBtn.addEventListener('click', openDataModal);
    closeDataModalBtn.addEventListener('click', closeDataModal);
    exportDataBtn.addEventListener('click', exportData);
    triggerImportBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', importData);
    loadDemoDataBtn.addEventListener('click', () => loadDemoDataset(true));
    clearAllDataBtn.addEventListener('click', clearAllData);

    // Close modals on Escape key or backdrop click
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeFoodModal();
        closeExerciseModal();
        closeGoalsModal();
        closeDataModal();
      }
    });

    [foodModal, exerciseModal, goalsModal, dataModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
    });
  }

  // --- Initialize Application ---
  function init() {
    loadState();
    setupEventListeners();
    renderAll();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

