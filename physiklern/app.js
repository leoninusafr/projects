// Resonanz Physik 2 Akustik Lernwebsite Application Logic
// Gamified Campaign Edition

import { FORMULAS_DB } from './formulas-db.js';
import { EXAM_QUESTIONS, LECTURE_QUESTIONS, CAMPAIGN_STAGES } from './questions-db.js';
import { GENERATOR_DB } from './physics-generator.js';

// --- STATE MANAGEMENT ---
let state = {
  xp: 0,
  level: 1,
  streak: 0,
  completedLevels: [], // Array of completed level IDs (e.g., 'stage1_lvl1')
  pinnedFormulas: [], // Array of pinned formula IDs
  formulaNotes: {}, // formulaId -> custom notes string
  bossHP: {}, // levelId -> number (remaining HP)
  unlockedAchievements: [],
  lastActiveDate: '',
  
  // Session restore keys
  currentTab: 'dashboard',
  activeLevelId: null,
  currentSubQuestionIndex: 0
};

// Titles based on completed level count + 1 (Tier 1 to 16)
const RANKS = [
  "Schall-Novize 📢",
  "Dämpfungs-Anfänger 📉",
  "Schwingungs-Zitrone 🍋",
  "Resonanz-Lehrling 🌀",
  "Wellen-Beobachter 🌊",
  "Pegel-Zähler 📊",
  "Dezibel-Dämpfer 🔇",
  "Frequenz-Wechsler 🎚️",
  "Orgel-Stimmer 🎹",
  "Helmholtz-Fan 🧪",
  "Akustik-Meister 🎓",
  "Ultraschall-Rider 🐬",
  "Biegesteifigkeits-Bändiger 🎻",
  "Mündungs-Korrektor 📐",
  "Akustik-König 👑",
  "Akustik-Gott (1,0) 🌟"
];

// Load state from LocalStorage
function loadState() {
  const data = localStorage.getItem('resonanz_physics_state');
  if (data) {
    try {
      state = { ...state, ...JSON.parse(data) };
      currentTab = state.currentTab || 'dashboard';
      activeLevelId = state.activeLevelId || null;
      currentSubQuestionIndex = state.currentSubQuestionIndex || 0;
    } catch (e) {
      console.error("Failed to parse state", e);
    }
  }
}

// Save state to LocalStorage
function saveState() {
  localStorage.setItem('resonanz_physics_state', JSON.stringify(state));
  updateUI();
}

// Award XP and handle level up
function awardXP(amount) {
  state.xp += amount;
  
  // Level is computed from XP: every 150 XP is a level
  const newLevel = Math.floor(state.xp / 150) + 1;
  if (newLevel > state.level) {
    state.level = newLevel;
    showToast(`🎉 Level Up! Du bist jetzt Level ${state.level}!`, 'success');
  }
  
  saveState();
}

// Check and update streak
function updateStreak() {
  const todayStr = new Date().toDateString();
  const lastActive = state.lastActiveDate;
  
  if (!lastActive) {
    state.streak = 1;
  } else {
    const lastDate = new Date(lastActive);
    const todayDate = new Date(todayStr);
    const diffTime = Math.abs(todayDate - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      state.streak += 1;
    } else if (diffDays > 1) {
      state.streak = 1;
    }
  }
  
  state.lastActiveDate = todayStr;
  saveState();
}

// --- DOM ELEMENTS ---
const viewDashboard = document.getElementById('view-dashboard');
const viewCampaign = document.getElementById('view-campaign');
const viewCheatsheet = document.getElementById('view-cheatsheet');
const viewStats = document.getElementById('view-stats');

const navDashboard = document.getElementById('nav-dashboard-btn');
const navCampaign = document.getElementById('nav-campaign-btn');
const navCheatsheet = document.getElementById('nav-cheatsheet-btn');
const navStats = document.getElementById('nav-stats-btn');

// --- TAB ROUTING ---
const tabs = {
  dashboard: { nav: navDashboard, view: viewDashboard, title: 'Dashboard' },
  campaign: { nav: navCampaign, view: viewCampaign, title: 'Lern-Kampagne' },
  cheatsheet: { nav: navCheatsheet, view: viewCheatsheet, title: 'Spickzettel' },
  stats: { nav: navStats, view: viewStats, title: 'Fortschritt' }
};

let currentTab = 'dashboard';

function switchTab(tabKey) {
  Object.keys(tabs).forEach(key => {
    tabs[key].nav.classList.remove('active');
    tabs[key].view.classList.remove('active');
  });
  
  tabs[tabKey].nav.classList.add('active');
  tabs[tabKey].view.classList.add('active');
  currentTab = tabKey;
  state.currentTab = tabKey;
  saveState();
  
  if (tabKey === 'cheatsheet') {
    renderCheatSheet();
  } else if (tabKey === 'campaign') {
    initCampaign();
  } else if (tabKey === 'stats') {
    renderStats();
  }
  
  renderMath(tabs[tabKey].view);
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Bind tabs click
Object.keys(tabs).forEach(key => {
  tabs[key].nav.addEventListener('click', () => switchTab(key));
});

// Logo acts as Dashboard redirect
document.getElementById('header-logo').addEventListener('click', () => switchTab('dashboard'));

// --- FORMULA ENGINE (KaTeX render helper) ---
function renderMath(element) {
  if (window.renderMathInElement) {
    window.renderMathInElement(element, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false
    });
  }
}

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast card ${type}`;
  toast.style.padding = '15px 25px';
  toast.style.borderRadius = 'var(--radius-sm)';
  toast.style.border = '1px solid var(--border-color)';
  toast.style.boxShadow = 'var(--shadow-md)';
  toast.style.fontFamily = 'var(--font-title)';
  toast.style.fontWeight = '600';
  toast.style.fontSize = '14px';
  toast.style.animation = 'slideIn 0.3s ease';
  
  let icon = '<i class="fa-solid fa-circle-info text-cyan"></i>';
  if (type === 'success') {
    toast.style.background = 'rgba(16, 185, 129, 0.1)';
    toast.style.borderColor = 'var(--emerald)';
    toast.style.color = '#34d399';
    icon = '<i class="fa-solid fa-circle-check text-emerald"></i>';
  } else if (type === 'error') {
    toast.style.background = 'rgba(239, 68, 68, 0.1)';
    toast.style.borderColor = 'var(--red)';
    toast.style.color = '#f87171';
    icon = '<i class="fa-solid fa-triangle-exclamation text-red"></i>';
  } else {
    toast.style.background = 'var(--bg-card)';
    toast.style.color = 'var(--text-bright)';
  }
  
  toast.innerHTML = `<div style="display: flex; align-items: center; gap: 10px;">${icon} <span>${message}</span></div>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-out forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

