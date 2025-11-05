const uuid = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(16).slice(2));
const randomInRange = (min, max) => Math.random() * (max - min) + min;

function generateWaveform(points = 64, center = 0.6) {
  const values = [];
  let current = center;
  for (let i = 0; i < points; i += 1) {
    current += randomInRange(-0.25, 0.25);
    current = Math.max(0.05, Math.min(1, current));
    values.push(Number(current.toFixed(2)));
    current = current * 0.7 + center * 0.3;
  }
  return values;
}

const state = {
  measures: 16,
  playing: false,
  playheadSeconds: 0,
  playheadBar: 1,
  timer: null,
  selectedTrackId: null,
  selectedClip: null,
  tracks: [
    {
      id: uuid(),
      name: "Kit Neural",
      role: "Batería",
      aiMode: "Groove Sculpt v2",
      color: { base: "rgba(109,141,255,0.65)", glow: "rgba(50,85,210,0.4)" },
      gain: -2,
      pan: 0,
      macros: ["Swing 12%", "Puerta IA"],
      waveform: generateWaveform(72, 0.55),
      clips: [
        { id: uuid(), name: "Intro Beat", ai: "Ritmo IA", start: 1, length: 4, detail: "Kick+snare procesado" },
        { id: uuid(), name: "Verso", ai: "Refuerzo dinámico", start: 5, length: 4, detail: "Groove modular" },
        { id: uuid(), name: "Coro", ai: "Impulso híbrido", start: 9, length: 4, detail: "Percusión expansiva" }
      ]
    },
    {
      id: uuid(),
      name: "Bajo Holográfico",
      role: "Bajo",
      aiMode: "LowEnd Sculptor",
      color: { base: "rgba(45,212,191,0.65)", glow: "rgba(37,165,148,0.35)" },
      gain: -3,
      pan: -10,
      macros: ["Armónicos AI", "Sidechain inteligente"],
      waveform: generateWaveform(72, 0.6),
      clips: [
        { id: uuid(), name: "Intro bass", ai: "Profundidad controlada", start: 1, length: 8, detail: "Seno híbrido" },
        { id: uuid(), name: "Drop bass", ai: "Distorsión neural", start: 9, length: 4, detail: "Saturación creativa" }
      ]
    },
    {
      id: uuid(),
      name: "Pads Aurora",
      role: "Texturas",
      aiMode: "Atmos Architect",
      color: { base: "rgba(249,115,255,0.6)", glow: "rgba(185,79,214,0.35)" },
      gain: -8,
      pan: 12,
      macros: ["LFO 3D", "Reverberación adaptativa"],
      waveform: generateWaveform(72, 0.68),
      clips: [
        { id: uuid(), name: "Pad continuo", ai: "Capa etérea", start: 1, length: 16, detail: "Auto evolución" }
      ]
    },
    {
      id: uuid(),
      name: "Voces Prisma",
      role: "Voz lead",
      aiMode: "Vocal Architect",
      color: { base: "rgba(255,185,135,0.65)", glow: "rgba(212,132,74,0.35)" },
      gain: -1,
      pan: 4,
      macros: ["Afinación IA", "Dobles sincronizados"],
      waveform: generateWaveform(72, 0.72),
      clips: [
        { id: uuid(), name: "Verso lead", ai: "Corrección expresiva", start: 5, length: 4, detail: "Afinación híbrida" },
        { id: uuid(), name: "Coro lead", ai: "Refuerzo coral", start: 9, length: 4, detail: "Capas brillantes" }
      ]
    }
  ],
  stems: [],
  stemProcessing: "idle",
  masterMix: 0,
  vocalSettings: {
    pitchStrength: 65,
    formantShift: 0,
    vibratoDepth: 20,
    deEss: 40,
    doubleMode: true,
    tuneBackgrounds: false
  },
  noiseSettings: {
    profile: "estudio",
    amount: 35
  },
  versions: [
    { id: uuid(), name: "v1 - Boceto", note: "Estructura básica con IA rítmica", timestamp: "Hace 1 h" },
    { id: uuid(), name: "v2 - Dirección", note: "Ajustes de bajo y texturas", timestamp: "Hace 12 min" }
  ],
  library: [
    { name: "Kit Future Breaks", tags: "BPM 120 • Batería" },
    { name: "Arpeggio Prisma", tags: "Sintetizador • Tonal" },
    { name: "Voces celestes", tags: "Coros IA • Pads" },
    { name: "Analog Bass Deep", tags: "Bajo • Groove" },
    { name: "FX nebulosa", tags: "Transiciones" }
  ],
  ideaHistory: []
};