// --- UPDATE UI STATISTICS ---
function updateUI() {
  // Stats inside header
  document.querySelector('#streak-counter .value').innerText = `${state.streak} Tage`;
  document.querySelector('#xp-counter .value').innerText = `${state.xp} XP`;
  document.querySelector('#level-counter .value').innerText = `Lvl ${state.level}`;
  
  // Guarantee Widget Progress (Completed Levels out of 15)
  const completedCount = state.completedLevels.length;
  const guaranteePercent = Math.round((completedCount / 15) * 100);
  
  const bar = document.getElementById('guarantee-progress');
  if (bar) bar.style.width = `${guaranteePercent}%`;
  
  const percentText = document.getElementById('guarantee-percent');
  if (percentText) percentText.innerText = `${guaranteePercent}%`;
  
  const countText = document.getElementById('guarantee-task-count');
  if (countText) countText.innerText = `${completedCount} von 15 Levels abgeschlossen`;
  
  // Dashboard Stage Badge
  const currentStageNum = getCurrentStageNum();
  const dbCampaignBadge = document.getElementById('dashboard-campaign-badge');
  if (dbCampaignBadge) {
    if (completedCount === 15) {
      dbCampaignBadge.innerText = 'ABGESCHLOSSEN 🏆';
      dbCampaignBadge.className = 'badge badge-cyan';
    } else {
      dbCampaignBadge.innerText = `Stage ${currentStageNum}`;
    }
  }
  
  // Pinned Formulas Counter
  const pinnedCountText = document.getElementById('pinned-formula-count');
  if (pinnedCountText) pinnedCountText.innerText = state.pinnedFormulas.length;
  
  // Guarantee box border adjust
  const guaranteeWidget = document.querySelector('.guarantee-widget');
  if (guaranteeWidget) {
    if (guaranteePercent === 100) {
      guaranteeWidget.style.borderColor = 'var(--emerald)';
      guaranteeWidget.style.boxShadow = 'var(--shadow-glow-green)';
    } else {
      guaranteeWidget.style.borderColor = '';
      guaranteeWidget.style.boxShadow = '';
    }
  }
}

// Compute current stage number (1-5) based on progress
function getCurrentStageNum() {
  for (let sIdx = 0; sIdx < CAMPAIGN_STAGES.length; sIdx++) {
    const stage = CAMPAIGN_STAGES[sIdx];
    const isStageDone = stage.levels.every(lvl => state.completedLevels.includes(lvl.id));
    if (!isStageDone) {
      return sIdx + 1;
    }
  }
  return 5;
}

// --- CAMPAIGN MACHINE ---
let activeLevelId = null;
let currentSubQuestionIndex = 0;
let currentBossTask = null;
let currentShuffledOptions = [];
let hasChecked = false; // Tracks if current answer has been verified
let currentActiveQuestion = null;

function isLevelUnlocked(levelId) {
  return true;
}

function initCampaign() {
  document.getElementById('campaign-overview-view').style.display = 'block';
  document.getElementById('campaign-learning-view').style.display = 'none';
  
  // Clear active level state when returning to campaign overview
  activeLevelId = null;
  currentSubQuestionIndex = 0;
  state.activeLevelId = null;
  state.currentSubQuestionIndex = 0;
  saveState();
  
  renderCampaignOverview();
}

function renderCampaignOverview() {
  const container = document.getElementById('stages-selector-grid');
  if (!container) return;
  container.innerHTML = '';
  
  CAMPAIGN_STAGES.forEach((stage, sIdx) => {
    const card = document.createElement('div');
    card.className = 'stage-select-card';
    
    const completedCount = stage.levels.filter(lvl => state.completedLevels.includes(lvl.id)).length;
    
    const header = document.createElement('div');
    header.className = 'stage-select-header';
    header.innerHTML = `
      <span>${stage.title.toUpperCase()}</span>
      <span class="stage-select-badge">${completedCount} / 3 gelöst</span>
    `;
    card.appendChild(header);
    
    const levelsList = document.createElement('div');
    levelsList.className = 'stage-select-levels';
    
    stage.levels.forEach((lvl, lIdx) => {
      const isCompleted = state.completedLevels.includes(lvl.id);
      
      const btn = document.createElement('button');
      btn.className = `level-select-btn ${isCompleted ? 'completed' : ''} ${lvl.type === 'boss' ? 'boss-type' : ''}`;
      
      let iconHtml = '';
      if (isCompleted) {
        iconHtml = '<span class="node-status-icon"><i class="fa-solid fa-circle-check"></i></span>';
      } else if (lvl.type === 'boss') {
        iconHtml = '<span class="node-status-icon text-red"><i class="fa-solid fa-dragon"></i></span>';
      } else {
        iconHtml = '<span class="node-status-icon text-cyan"><i class="fa-solid fa-circle-play"></i></span>';
      }
      
      btn.innerHTML = `<span>Lvl ${lIdx+1}: ${lvl.title}</span> ${iconHtml}`;
      btn.addEventListener('click', () => selectCampaignLevel(lvl.id));
      levelsList.appendChild(btn);
    });
    
    card.appendChild(levelsList);
    container.appendChild(card);
  });
}

function selectCampaignLevel(lvlId) {
  document.getElementById('campaign-overview-view').style.display = 'none';
  document.getElementById('campaign-learning-view').style.display = 'block';
  selectLevel(lvlId);
}

function selectLevel(lvlId) {
  activeLevelId = lvlId;
  currentSubQuestionIndex = 0;
  state.activeLevelId = lvlId;
  state.currentSubQuestionIndex = 0;
  saveState();
  
  // Find level in DB
  let levelObj = null;
  let stageObj = null;
  for (const stage of CAMPAIGN_STAGES) {
    const l = stage.levels.find(lvl => lvl.id === lvlId);
    if (l) {
      levelObj = l;
      stageObj = stage;
      break;
    }
  }
  
  if (!levelObj) return;
  
  const workspaceActive = document.getElementById('workspace-active-state');
  workspaceActive.style.display = 'block';
  
  // Reset hasChecked state on load
  resetActionButton();
  
  document.getElementById('active-q-feedback').style.display = 'none';
  document.getElementById('didactic-solution').style.display = 'none';
  document.getElementById('btn-next-boss-task').style.display = 'none';
  
  if (levelObj.type === 'boss') {
    setupBossLevel(levelObj, stageObj);
  } else {
    setupNormalLevel(levelObj);
  }
}

function resetActionButton() {
  hasChecked = false;
  const checkBtn = document.getElementById('btn-check-answer');
  checkBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Antwort prüfen';
  checkBtn.className = 'btn btn-primary';
}

function getNextLevelId(levelId) {
  let stageIdx = -1;
  let lvlIdx = -1;
  for (let s = 0; s < CAMPAIGN_STAGES.length; s++) {
    const idx = CAMPAIGN_STAGES[s].levels.findIndex(l => l.id === levelId);
    if (idx > -1) {
      stageIdx = s;
      lvlIdx = idx;
      break;
    }
  }
  if (stageIdx === -1) return null;
  
  if (lvlIdx < 2) {
    return CAMPAIGN_STAGES[stageIdx].levels[lvlIdx + 1].id;
  } else {
    if (stageIdx < CAMPAIGN_STAGES.length - 1) {
      return CAMPAIGN_STAGES[stageIdx + 1].levels[0].id;
    }
  }
  return null;
}

function getLevelObj(lvlId) {
  for (const stage of CAMPAIGN_STAGES) {
    const l = stage.levels.find(lvl => lvl.id === lvlId);
    if (l) return l;
  }
  return null;
}