const colors = [
  { base: "rgba(109,141,255,0.65)", glow: "rgba(50,85,210,0.4)" },
  { base: "rgba(45,212,191,0.65)", glow: "rgba(37,165,148,0.35)" },
  { base: "rgba(249,115,255,0.6)", glow: "rgba(185,79,214,0.35)" },
  { base: "rgba(251,191,36,0.55)", glow: "rgba(204,138,21,0.3)" },
  { base: "rgba(96,165,250,0.6)", glow: "rgba(59,130,246,0.35)" }
];

const libraryList = document.querySelector('#library-list');
const timelineRuler = document.querySelector('#timeline-ruler');
const tracksContainer = document.querySelector('#tracks');
const trackTemplate = document.querySelector('#track-template');
const inspectorBody = document.querySelector('#inspector-body');
const aiLog = document.querySelector('#ai-log');
const aiForm = document.querySelector('#ai-form');
const aiPrompt = document.querySelector('#ai-prompt');
const versionList = document.querySelector('#version-list');
const generatorForm = document.querySelector('#generator-form');
const generatorStatus = document.querySelector('#generator-status');
const tempoSlider = document.querySelector('#tempo');
const tempoValue = document.querySelector('#tempo-value');
const humanizeSlider = document.querySelector('#humanize');
const humanizeValue = document.querySelector('#humanize-value');
const transportDisplay = document.querySelector('#transport-display');
const playButton = document.querySelector('#play');
const rewindButton = document.querySelector('#rewind');
const recordButton = document.querySelector('#record');
const playheadTime = document.querySelector('#playhead-time');
const masterMeter = document.querySelector('#master-meter .meter-level');
const stemsList = document.querySelector('#stem-list');
const stemMixers = document.querySelector('#stem-mixers');
const separateStemsButton = document.querySelector('#separate-stems');
const masterMixSlider = document.querySelector('#master-mix');
const masterMixValue = document.querySelector('#master-mix-value');
const vocalForm = document.querySelector('#vocal-form');
const pitchStrengthInput = document.querySelector('#pitch-strength');
const pitchStrengthValue = document.querySelector('#pitch-strength-value');
const formantShiftInput = document.querySelector('#formant-shift');
const formantShiftValue = document.querySelector('#formant-shift-value');
const vibratoDepthInput = document.querySelector('#vibrato-depth');
const vibratoDepthValue = document.querySelector('#vibrato-depth-value');
const deEssInput = document.querySelector('#de-ess');
const deEssValue = document.querySelector('#de-ess-value');
const doubleModeToggle = document.querySelector('#double-mode');
const tuneBackgroundsToggle = document.querySelector('#tune-backgrounds');
const noiseProfileSelect = document.querySelector('#noise-profile');
const noiseAmountSlider = document.querySelector('#noise-amount');
const noiseAmountValue = document.querySelector('#noise-amount-value');
const noiseStatus = document.querySelector('#noise-status');
const learnNoiseButton = document.querySelector('#learn-noise');
const applyNoiseButton = document.querySelector('#apply-noise');
const ideasForm = document.querySelector('#ideas-form');
const ideaReferenceSelect = document.querySelector('#idea-reference');
const ideaGoalInput = document.querySelector('#idea-goal');
const ideaSuggestions = document.querySelector('#idea-suggestions');

function init() {
  renderRuler();
  renderLibrary();
  renderTracks();
  renderVersions();
  renderStems();
  renderStemMixers();
  renderIdeaSuggestions();
  seedConsole();
  attachEvents();
  updateTempoLabel();
  updateHumanizeLabel();
  updateMasterMixLabel();
  updateVocalBadges();
  updateNoiseAmountLabel();
  updateNoiseProfileStatus();
}

function renderRuler() {
  if (!timelineRuler) return;
  timelineRuler.innerHTML = '';
  for (let bar = 1; bar <= state.measures; bar += 1) {
    const span = document.createElement('span');
    span.textContent = bar;
    timelineRuler.appendChild(span);
  }
}

function renderLibrary() {
  if (!libraryList) return;
  libraryList.innerHTML = '';
  state.library.forEach(item => {
    const li = document.createElement('li');
    li.className = 'library-item';
    li.innerHTML = `<strong>${item.name}</strong><span>${item.tags}</span>`;
    li.addEventListener('click', () => {
      appendConsole('usuario', `Añadir "${item.name}" a la sesión`);
      appendConsole('sistema', `Preparando recomendación IA para ${item.name}.`);
    });
    libraryList.appendChild(li);
  });
}

function renderTracks() {
  if (!tracksContainer) return;
  syncStemsWithTracks();
  tracksContainer.innerHTML = '';
  state.tracks.forEach((track, index) => {
    const node = trackTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.trackId = track.id;
    const infoName = node.querySelector('.track-name');
    const infoTags = node.querySelector('.track-tags');
    const arm = node.querySelector('.track-arm');
    const lane = node.querySelector('.clip-lane');
    const waveform = node.querySelector('.waveform');

    infoName.textContent = track.name;
    infoTags.textContent = `${track.role} • ${track.aiMode}`;
    if (track.armed) {
      arm.classList.add('active');
    }

    arm.addEventListener('click', event => {
      event.stopPropagation();
      track.armed = !track.armed;
      arm.classList.toggle('active', track.armed);
      appendConsole('sistema', `${track.name} ${track.armed ? 'armada para grabación' : 'desarmada'}.`);
    });

    renderWaveform(track, waveform);

    track.clips.forEach(clip => {
      const clipEl = document.createElement('div');
      clipEl.className = 'clip';
      clipEl.dataset.ai = clip.ai;
      clipEl.style.setProperty('--start', clip.start);
      clipEl.style.setProperty('--length', clip.length);
      clipEl.style.background = `linear-gradient(160deg, ${track.color.base}, ${track.color.glow})`;
      clipEl.innerHTML = `
        <span class="clip-name">${clip.name}</span>
        <span class="clip-details">${clip.length} compases • ${clip.detail}</span>
      `;
      clipEl.addEventListener('click', event => {
        event.stopPropagation();
        state.selectedClip = { ...clip, trackId: track.id };
        selectTrack(track.id);
        updateInspector(track, clip);
      });
      lane.appendChild(clipEl);
    });

    node.addEventListener('click', () => {
      state.selectedClip = null;
      selectTrack(track.id);
      updateInspector(track);
    });

    if (track.id === state.selectedTrackId || (!state.selectedTrackId && index === 0)) {
      state.selectedTrackId = track.id;
      node.classList.add('selected');
    }

    tracksContainer.appendChild(node);
  });

  const selectedTrack = getSelectedTrack();
  let selectedClip = null;
  if (state.selectedClip) {
    const clipTrack = state.tracks.find(track => track.id === state.selectedClip.trackId);
    selectedClip = clipTrack?.clips.find(clip => clip.id === state.selectedClip.id) || null;
  }
  if (selectedTrack) {
    updateInspector(selectedTrack, selectedClip || undefined);
  }
}

function renderWaveform(track, container) {
  if (!container) return;
  container.innerHTML = '';
  if (!track.waveform || !track.waveform.length) {
    track.waveform = generateWaveform(72, 0.6);
  }
  track.waveform.slice(0, 80).forEach(value => {
    const bar = document.createElement('span');
    bar.className = 'waveform-bar';
    const height = Math.max(8, Math.round(value * 100));
    bar.style.height = `${height}%`;
    bar.style.background = `linear-gradient(180deg, ${track.color.base}, ${track.color.glow})`;
    bar.style.opacity = (0.55 + value * 0.45).toFixed(2);
    container.appendChild(bar);
  });
}

function syncStemsWithTracks() {
  state.tracks.forEach(track => {
    const existing = state.stems.find(stem => stem.id === track.id);
    if (!existing) {
      state.stems.push({
        id: track.id,
        name: track.name,
        role: track.role,
        status: 'Pendiente',
        separated: false,
        level: 0,
        pan: 0
      });
    } else {
      existing.name = track.name;
      existing.role = track.role;
    }
  });
  state.stems = state.stems.filter(stem => state.tracks.some(track => track.id === stem.id));
}

function renderStems() {
  if (!stemsList) return;
  syncStemsWithTracks();
  stemsList.innerHTML = '';
  if (!state.stems.length) {
    stemsList.innerHTML = '<p class="module-hint">Añade pistas para preparar stems.</p>';
    return;
  }
  state.stems.forEach(stem => {
    const card = document.createElement('div');
    card.className = 'stem-card';
    if (stem.id === state.selectedTrackId) {
      card.classList.add('active');
    }
    const statusClass = stem.separated ? 'stem-status ready' : 'stem-status';
    card.innerHTML = `
      <div>
        <strong>${stem.name}</strong>
        <span>${stem.role}</span>
      </div>
      <span class="${statusClass}">${stem.status}</span>
    `;
    card.addEventListener('click', () => {
      selectTrack(stem.id);
      const track = state.tracks.find(t => t.id === stem.id);
      if (track) {
        updateInspector(track);
        appendConsole('sistema', `Foco en stem ${track.name}.`);
      }
    });
    stemsList.appendChild(card);
  });
}