function getDynamicKlausur04() {
  const statements = [
    {
      correctText: "Das 2. Newtonsche Gesetz besagt: Kraft = Masse * Beschleunigung.",
      incorrectText: "Das 2. Newtonsche Gesetz besagt: Kraft = Masse * Geschwindigkeit.",
      explanation: "Kraft = Masse * **Beschleunigung** ($F = m \\cdot a$, nicht Geschwindigkeit)."
    },
    {
      correctText: "Der tägliche Energiebedarf eines Babys liegt bei 2,5 Millionen Joule pro Tag (2,5 MJ).",
      incorrectText: "Der tägliche Energiebedarf eines Babys liegt bei 2,5 Millionen Watt pro Tag.",
      explanation: "Der tägliche Energiebedarf liegt bei **2,5 MJ/Tag** ($2{,}5 \\cdot 10^6 \\text{ J}$)."
    },
    {
      correctText: "Der Druck im Sonneninneren liegt bei 2 * 10^16 Pascal (Pa).",
      incorrectText: "Der Druck im Sonneninneren liegt bei 2 * 10^16 Pa/m³.",
      explanation: "Druck wird in **Pascal (Pa)** angegeben, nicht $\\text{Pa/m}^3$ (das wäre ein Druckgradient)."
    },
    {
      correctText: "Der Tagesverbrauch der Beleuchtung eines Hörsaals liegt bei 2 Kilowattstunden (kWh).",
      incorrectText: "Der Tagesverbrauch der Beleuchtung eines Hörsaals liegt bei 2 Kilowatt (kW).",
      explanation: "Verbrauch (Energie) wird in **kWh** gemessen, kW ist die momentane Leistung."
    },
    {
      correctText: "Ein lautes Moped erzeugt 95 dB Schalldruckpegel, was einer Schallintensität von 3,16 mW/m² entspricht.",
      incorrectText: "Ein lautes Moped erzeugt 95 dB Schalldruckpegel, was einer Leistung von 3,16 mW entspricht.",
      explanation: "Der Pegel von 95 dB entspricht einer Schall**intensität** von $3{,}16 \\text{ mW/m}^2$, nicht einer Leistung in mW."
    }
  ];

  // Randomly select one statement index to be correct
  const correctIdx = Math.floor(Math.random() * statements.length);
  
  // Construct options array
  const options = [];
  const calculationLines = [];

  statements.forEach((stmt, idx) => {
    if (idx === correctIdx) {
      options.push(stmt.correctText);
      calculationLines.push("- **Richtig**: " + stmt.explanation);
    } else {
      options.push(stmt.incorrectText);
      calculationLines.push("- Falsch: " + stmt.explanation);
    }
  });

  const baseQ = EXAM_QUESTIONS.find(q => q.id === 'klausur_04');
  
  return {
    ...baseQ,
    options: options,
    correct: correctIdx,
    solution: {
      intuition: baseQ.solution.intuition,
      redThread: baseQ.solution.redThread,
      calculation: calculationLines.join('<br>')
    }
  };
}

// --- NORMAL THEORY / PRACTICE LEVEL LOGIC ---
function setupNormalLevel(levelObj) {
  document.getElementById('boss-profile-card').style.display = 'none';
  
  const qIds = levelObj.questionIds;
  const qId = qIds[currentSubQuestionIndex];
  
  let qObj = EXAM_QUESTIONS.find(q => q.id === qId);
  if (!qObj) return;

  if (qId === 'klausur_04') {
    qObj = getDynamicKlausur04();
  }
  
  currentActiveQuestion = qObj;
  
  document.getElementById('active-q-category').innerText = `${levelObj.title.toUpperCase()} (Schritt ${currentSubQuestionIndex + 1}/${qIds.length})`;
  document.getElementById('active-q-title').innerText = qObj.title;
  
  const textEl = document.getElementById('active-q-text');
  textEl.innerHTML = qObj.question;
  renderMath(textEl);
  
  const interactionContainer = document.getElementById('active-q-interaction');
  interactionContainer.innerHTML = '';
  
  if (qObj.type === 'multiple-choice' || qObj.type === 'multiple-choice-multi') {
    const list = document.createElement('div');
    list.className = 'choice-list';
    
    // Shuffle options dynamically on load to prevent rote memorization
    currentShuffledOptions = qObj.options.map((opt, idx) => ({ text: opt, index: idx }));
    currentShuffledOptions.sort(() => 0.5 - Math.random());
    
    currentShuffledOptions.forEach((opt) => {
      const row = document.createElement('div');
      row.className = 'choice-option';
      row.innerHTML = `<input type="${qObj.type === 'multiple-choice' ? 'radio' : 'checkbox'}" name="choice-radio-group" class="${qObj.type === 'multiple-choice' ? 'choice-radio' : 'choice-checkbox'}" value="${opt.index}"> <span>${opt.text}</span>`;
      
      row.addEventListener('click', (e) => {
        if (list.classList.contains('disabled')) return; // frozen
        
        // Reset correctness highlights on new selection
        list.querySelectorAll('.choice-option').forEach(c => {
          c.classList.remove('correct', 'wrong');
        });
        document.getElementById('active-q-feedback').style.display = 'none';
        document.getElementById('didactic-solution').style.display = 'none';
        
        if (qObj.type === 'multiple-choice') {
          list.querySelectorAll('.choice-option').forEach(c => {
            c.classList.remove('selected');
            c.querySelector('input').checked = false;
          });
          row.querySelector('input').checked = true;
          row.classList.add('selected');
        } else {
          if (e.target.tagName !== 'INPUT') {
            const input = row.querySelector('input');
            input.checked = !input.checked;
          }
          row.classList.toggle('selected', row.querySelector('input').checked);
        }
      });
      list.appendChild(row);
    });
    
    interactionContainer.appendChild(list);
    renderMath(list);
    
  } else if (qObj.type === 'multi-field') {
    qObj.fields.forEach(field => {
      const group = document.createElement('div');
      group.className = 'interaction-field-group';
      group.innerHTML = `
        <label>${field.label}</label>
        <input type="text" class="interaction-input" id="field-${field.id}" placeholder="${field.placeholder || ''}" autocomplete="off">
      `;
      const inputEl = group.querySelector('input');
      inputEl.addEventListener('input', () => {
        inputEl.style.borderColor = '';
        document.getElementById('active-q-feedback').style.display = 'none';
        document.getElementById('didactic-solution').style.display = 'none';
      });
      interactionContainer.appendChild(group);
      renderMath(group);
    });
  }
  
  // Pin Button Setup
  const pinBtn = document.getElementById('btn-pin-formula');
  if (qObj.formulaId) {
    pinBtn.style.display = 'inline-flex';
    updatePinButton(qObj.formulaId);
  } else {
    pinBtn.style.display = 'none';
  }
}