function renderStemMixers() {
  if (!stemMixers) return;
  syncStemsWithTracks();
  stemMixers.innerHTML = '';
  state.stems.forEach(stem => {
    const row = document.createElement('div');
    row.className = 'stem-mixer';
    const label = document.createElement('div');
    label.className = 'stem-label';
    label.innerHTML = `<strong>${stem.name}</strong><span>${stem.role}</span>`;

    const controls = document.createElement('div');
    controls.className = 'stem-controls';

    const volumeWrap = document.createElement('label');
    volumeWrap.textContent = 'Volumen';
    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.min = -24;
    volumeSlider.max = 6;
    volumeSlider.value = stem.level ?? 0;
    volumeSlider.disabled = !stem.separated;
    volumeWrap.appendChild(volumeSlider);
    const volumeValue = document.createElement('span');
    volumeValue.className = 'stem-value';
    volumeValue.textContent = stem.separated ? formatDb(stem.level ?? 0) : 'Pendiente';

    const panWrap = document.createElement('label');
    panWrap.textContent = 'Paneo';
    const panSlider = document.createElement('input');
    panSlider.type = 'range';
    panSlider.min = -100;
    panSlider.max = 100;
    panSlider.value = stem.pan ?? 0;
    panSlider.disabled = !stem.separated;
    panWrap.appendChild(panSlider);
    const panValue = document.createElement('span');
    panValue.className = 'stem-value';
    panValue.textContent = stem.separated ? formatPan(stem.pan ?? 0) : 'Pendiente';

    controls.append(volumeWrap, volumeValue, panWrap, panValue);
    row.append(label, controls);
    stemMixers.appendChild(row);

    volumeSlider.addEventListener('input', () => {
      stem.level = Number(volumeSlider.value);
      volumeValue.textContent = formatDb(stem.level);
    });
    volumeSlider.addEventListener('change', () => {
      appendConsole('sistema', `Volumen de ${stem.name} ajustado a ${formatDb(stem.level)}.`);
    });

    panSlider.addEventListener('input', () => {
      stem.pan = Number(panSlider.value);
      panValue.textContent = formatPan(stem.pan);
    });
    panSlider.addEventListener('change', () => {
      appendConsole('sistema', `Paneo de ${stem.name} movido a ${formatPan(stem.pan)}.`);
    });
  });
}

function handleStemSeparation() {
  if (state.stemProcessing === 'processing') return;
  state.stemProcessing = 'processing';
  state.stems.forEach(stem => {
    stem.status = 'Analizando...';
    stem.separated = false;
  });
  renderStems();
  triggerAction('Iniciando separación de stems con red neuronal multibanda.');
  setTimeout(() => {
    state.stems.forEach(stem => {
      stem.status = 'Listo';
      stem.separated = true;
    });
    state.stemProcessing = 'ready';
    renderStems();
    renderStemMixers();
    triggerAction('Stems listos para mezcla individual y procesos focales.');
  }, 1600);
}

function formatDb(value = 0) {
  const numeric = Math.round((Number(value) || 0) * 10) / 10;
  return `${numeric > 0 ? '+' : ''}${numeric} dB`;
}

function formatPan(value = 0) {
  const numeric = Math.round(Number(value) || 0);
  if (numeric === 0) return 'Centro';
  return numeric > 0 ? `${numeric} R` : `${Math.abs(numeric)} L`;
}

function updateMasterMixLabel() {
  if (!masterMixSlider || !masterMixValue) return;
  state.masterMix = Math.round((Number(masterMixSlider.value) || 0) * 10) / 10;
  masterMixValue.textContent = formatDb(state.masterMix);
}