// --- BOSS LEVEL LOGIC (2 HP Math Fight) ---
function setupBossLevel(levelObj, stageObj) {
  const bProfile = document.getElementById('boss-profile-card');
  bProfile.style.display = 'flex';
  
  document.getElementById('boss-name-label').innerText = stageObj.bossName;
  document.getElementById('boss-avatar-emoji').innerText = stageObj.bossEmoji;
  
  if (state.bossHP[levelObj.id] === undefined) {
    state.bossHP[levelObj.id] = 2;
  }
  
  updateBossHPBar(levelObj.id);
  
  const generatorKey = stageObj.bossGenerator;
  const gen = GENERATOR_DB[generatorKey];
  if (!gen) return;
  
  currentBossTask = gen.generate();
  
  document.getElementById('active-q-category').innerText = `BOSS-KAMPF: ${stageObj.bossName}`;
  document.getElementById('active-q-title').innerText = gen.title;
  
  const textEl = document.getElementById('active-q-text');
  textEl.innerHTML = `<strong>Der Boss fordert dich heraus! Rechne richtig, um ihn zu verletzen!</strong><br><br>${currentBossTask.instruction}`;
  renderMath(textEl);
  
  const interactionContainer = document.getElementById('active-q-interaction');
  interactionContainer.innerHTML = '';
  
  currentBossTask.fields.forEach(field => {
    const group = document.createElement('div');
    group.className = 'interaction-field-group';
    group.innerHTML = `
      <label>${field.label}</label>
      <input type="text" class="interaction-input" id="booster-field-${field.id}" placeholder="${field.placeholder || ''}" autocomplete="off">
    `;
    const inputEl = group.querySelector('input');
    inputEl.addEventListener('input', () => {
      inputEl.style.borderColor = '';
      document.getElementById('active-q-feedback').style.display = 'none';
      document.getElementById('didactic-solution').style.display = 'none';
    });
    interactionContainer.appendChild(group);
    renderMath(group);
  });
  
  const pinBtn = document.getElementById('btn-pin-formula');
  pinBtn.style.display = 'inline-flex';
  updatePinButton(generatorKey.replace('_calc', ''));
}

function updateBossHPBar(levelId) {
  const hp = state.bossHP[levelId];
  const percent = (hp / 2) * 100;
  
  const bar = document.getElementById('boss-hp-bar');
  bar.style.width = `${percent}%`;
  
  const text = document.getElementById('boss-hp-text');
  text.innerText = `HP: ${hp} / 2`;
  
  if (hp === 1) {
    bar.style.background = 'linear-gradient(90deg, #d97706 0%, #f59e0b 100%)';
  } else {
    bar.style.background = 'linear-gradient(90deg, #b91c1c 0%, #ef4444 100%)';
  }
}

// --- CHECKING ANSWERS ---
document.getElementById('btn-check-answer').addEventListener('click', () => {
  if (!activeLevelId) return;
  
  let levelObj = null;
  let stageObj = null;
  for (const stage of CAMPAIGN_STAGES) {
    const l = stage.levels.find(lvl => lvl.id === activeLevelId);
    if (l) {
      levelObj = l;
      stageObj = stage;
      break;
    }
  }
  
  if (!levelObj) return;
  
  const checkBtn = document.getElementById('btn-check-answer');
  const nextLvlId = getNextLevelId(levelObj.id);
  
  // IF ALREADY CHECKED: Advance to next question or complete level
  if (hasChecked) {
    if (levelObj.type === 'boss') {
      const hp = state.bossHP[levelObj.id];
      if (hp <= 0) {
        if (nextLvlId) {
          selectCampaignLevel(nextLvlId);
        } else {
          initCampaign();
        }
      } else {
        resetActionButton();
        setupBossLevel(levelObj, stageObj);
        document.getElementById('active-q-feedback').style.display = 'none';
        document.getElementById('didactic-solution').style.display = 'none';
      }
    } else {
      const qIds = levelObj.questionIds;
      const isLastSub = (currentSubQuestionIndex === qIds.length - 1);
      if (isLastSub) {
        if (nextLvlId) {
          selectCampaignLevel(nextLvlId);
        } else {
          initCampaign();
        }
      } else {
        currentSubQuestionIndex++;
        state.currentSubQuestionIndex = currentSubQuestionIndex;
        saveState();
        resetActionButton();
        setupNormalLevel(levelObj);
        document.getElementById('active-q-feedback').style.display = 'none';
        document.getElementById('didactic-solution').style.display = 'none';
      }
    }
    return;
  }
  
  // PERFORM CHECK
  const feedbackEl = document.getElementById('active-q-feedback');
  feedbackEl.style.display = 'block';
  
  if (levelObj.type === 'boss') {
    handleCheckBossAnswer(levelObj, stageObj, feedbackEl);
  } else {
    handleCheckNormalAnswer(levelObj, feedbackEl);
  }
});

// Check Normal theory/practice answers
function handleCheckNormalAnswer(levelObj, feedbackEl) {
  const qIds = levelObj.questionIds;
  const qId = qIds[currentSubQuestionIndex];
  const qObj = (currentActiveQuestion && currentActiveQuestion.id === qId) ? currentActiveQuestion : EXAM_QUESTIONS.find(q => q.id === qId);
  if (!qObj) return;
  
  let isCorrect = false;
  
  if (qObj.type === 'multiple-choice') {
    const selectedRadio = document.querySelector('input.choice-radio:checked');
    if (!selectedRadio) {
      showToast("Bitte wähle eine Option aus!", "error");
      feedbackEl.style.display = 'none';
      return;
    }
    const ansIdx = parseInt(selectedRadio.value);
    isCorrect = (ansIdx === qObj.correct);
    
  } else if (qObj.type === 'multiple-choice-multi') {
    const checkboxes = document.querySelectorAll('.choice-checkbox:checked');
    const selectedIndexes = [];
    checkboxes.forEach(cb => {
      selectedIndexes.push(parseInt(cb.value));
    });
    
    if (selectedIndexes.length === 0) {
      showToast("Bitte wähle mindestens eine Option aus!", "error");
      feedbackEl.style.display = 'none';
      return;
    }
    
    selectedIndexes.sort();
    const correctSorted = [...qObj.correct].sort();
    isCorrect = (JSON.stringify(selectedIndexes) === JSON.stringify(correctSorted));
    
  } else if (qObj.type === 'multi-field') {
    isCorrect = true;
    
    qObj.fields.forEach(field => {
      const inputEl = document.getElementById(`field-${field.id}`);
      const userVal = cleanInput(inputEl.value);
      const correctVal = cleanInput(field.correct);
      
      const uf = parseFloat(userVal);
      const cf = parseFloat(correctVal);
      
      let fieldCorrect = false;
      if (!isNaN(uf) && !isNaN(cf)) {
        fieldCorrect = Math.abs(uf - cf) < 0.05;
      } else {
        fieldCorrect = (userVal === correctVal);
      }
      
      if (fieldCorrect) {
        inputEl.style.borderColor = 'var(--emerald)';
      } else {
        inputEl.style.borderColor = 'var(--red)';
        isCorrect = false;
      }
    });
  }
  
  if (isCorrect) {
    hasChecked = true; // Freeze state
    feedbackEl.className = 'feedback-alert success';
    
    // Freeze choices list
    const choiceList = document.querySelector('.choice-list');
    if (choiceList) choiceList.classList.add('disabled');
    
    // Freeze text fields
    if (qObj.type === 'multi-field') {
      qObj.fields.forEach(field => {
        const el = document.getElementById(`field-${field.id}`);
        if (el) el.disabled = true;
      });
    }
    
    // Highlight correct/incorrect options
    highlightQuizOptions(qObj);
    
    const isLastSub = (currentSubQuestionIndex === qIds.length - 1);
    const checkBtn = document.getElementById('btn-check-answer');
    
    if (isLastSub) {
      feedbackEl.innerHTML = `<strong>Richtig gelöst!</strong> Das Level wurde komplett abgeschlossen. +20 XP wurden gutgeschrieben.`;
      
      if (!state.completedLevels.includes(levelObj.id)) {
        state.completedLevels.push(levelObj.id);
        awardXP(20);
        saveState();
        
        checkAchievement('first_step');
        if (state.completedLevels.length === 15) {
          checkAchievement('pass_garant');
        }
      }
      
      const nextLvlId = getNextLevelId(levelObj.id);
      if (nextLvlId) {
        const nextLvlObj = getLevelObj(nextLvlId);
        checkBtn.innerHTML = `Nächstes Level: ${nextLvlObj.title} <i class="fa-solid fa-arrow-right"></i>`;
        checkBtn.className = 'btn btn-success';
      } else {
        checkBtn.innerHTML = 'Kampagne beendet! 🏆 <i class="fa-solid fa-flag-checkered"></i>';
        checkBtn.className = 'btn btn-success';
      }
    } else {
      feedbackEl.innerHTML = `<strong>Richtig gelöst!</strong> Klicke auf „Nächste Frage“, um fortzufahren.`;
      
      checkBtn.innerHTML = 'Nächste Frage <i class="fa-solid fa-chevron-right"></i>';
      checkBtn.className = 'btn btn-primary';
    }
    
    revealSolution(qObj);
    
  } else {
    feedbackEl.className = 'feedback-alert error';
    feedbackEl.innerHTML = `<strong>Leider falsch.</strong> Schau dir die Erklärung unten an, korrigiere deine Eingabe und versuche es noch einmal!`;
    
    // Highlight correct and wrong options to show which were correct and what they chose wrong
    highlightQuizOptions(qObj);
    
    // In incorrect state, we DO NOT freeze options so they can try again. We just show solutions.
    revealSolution(qObj);
  }
}

// Highlight correct green and incorrect red kacheln
function highlightQuizOptions(qObj) {
  const options = document.querySelectorAll('.choice-option');
  options.forEach(optRow => {
    const input = optRow.querySelector('input');
    const val = parseInt(input.value);
    
    if (qObj.type === 'multiple-choice') {
      if (val === qObj.correct) {
        optRow.classList.add('correct');
      } else {
        optRow.classList.add('wrong');
      }
    } else if (qObj.type === 'multiple-choice-multi') {
      if (qObj.correct.includes(val)) {
        optRow.classList.add('correct');
      } else {
        optRow.classList.add('wrong');
      }
    }
  });
}

// Check Boss fight answers
function handleCheckBossAnswer(levelObj, stageObj, feedbackEl) {
  if (!currentBossTask) return;
  
  let isCorrect = true;
  
  currentBossTask.fields.forEach(field => {
    const inputEl = document.getElementById(`booster-field-${field.id}`);
    const userVal = cleanInput(inputEl.value);
    const correctVal = cleanInput(field.correct);
    
    const uf = parseFloat(userVal);
    const cf = parseFloat(correctVal);
    
    let fieldCorrect = false;
    if (!isNaN(uf) && !isNaN(cf)) {
      fieldCorrect = Math.abs(uf - cf) < 0.05;
    } else {
      fieldCorrect = (userVal === correctVal);
    }
    
    if (fieldCorrect) {
      inputEl.style.borderColor = 'var(--emerald)';
    } else {
      inputEl.style.borderColor = 'var(--red)';
      isCorrect = false;
    }
  });
  
  if (isCorrect) {
    hasChecked = true; // Freeze state
    
    // Freeze text fields
    currentBossTask.fields.forEach(field => {
      const el = document.getElementById(`booster-field-${field.id}`);
      if (el) el.disabled = true;
    });
    
    let hp = state.bossHP[levelObj.id] || 2;
    hp--;
    state.bossHP[levelObj.id] = hp;
    updateBossHPBar(levelObj.id);
    
    const checkBtn = document.getElementById('btn-check-answer');
    
    if (hp <= 0) {
      // Boss defeated
      feedbackEl.className = 'feedback-alert success';
      feedbackEl.innerHTML = `<strong>💥 Boss besiegt!</strong> Du hast den ${stageObj.bossName} erfolgreich vertrieben und die Stage abgeschlossen! +50 XP erhalten.`;
      
      if (!state.completedLevels.includes(levelObj.id)) {
        state.completedLevels.push(levelObj.id);
        awardXP(50);
        saveState();
        checkAchievement('booster_expert');
      }
      
      const nextLvlId = getNextLevelId(levelObj.id);
      if (nextLvlId) {
        const nextLvlObj = getLevelObj(nextLvlId);
        checkBtn.innerHTML = `Nächstes Level: ${nextLvlObj.title} <i class="fa-solid fa-circle-chevron-right"></i>`;
        checkBtn.className = 'btn btn-success';
      } else {
        checkBtn.innerHTML = 'Kampagne beendet! 🏆 <i class="fa-solid fa-flag-checkered"></i>';
        checkBtn.className = 'btn btn-success';
      }
    } else {
      // Boss hurt but alive
      feedbackEl.className = 'feedback-alert success';
      feedbackEl.innerHTML = `<strong>💥 Treffer!</strong> Du hast dem Boss 1 HP abgezogen! Klicke auf „Nächste Boss-Aufgabe“ für die finale Runde.`;
      
      checkBtn.innerHTML = 'Nächste Boss-Aufgabe <i class="fa-solid fa-chevron-right"></i>';
      checkBtn.className = 'btn btn-primary';
      saveState();
    }
    
    revealBossSolution(currentBossTask);
    
  } else {
    feedbackEl.className = 'feedback-alert error';
    feedbackEl.innerHTML = `<strong>Rechenfehler!</strong> Der Boss pariert deinen Angriff. Korrigiere deine Werte und probiere es erneut.`;
    revealBossSolution(currentBossTask);
  }
}

function cleanInput(val) {
  return val.trim().toLowerCase().replace(',', '.').replace(/\s/g, '').replace(/ohm/g, 'Ω');
}

function revealSolution(qObj) {
  const solContainer = document.getElementById('didactic-solution');
  solContainer.style.display = 'block';
  
  document.getElementById('sol-intuition').innerHTML = formatMarkdown(qObj.solution.intuition);
  document.getElementById('sol-redthread').innerHTML = formatMarkdown(qObj.solution.redThread);
  document.getElementById('sol-calculation').innerHTML = formatMarkdown(qObj.solution.calculation);
  
  renderMath(solContainer);
}

function revealBossSolution(taskObj) {
  const solContainer = document.getElementById('didactic-solution');
  solContainer.style.display = 'block';
  
  document.getElementById('sol-intuition').innerHTML = formatMarkdown(taskObj.solution.intuition);
  document.getElementById('sol-redthread').innerHTML = formatMarkdown(taskObj.solution.redThread);
  document.getElementById('sol-calculation').innerHTML = formatMarkdown(taskObj.solution.calculation);
  
  renderMath(solContainer);
}