function updateVocalBadges() {
  if (pitchStrengthInput && pitchStrengthValue) {
    state.vocalSettings.pitchStrength = Number(pitchStrengthInput.value);
    pitchStrengthValue.textContent = `${state.vocalSettings.pitchStrength}%`;
  }
  if (formantShiftInput && formantShiftValue) {
    state.vocalSettings.formantShift = Number(formantShiftInput.value);
    const value = state.vocalSettings.formantShift;
    formantShiftValue.textContent = `${value > 0 ? '+' : ''}${value} st`;
  }
  if (vibratoDepthInput && vibratoDepthValue) {
    state.vocalSettings.vibratoDepth = Number(vibratoDepthInput.value);
    vibratoDepthValue.textContent = `${state.vocalSettings.vibratoDepth}%`;
  }
  if (deEssInput && deEssValue) {
    state.vocalSettings.deEss = Number(deEssInput.value);
    deEssValue.textContent = `${state.vocalSettings.deEss}%`;
  }
}

function applyVocalProcessing(event) {
  event.preventDefault();
  updateVocalBadges();
  state.vocalSettings.doubleMode = !!doubleModeToggle?.checked;
  state.vocalSettings.tuneBackgrounds = !!tuneBackgroundsToggle?.checked;
  const focus = getSelectedTrack();
  const focusLabel = focus ? focus.name : 'la mezcla';
  triggerAction(`Corrección vocal aplicada a ${focusLabel}: afinación ${state.vocalSettings.pitchStrength}% y formantes ${state.vocalSettings.formantShift} st.`);
  if (state.vocalSettings.doubleMode) {
    appendConsole('sistema', 'Dobles armónicos alineados para reforzar presencia.');
  }
  if (state.vocalSettings.tuneBackgrounds) {
    appendConsole('sistema', 'Coros sincronizados con el lead para mayor cohesión.');
  }
}

function handleNoiseProfileChange() {
  state.noiseSettings.profile = noiseProfileSelect?.value || 'estudio';
  updateNoiseProfileStatus();
}

function getNoiseProfileLabel(profile) {
  switch (profile) {
    case 'directo':
      return 'Show en vivo';
    case 'vinilo':
      return 'Vinilo vintage';
    case 'field':
      return 'Field recording';
    default:
      return 'Estudio';
  }
}

function updateNoiseProfileStatus() {
  if (!noiseStatus) return;
  noiseStatus.textContent = `Perfil “${getNoiseProfileLabel(state.noiseSettings.profile)}”`;
}

function updateNoiseAmountLabel() {
  if (!noiseAmountSlider || !noiseAmountValue) return;
  state.noiseSettings.amount = Number(noiseAmountSlider.value);
  noiseAmountValue.textContent = `${state.noiseSettings.amount}%`;
}

function learnNoiseProfile(event) {
  event?.preventDefault();
  if (!noiseStatus) return;
  noiseStatus.textContent = 'Aprendiendo...';
  triggerAction('Analizando pasaje en silencio para capturar perfil de ruido.');
  setTimeout(() => {
    updateNoiseProfileStatus();
    triggerAction('Perfil de ruido calibrado. Listo para limpiar la toma.');
  }, 1300);
}

function applyNoiseReduction(event) {
  event?.preventDefault();
  triggerAction(`Reducción de ruido aplicada al ${state.noiseSettings.amount}% con perfil ${getNoiseProfileLabel(state.noiseSettings.profile)}.`);
}

function handleIdeaGeneration(event) {
  event.preventDefault();
  const reference = ideaReferenceSelect?.value || 'ninguna';
  const goal = ideaGoalInput?.value.trim();
  if (!goal) return;
  const referenceLabel = reference !== 'ninguna' ? ` (${reference})` : '';
  appendConsole('usuario', `Idea IA: ${goal}${referenceLabel}`);
  const summary = buildIdeaSummary(reference, goal);
  state.ideaHistory.unshift({
    id: uuid(),
    reference,
    goal,
    summary
  });
  if (state.ideaHistory.length > 5) {
    state.ideaHistory.pop();
  }
  renderIdeaSuggestions();
  ideaGoalInput.value = '';
  triggerAction(summary);
}

function renderIdeaSuggestions() {
  if (!ideaSuggestions) return;
  ideaSuggestions.innerHTML = '';
  if (!state.ideaHistory.length) {
    ideaSuggestions.innerHTML = '<p class="module-hint">Genera ideas para ver sugerencias aquí.</p>';
    return;
  }
  state.ideaHistory.forEach(idea => {
    const card = document.createElement('div');
    card.className = 'idea-card';
    const title = document.createElement('strong');
    title.textContent = idea.goal;
    const referenceLine = document.createElement('span');
    referenceLine.textContent = idea.reference === 'ninguna' ? 'Sin referencia' : `Referencia: ${idea.reference}`;
    const body = document.createElement('p');
    body.textContent = idea.summary;
    card.append(title, referenceLine, body);
    ideaSuggestions.appendChild(card);
  });
}

function buildIdeaSummary(reference, goal) {
  const trimmedGoal = goal.trim();
  if (!trimmedGoal) return 'Generando nueva sección IA.';
  const capitalized = trimmedGoal.charAt(0).toUpperCase() + trimmedGoal.slice(1);
  const sentence = capitalized.endsWith('.') ? capitalized : `${capitalized}.`;
  const inspiration = reference !== 'ninguna' ? `inspiradas en ${reference}` : 'originales generadas por IA';
  return `${sentence} La IA propondrá capas ${inspiration} y transiciones que conecten con tus stems actuales.`;
}


function renderVersions() {
  if (!versionList) return;
  versionList.innerHTML = '';
  state.versions.forEach(version => {
    const li = document.createElement('li');
    li.className = 'version';
    li.innerHTML = `<strong>${version.name}</strong><span class="meta">${version.note}</span><span class="meta">${version.timestamp}</span>`;
    li.addEventListener('click', () => {
      appendConsole('sistema', `Recuperando ${version.name}.`);
    });
    versionList.appendChild(li);
  });
}

function seedConsole() {
  if (!aiLog) return;
  const welcome = [
    { role: 'sistema', message: 'Listo para ayudarte a producir. Puedes pedirme variaciones, masters o letras.' },
    { role: 'sistema', message: 'He analizado tu mezcla: energía media, voces suaves, dinámica estable.' }
  ];
  welcome.forEach(entry => appendConsole(entry.role, entry.message));
}

function attachEvents() {
  document.querySelectorAll('.macro').forEach(button => {
    button.addEventListener('click', () => handleMacro(button.dataset.macro, button.textContent));
  });

  document.querySelector('#refresh-library')?.addEventListener('click', shuffleLibrary);
  document.querySelector('#new-project')?.addEventListener('click', startNewProject);
  document.querySelector('#render-preview')?.addEventListener('click', () => triggerAction('Renderizando preview estéreo...'));
  document.querySelector('#publish-project')?.addEventListener('click', publishProject);
  document.querySelector('#toggle-grid')?.addEventListener('click', toggleGrid);
  document.querySelector('#export-stems')?.addEventListener('click', () => triggerAction('Exportando stems con normalización LUFS -14.'));

  aiForm?.addEventListener('submit', event => {
    event.preventDefault();
    const prompt = aiPrompt.value.trim();
    if (!prompt) return;
    appendConsole('usuario', prompt);
    aiPrompt.value = '';
    simulateAssistantResponse(prompt);
  });

  generatorForm?.addEventListener('submit', handleGenerationRequest);
  document.querySelector('#new-version')?.addEventListener('click', saveVersionSnapshot);

  tempoSlider?.addEventListener('input', updateTempoLabel);
  humanizeSlider?.addEventListener('input', updateHumanizeLabel);

  masterMixSlider?.addEventListener('input', updateMasterMixLabel);
  masterMixSlider?.addEventListener('change', () => {
    updateMasterMixLabel();
    triggerAction(`Balance maestro ajustado a ${formatDb(state.masterMix)}.`);
  });

  const vocalInputs = [pitchStrengthInput, formantShiftInput, vibratoDepthInput, deEssInput];
  vocalInputs.forEach(input => {
    input?.addEventListener('input', updateVocalBadges);
  });

  vocalForm?.addEventListener('submit', applyVocalProcessing);
  doubleModeToggle?.addEventListener('change', () => {
    state.vocalSettings.doubleMode = !!doubleModeToggle.checked;
  });
  tuneBackgroundsToggle?.addEventListener('change', () => {
    state.vocalSettings.tuneBackgrounds = !!tuneBackgroundsToggle.checked;
  });

  separateStemsButton?.addEventListener('click', handleStemSeparation);

  noiseProfileSelect?.addEventListener('change', handleNoiseProfileChange);
  noiseAmountSlider?.addEventListener('input', updateNoiseAmountLabel);
  noiseAmountSlider?.addEventListener('change', () => {
    updateNoiseAmountLabel();
    triggerAction(`Reducción configurada al ${state.noiseSettings.amount}%.`);
  });
  learnNoiseButton?.addEventListener('click', learnNoiseProfile);
  applyNoiseButton?.addEventListener('click', applyNoiseReduction);

  ideasForm?.addEventListener('submit', handleIdeaGeneration);

  playButton?.addEventListener('click', togglePlay);
  rewindButton?.addEventListener('click', () => {
    state.playheadSeconds = 0;
    state.playheadBar = 1;
    updateTransportDisplay();
  });

  recordButton?.addEventListener('click', () => {
    recordButton.classList.toggle('active');
    appendConsole('sistema', recordButton.classList.contains('active') ? 'Grabación armada. Preparando buffers.' : 'Grabación detenida.');
  });
}