// --- 3. SPICKZETTEL (CHEATSHEET) ---
function renderCheatSheet() {
  const grid = document.getElementById('cheatsheet-grid');
  grid.innerHTML = '';
  
  const pinnedIds = state.pinnedFormulas;
  if (pinnedIds.length === 0) {
    grid.appendChild(document.getElementById('no-formulas-state'));
    document.getElementById('no-formulas-state').style.display = 'block';
    return;
  }
  
  document.getElementById('no-formulas-state').style.display = 'none';
  
  pinnedIds.forEach(id => {
    const fObj = FORMULAS_DB[id];
    if (!fObj) return;
    
    const card = document.createElement('div');
    card.className = 'formula-card';
    
    const customNote = state.formulaNotes[id] || '';
    
    card.innerHTML = `
      <div class="formula-card-header">
        <span class="formula-card-title">${fObj.title}</span>
        <button class="btn-card-unpin" title="Formel entfernen"><i class="fa-solid fa-thumbtack-slash"></i></button>
      </div>
      <div class="formula-card-latex">$$${fObj.formula}$$</div>
      <div class="formula-card-desc">${fObj.description}</div>
      <div class="formula-card-recipe">${fObj.recipe}</div>
      <div class="formula-card-notes">
        <label>Eigene Notizen:</label>
        <textarea class="formula-card-textarea" placeholder="Formelabwandlungen, Rechenregeln oder Vorlesungsnotizen hinzufügen...">${customNote}</textarea>
        <div class="formula-card-notes-print">${customNote ? '<strong>Eigene Notizen:</strong> ' + customNote : ''}</div>
      </div>
    `;
    
    card.querySelector('.btn-card-unpin').addEventListener('click', () => {
      togglePinFormula(id);
      renderCheatSheet();
    });
    
    const textarea = card.querySelector('.formula-card-textarea');
    const printNotes = card.querySelector('.formula-card-notes-print');
    
    textarea.addEventListener('input', (e) => {
      state.formulaNotes[id] = e.target.value;
      printNotes.innerHTML = e.target.value ? '<strong>Eigene Notizen:</strong> ' + e.target.value : '';
      localStorage.setItem('resonanz_physics_state', JSON.stringify(state));
    });
    
    grid.appendChild(card);
  });
  
  renderMath(grid);
}

// Pin/Unpin function
function togglePinFormula(formulaId) {
  const idx = state.pinnedFormulas.indexOf(formulaId);
  if (idx > -1) {
    state.pinnedFormulas.splice(idx, 1);
    showToast("Formel vom Spickzettel entfernt.", "info");
  } else {
    state.pinnedFormulas.push(formulaId);
    showToast("Formel auf Spickzettel gepinnt!", "success");
    checkAchievement('cheatsheet_builder');
  }
  saveState();
  if (activeLevelId) {
    let levelObj = null;
    for (const stage of CAMPAIGN_STAGES) {
      const l = stage.levels.find(lvl => lvl.id === activeLevelId);
      if (l) { levelObj = l; break; }
    }
    if (levelObj) {
      const qIds = levelObj.questionIds;
      const qId = qIds ? qIds[currentSubQuestionIndex] : null;
      const qObj = (currentActiveQuestion && currentActiveQuestion.id === qId) ? currentActiveQuestion : EXAM_QUESTIONS.find(q => q.id === qId);
      if (qObj && qObj.formulaId) {
        updatePinButton(qObj.formulaId);
      } else if (levelObj.type === 'boss') {
        const stageObj = CAMPAIGN_STAGES.find(s => s.levels.includes(levelObj));
        updatePinButton(stageObj.bossGenerator.replace('_calc', ''));
      }
    }
  }
}

function updatePinButton(formulaId) {
  const pinBtn = document.getElementById('btn-pin-formula');
  if (!pinBtn) return;
  if (state.pinnedFormulas.includes(formulaId)) {
    pinBtn.innerHTML = `<i class="fa-solid fa-thumbtack-slash"></i> Formel entpinnen`;
    pinBtn.className = 'btn btn-secondary';
  } else {
    pinBtn.innerHTML = `<i class="fa-solid fa-thumbtack"></i> Formel pinnen`;
    pinBtn.className = 'btn btn-violet';
  }
}

document.getElementById('btn-pin-formula').addEventListener('click', () => {
  if (!activeLevelId) return;
  let levelObj = null;
  let stageObj = null;
  for (const stage of CAMPAIGN_STAGES) {
    const l = stage.levels.find(lvl => lvl.id === activeLevelId);
    if (l) { levelObj = l; stageObj = stage; break; }
  }
  if (!levelObj) return;
  
  if (levelObj.type === 'boss') {
    togglePinFormula(stageObj.bossGenerator.replace('_calc', ''));
  } else {
    const qIds = levelObj.questionIds;
    const qId = qIds[currentSubQuestionIndex];
    const qObj = (currentActiveQuestion && currentActiveQuestion.id === qId) ? currentActiveQuestion : EXAM_QUESTIONS.find(q => q.id === qId);
    if (qObj && qObj.formulaId) {
      togglePinFormula(qObj.formulaId);
    }
  }
});

// Cheatsheet actions
document.getElementById('btn-pin-all-formulas').addEventListener('click', () => {
  Object.keys(FORMULAS_DB).forEach(id => {
    if (!state.pinnedFormulas.includes(id)) {
      state.pinnedFormulas.push(id);
    }
  });
  saveState();
  renderCheatSheet();
  showToast("Alle Formelkarten wurden gepinnt!", "success");
});

document.getElementById('btn-clear-cheatsheet').addEventListener('click', () => {
  if (confirm("Möchtest du wirklich alle Formeln vom Spickzettel entfernen?")) {
    state.pinnedFormulas = [];
    state.formulaNotes = {};
    saveState();
    renderCheatSheet();
    showToast("Spickzettel zurückgesetzt.", "info");
  }
});

document.getElementById('btn-print-cheatsheet').addEventListener('click', () => {
  if (state.pinnedFormulas.length === 0) {
    showToast("Dein Spickzettel ist leer! Pinne zuerst mindestens eine Formel.", "error");
    return;
  }
  window.print();
});

// --- 5. PROGRESS & STATS ---
const ACHIEVEMENTS_DB = {
  first_step: {
    id: 'first_step',
    icon: '🚀',
    title: 'Erster Meilenstein',
    description: 'Schließe das erste Level deiner Klausur-Kampagne ab.'
  },
  pass_garant: {
    id: 'pass_garant',
    icon: '🛡️',
    title: 'Bestehens-Garantie',
    description: 'Schließe alle 15 Levels (inkl. aller Bosse) ab.'
  },
  cheatsheet_builder: {
    id: 'cheatsheet_builder',
    icon: '📝',
    title: 'Klausurspion',
    description: 'Pinne mindestens 8 Formelkarten auf deinen Spickzettel.'
  },
  booster_expert: {
    id: 'booster_expert',
    icon: '⚡',
    title: 'Boss-Schreck',
    description: 'Besiege mindestens 3 Boss-Gegner in der Kampagne.'
  },
  perfect_quickie: {
    id: 'perfect_quickie',
    icon: '🎓',
    title: 'Vorlesungs-Streber',
    description: 'Schließe ein Vorlesungs-Quickie komplett ab.'
  },
  sprint_champ: {
    id: 'sprint_champ',
    icon: '🏃',
    title: 'Formel-Raser',
    description: 'Löse mindestens 8 Aufgaben richtig in einem Formel-Sprint.'
  }
};