function handleMacro(key, label) {
  const selectedTrack = getSelectedTrack();
  appendConsole('usuario', `${label}${selectedTrack ? ` en ${selectedTrack.name}` : ''}`.trim());
  const response = selectedTrack
    ? `${label} aplicado a ${selectedTrack.name} con ajustes personalizados.`
    : `${label} listo. Selecciona una pista para ajuste fino.`;
  triggerAction(response);
}

function shuffleLibrary() {
  state.library.sort(() => Math.random() - 0.5);
  renderLibrary();
  appendConsole('sistema', 'Biblioteca actualizada con recomendaciones nuevas.');
}

function startNewProject() {
  state.playheadSeconds = 0;
  state.playheadBar = 1;
  state.versions.push({
    id: uuid(),
    name: `v${state.versions.length + 1} - Nuevo lienzo`,
    note: 'Proyecto reiniciado. Referencias limpias.',
    timestamp: 'Ahora'
  });
  renderVersions();
  state.stemProcessing = 'idle';
  state.stems.forEach(stem => {
    stem.status = 'Pendiente';
    stem.separated = false;
    stem.level = 0;
    stem.pan = 0;
  });
  renderStems();
  renderStemMixers();
  triggerAction('Nuevo proyecto creado. Configurando escenas y plantillas IA.');
}

function triggerAction(message) {
  appendConsole('sistema', message);
}

function publishProject() {
  triggerAction('Publicación en curso. Generando masters en estéreo y Atmos.');
  saveVersionSnapshot();
}

function toggleGrid() {
  tracksContainer?.classList.toggle('grid-hidden');
  appendConsole('sistema', tracksContainer?.classList.contains('grid-hidden')
    ? 'Cuadrícula oculta. Vista libre activa.'
    : 'Cuadrícula visible para edición precisa.');
}

function handleGenerationRequest(event) {
  event.preventDefault();
  const type = document.querySelector('#generator-type').value;
  const mood = document.querySelector('#generator-mood').value.trim();
  const length = Number(document.querySelector('#generator-length').value) || 16;
  if (!mood) return;

  generatorStatus.textContent = 'Generando...';
  triggerAction(`Analizando mezcla para añadir ${type} (${mood}).`);

  setTimeout(() => {
    generatorStatus.textContent = 'Listo';
    const color = colors[state.tracks.length % colors.length];
    const newTrack = {
      id: uuid(),
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} IA`,
      role: type,
      aiMode: 'Adaptive Composer',
      color,
      gain: -6,
      pan: 0,
      macros: ['Auto EQ', 'Variación IA'],
      waveform: generateWaveform(72, 0.6),
      clips: [
        {
          id: uuid(),
          name: `${mood}`,
          ai: 'Generado a medida',
          start: 1,
          length,
          detail: `${length} compases refinados`
        }
      ]
    };
    state.tracks.push(newTrack);
    renderTracks();
    renderStems();
    renderStemMixers();
    selectTrack(newTrack.id);
    updateInspector(newTrack);
    triggerAction(`Pista "${newTrack.name}" lista. Ajustada al mood ${mood}.`);
    if (state.stemProcessing === 'ready') {
      appendConsole('sistema', 'Nueva pista detectada. Ejecuta separación de stems para aislarla.');
    }
  }, 1600);
}

function renderVersionsAfterSave(version) {
  state.versions.unshift(version);
  if (state.versions.length > 6) {
    state.versions.pop();
  }
  renderVersions();
}

function saveVersionSnapshot() {
  const now = new Date();
  const version = {
    id: uuid(),
    name: `v${state.versions.length + 1} - Snapshot`,
    note: `Captura con ${state.tracks.length} pistas y ${state.measures} compases`,
    timestamp: now.toLocaleTimeString()
  };
  renderVersionsAfterSave(version);
  triggerAction(`${version.name} almacenada.`);
}

function selectTrack(trackId) {
  state.selectedTrackId = trackId;
  document.querySelectorAll('.track-row').forEach(row => {
    row.classList.toggle('selected', row.dataset.trackId === trackId);
  });
  renderStems();
}

function updateInspector(track, clip) {
  if (!inspectorBody) return;
  const lines = [];
  lines.push(`<div class="inspector-field"><strong>Pista</strong><span>${track.name}</span></div>`);
  lines.push(`<div class="inspector-field"><strong>Rol</strong><span>${track.role}</span></div>`);
  lines.push(`<div class="inspector-field"><strong>Modo IA</strong><span>${track.aiMode}</span></div>`);
  lines.push(`<div class="inspector-field"><strong>Ganancia</strong><span>${track.gain} dB</span></div>`);
  lines.push(`<div class="inspector-field"><strong>Paneo</strong><span>${track.pan}°</span></div>`);
  lines.push(`<div class="inspector-field"><strong>Macros</strong><span>${track.macros.join(', ')}</span></div>`);
  if (clip) {
    lines.push(`<div class="inspector-field"><strong>Clip</strong><span>${clip.name}</span></div>`);
    lines.push(`<div class="inspector-field"><strong>IA Clip</strong><span>${clip.ai}</span></div>`);
    lines.push(`<div class="inspector-field"><strong>Duración</strong><span>${clip.length} compases</span></div>`);
    lines.push(`<div class="inspector-field"><strong>Detalle</strong><span>${clip.detail}</span></div>`);
  }
  inspectorBody.innerHTML = lines.join('');
}

function getSelectedTrack() {
  return state.tracks.find(track => track.id === state.selectedTrackId) || state.tracks[0];
}

function appendConsole(role, message) {
  if (!aiLog) return;
  const entry = document.createElement('div');
  entry.className = 'console-entry';
  const label = document.createElement('span');
  label.className = 'role';
  label.textContent = role === 'usuario' ? 'Usuario' : 'IA Rockin';
  const content = document.createElement('p');
  content.className = 'message';
  content.textContent = message;
  entry.append(label, content);
  aiLog.appendChild(entry);
  aiLog.scrollTop = aiLog.scrollHeight;
}

function simulateAssistantResponse(prompt) {
  const selected = getSelectedTrack();
  const responses = [
    `Analizando ${selected.name} para responder a "${prompt}"...`,
    `He creado una variación que refuerza ${selected.role.toLowerCase()} manteniendo ${prompt.toLowerCase()}.`,
    'Puedes preescuchar en la vista de arreglos y ajustar parámetros en el inspector.'
  ];
  let delay = 400;
  responses.forEach(text => {
    setTimeout(() => appendConsole('sistema', text), delay);
    delay += 500;
  });
}

function updateTempoLabel() {
  const tempo = Number(tempoSlider.value);
  tempoValue.textContent = tempo;
  triggerMeter();
}

function updateHumanizeLabel() {
  const value = Number(humanizeSlider.value);
  humanizeValue.textContent = `${value}%`;
}

function togglePlay() {
  state.playing = !state.playing;
  playButton.textContent = state.playing ? '⏸' : '▶';
  if (state.playing) {
    startTransport();
    appendConsole('sistema', 'Reproducción iniciada. Renderizando vista previa IA.');
  } else {
    stopTransport();
    appendConsole('sistema', 'Reproducción detenida.');
  }
}

function startTransport() {
  stopTransport();
  state.timer = setInterval(() => {
    state.playheadSeconds += 0.5;
    const tempo = Number(tempoSlider.value);
    const secondsPerBar = (60 / tempo) * 4;
    state.playheadBar = Math.min(state.measures, Math.floor(state.playheadSeconds / secondsPerBar) + 1);
    updateTransportDisplay();
    triggerMeter();
    if (state.playheadBar >= state.measures) {
      togglePlay();
    }
  }, 500);
}

function stopTransport() {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
}

function updateTransportDisplay() {
  const minutes = Math.floor(state.playheadSeconds / 60).toString().padStart(2, '0');
  const seconds = Math.floor(state.playheadSeconds % 60).toString().padStart(2, '0');
  const frames = Math.floor((state.playheadSeconds % 1) * 24).toString().padStart(2, '0');
  transportDisplay.textContent = `${minutes}:${seconds}:${frames}`;
  playheadTime.textContent = `Barra ${state.playheadBar} • Tiempo ${minutes}:${seconds}`;
}

function triggerMeter() {
  if (!masterMeter) return;
  const base = state.playing ? 60 : 35;
  const random = Math.floor(Math.random() * 30);
  masterMeter.style.width = `${base + random}%`;
}

init();