function renderStats() {
  const completedCount = state.completedLevels.length;
  document.getElementById('stats-xp').innerText = state.xp;
  document.getElementById('stats-streak').innerText = state.streak;
  document.getElementById('stats-solved-count').innerText = `${completedCount} / 15`;
  
  const rankIdx = Math.min(completedCount, RANKS.length - 1);
  document.getElementById('stats-level').innerText = RANKS[rankIdx];
  
  const achievementsContainer = document.getElementById('achievements-list');
  achievementsContainer.innerHTML = '';
  
  Object.keys(ACHIEVEMENTS_DB).forEach(id => {
    const ach = ACHIEVEMENTS_DB[id];
    const isUnlocked = state.unlockedAchievements.includes(id);
    
    const card = document.createElement('div');
    card.className = `achievement-card card ${isUnlocked ? 'unlocked' : ''}`;
    card.innerHTML = `
      <div class="achievement-icon">${ach.icon}</div>
      <div class="achievement-info">
        <h4>${ach.title}</h4>
        <p>${ach.description}</p>
      </div>
    `;
    achievementsContainer.appendChild(card);
  });
}

function checkAchievement(id) {
  if (state.unlockedAchievements.includes(id)) return;
  
  let unlock = false;
  if (id === 'first_step' && state.completedLevels.length >= 1) unlock = true;
  if (id === 'pass_garant' && state.completedLevels.length >= 15) unlock = true;
  if (id === 'cheatsheet_builder' && state.pinnedFormulas.length >= 8) unlock = true;
  
  const bossesDefeated = ['stage1_lvl3', 'stage2_lvl3', 'stage3_lvl3', 'stage4_lvl3', 'stage5_lvl3'].filter(bId => state.completedLevels.includes(bId)).length;
  if (id === 'booster_expert' && bossesDefeated >= 3) unlock = true;
  
  if (id === 'perfect_quickie') unlock = true;
  if (id === 'sprint_champ') unlock = true;
  
  if (unlock) {
    state.unlockedAchievements.push(id);
    awardXP(50);
    showToast(`🏆 Erfolg freigeschaltet: "${ACHIEVEMENTS_DB[id].title}"! (+50 XP)`, 'success');
    saveState();
  }
}

// --- 6. INTERACTIVE MODAL 1: QUICKIE QUIZ ---
let quickieQuestions = [];
let quickieCurrentIndex = 0;
let quickieScore = 0;

document.getElementById('start-quickie-btn').addEventListener('click', () => {
  const shuffled = [...LECTURE_QUESTIONS].sort(() => 0.5 - Math.random());
  quickieQuestions = shuffled.slice(0, 5);
  
  quickieCurrentIndex = 0;
  quickieScore = 0;
  
  document.getElementById('quickie-modal').style.display = 'flex';
  loadQuickieQuestion();
});

function loadQuickieQuestion() {
  const progressFill = document.getElementById('quickie-progress-fill');
  progressFill.style.width = `${(quickieCurrentIndex / 5) * 100}%`;
  
  document.getElementById('quickie-q-counter').innerText = `Frage ${quickieCurrentIndex + 1} von 5`;
  document.getElementById('btn-next-quickie').style.display = 'none';
  document.getElementById('quickie-feedback').style.display = 'none';
  
  const q = quickieQuestions[quickieCurrentIndex];
  const qText = document.getElementById('quickie-question-text');
  qText.innerHTML = q.question;
  renderMath(qText);
  
  const optionsContainer = document.getElementById('quickie-options');
  optionsContainer.innerHTML = '';
  
  q.options.forEach((opt, idx) => {
    const btn = document.createElement('div');
    btn.className = 'quickie-opt';
    btn.innerHTML = opt;
    btn.addEventListener('click', () => handleQuickieAnswer(idx, btn));
    optionsContainer.appendChild(btn);
  });
  renderMath(optionsContainer);
}

function loadNextQuickie() {
  quickieCurrentIndex++;
  if (quickieCurrentIndex < 5) {
    loadQuickieQuestion();
  } else {
    document.getElementById('quickie-modal').style.display = 'none';
    const xpEarned = quickieScore * 10;
    awardXP(xpEarned);
    
    showToast(`Quiz beendet! Du hast ${quickieScore}/5 Fragen richtig beantwortet. (+${xpEarned} XP)`, 'success');
    
    if (quickieScore === 5) {
      checkAchievement('perfect_quickie');
    }
  }
}

document.getElementById('btn-next-quickie').addEventListener('click', loadNextQuickie);

function handleQuickieAnswer(selectedIdx, btnElement) {
  const q = quickieQuestions[quickieCurrentIndex];
  const optionsContainer = document.getElementById('quickie-options');
  
  optionsContainer.querySelectorAll('.quickie-opt').forEach(opt => {
    opt.style.pointerEvents = 'none';
  });
  
  const isCorrect = (selectedIdx === q.correct);
  if (isCorrect) {
    btnElement.classList.add('correct');
    quickieScore++;
  } else {
    btnElement.classList.add('wrong');
    optionsContainer.childNodes[q.correct].classList.add('correct');
  }
  
  const feedbackEl = document.getElementById('quickie-feedback');
  feedbackEl.style.display = 'block';
  feedbackEl.className = `feedback-alert ${isCorrect ? 'success' : 'error'}`;
  
  let feedbackText = isCorrect ? `<strong>Korrekt!</strong> ` : `<strong>Leider falsch.</strong> `;
  feedbackText += `<br><br><strong>Physikalischer Gedanke:</strong><br>${q.solution.calculation}`;
  feedbackEl.innerHTML = feedbackText;
  renderMath(feedbackEl);
  
  document.getElementById('btn-next-quickie').style.display = 'inline-flex';
}

document.getElementById('btn-close-quickie').addEventListener('click', () => {
  document.getElementById('quickie-modal').style.display = 'none';
});

// --- 7. INTERACTIVE MODAL 2: FORMEL-SPRINT ---
let sprintTimer = 60;
let sprintInterval = null;
let sprintScore = 0;
let currentSprintTask = null;

document.getElementById('start-sprint-btn').addEventListener('click', () => {
  sprintScore = 0;
  sprintTimer = 60;
  document.getElementById('sprint-score').innerText = '0';
  document.getElementById('sprint-timer').innerText = '60s';
  document.getElementById('sprint-modal').style.display = 'flex';
  document.getElementById('sprint-feedback').style.display = 'none';
  
  startSprintTimer();
  loadSprintTask();
});

function startSprintTimer() {
  if (sprintInterval) clearInterval(sprintInterval);
  
  sprintInterval = setInterval(() => {
    sprintTimer--;
    document.getElementById('sprint-timer').innerText = `${sprintTimer}s`;
    
    if (sprintTimer <= 0) {
      clearInterval(sprintInterval);
      finishSprint();
    }
  }, 1000);
}

function loadSprintTask() {
  const type = randChoice(['wave', 'freq', 'omega', 'mündung']);
  
  const questionTextEl = document.getElementById('sprint-question-text');
  const interactionEl = document.getElementById('sprint-interaction');
  interactionEl.innerHTML = '';
  
  if (type === 'wave') {
    const f = randChoice([100, 200, 500, 1000]);
    const l = randChoice([0.34, 0.68, 1.7, 3.4]);
    const c = 340;
    
    const askFor = randChoice(['lambda', 'freq']);
    if (askFor === 'lambda') {
      const lam = c / f;
      questionTextEl.innerHTML = `Berechne die Wellenlänge $\\lambda$ in Metern:<br>Frequenz $f = ${f}\\text{ Hz}$, Schallgeschwindigkeit $c = 340\\text{ m/s}$.`;
      currentSprintTask = { correct: lam.toString(), tolerance: 0.05 };
    } else {
      questionTextEl.innerHTML = `Berechne die Frequenz $f$ in Hz:<br>Wellenlänge $\\lambda = ${l}\\text{ m}$, Schallgeschwindigkeit $c = 340\\text{ m/s}$.`;
      currentSprintTask = { correct: Math.round(c / l).toString(), tolerance: 2 };
    }
  } else if (type === 'freq') {
    const T = randChoice([0.01, 0.002, 0.05, 0.2, 2.5]);
    const f = 1 / T;
    questionTextEl.innerHTML = `Berechne die Frequenz $f$ in Hz aus der Schwingungsdauer:<br>Periodendauer $T = ${T.toString().replace('.', ',')}\\text{ s}$.`;
    currentSprintTask = { correct: f.toString(), tolerance: 0.1 };
  } else if (type === 'omega') {
    const f = randChoice([10, 50, 100, 200]);
    const w = 2 * Math.PI * f;
    questionTextEl.innerHTML = `Berechne die Kreisfrequenz $\\omega$ in rad/s (gerundet auf eine Dezimalstelle):<br>Frequenz $f = ${f}\\text{ Hz}$.`;
    currentSprintTask = { correct: roundTo(w, 1).toString(), tolerance: 0.2 };
  } else {
    const r = randChoice([0.05, 0.1, 0.2, 0.5]);
    const dL = 0.6 * r;
    questionTextEl.innerHTML = `Berechne die Mündungskorrektur $\\Delta L$ in Metern für ein offenes Ende:<br>Rohrradius $r = ${r.toString().replace('.', ',')}\\text{ m}$.`;
    currentSprintTask = { correct: dL.toString(), tolerance: 0.01 };
  }
  
  renderMath(questionTextEl);
  
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'interaction-input';
  input.id = 'sprint-answer-field';
  input.placeholder = 'Wert eingeben und Enter drücken';
  input.autocomplete = 'off';
  interactionEl.appendChild(input);
  input.focus();
  
  input.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      submitSprintAnswer();
    }
  });
}

function submitSprintAnswer() {
  const inputEl = document.getElementById('sprint-answer-field');
  if (!inputEl || !currentSprintTask) return;
  
  const userVal = cleanInput(inputEl.value);
  const correctVal = cleanInput(currentSprintTask.correct);
  
  const uf = parseFloat(userVal);
  const cf = parseFloat(correctVal);
  
  let isCorrect = false;
  if (!isNaN(uf) && !isNaN(cf)) {
    isCorrect = Math.abs(uf - cf) <= (currentSprintTask.tolerance || 0.05);
  } else {
    isCorrect = (userVal === correctVal);
  }
  
  const feedbackEl = document.getElementById('sprint-feedback');
  feedbackEl.style.display = 'block';
  
  if (isCorrect) {
    feedbackEl.className = 'feedback-alert success';
    feedbackEl.innerHTML = `<strong>Korrekt!</strong> +1 Punkt`;
    sprintScore++;
    document.getElementById('sprint-score').innerText = sprintScore;
    
    setTimeout(() => {
      loadSprintTask();
      feedbackEl.style.display = 'none';
    }, 400);
  } else {
    feedbackEl.className = 'feedback-alert error';
    feedbackEl.innerHTML = `<strong>Falsch!</strong> Richtig gewesen wäre: <strong>${currentSprintTask.correct}</strong>`;
    
    setTimeout(() => {
      loadSprintTask();
      feedbackEl.style.display = 'none';
    }, 1200);
  }
}

document.getElementById('btn-sprint-submit').addEventListener('click', submitSprintAnswer);

function finishSprint() {
  document.getElementById('sprint-modal').style.display = 'none';
  const xp = sprintScore * 5;
  awardXP(xp);
  
  showToast(`Sprint beendet! Du hast ${sprintScore} Aufgaben richtig gelöst. (+${xp} XP)`, 'success');
  
  if (sprintScore >= 8) {
    checkAchievement('sprint_champ');
  }
}

// --- REDIRECTS & NAVIGATION BINDINGS ---
document.getElementById('btn-start-marathon').addEventListener('click', () => {
  switchTab('campaign');
  
  // Auto-select first incomplete level in the workspace view immediately
  let autoLvlId = null;
  for (const stage of CAMPAIGN_STAGES) {
    for (const lvl of stage.levels) {
      if (!state.completedLevels.includes(lvl.id)) {
        autoLvlId = lvl.id;
        break;
      }
    }
    if (autoLvlId) break;
  }
  if (!autoLvlId) autoLvlId = 'stage1_lvl1';
  selectCampaignLevel(autoLvlId);
});

document.getElementById('btn-dashboard-to-campaign').addEventListener('click', () => {
  switchTab('campaign');
});

document.getElementById('dashboard-to-cheatsheet-btn').addEventListener('click', () => {
  switchTab('cheatsheet');
});

document.getElementById('btn-back-to-overview').addEventListener('click', () => {
  initCampaign();
});

function randChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function roundTo(num, decimals) {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// --- STREAK RESET MONITORING & INIT ---
loadState();
updateStreak();
switchTab(currentTab);

// Restore active level progress if page was reloaded/refreshed during a session
if (currentTab === 'campaign' && activeLevelId) {
  selectCampaignLevel(activeLevelId);
  const data = localStorage.getItem('resonanz_physics_state');
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.currentSubQuestionIndex !== undefined) {
        currentSubQuestionIndex = parsed.currentSubQuestionIndex;
        state.currentSubQuestionIndex = currentSubQuestionIndex;
        
        let levelObj = getLevelObj(activeLevelId);
        if (levelObj) {
          if (levelObj.type === 'boss') {
            const stageObj = CAMPAIGN_STAGES.find(s => s.levels.includes(levelObj));
            setupBossLevel(levelObj, stageObj);
          } else {
            setupNormalLevel(levelObj);
          }
        }
      }
    } catch (e) {
      console.error("Failed to restore session question step", e);
    }
  }
}

// Global keydown event listener to allow submitting/advancing answers via Enter key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    // 1. If inside Campaign Tab
    if (currentTab === 'campaign' && activeLevelId) {
      if (e.target.tagName === 'TEXTAREA') return;
      e.preventDefault();
      const checkBtn = document.getElementById('btn-check-answer');
      if (checkBtn && checkBtn.style.display !== 'none' && !checkBtn.disabled) {
        checkBtn.click();
      }
    }
  }
});

// Helper function to convert markdown double asterisks **bold** to HTML <strong>bold</strong> tags
function formatMarkdown(text) {
  if (!text) return "";
  return text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}
