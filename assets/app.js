const uuid = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(16).slice(2));

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
      clips: [
        { id: uuid(), name: "Pad continuo", ai: "Capa etérea", start: 1, length: 16, detail: "Auto evolución" }
      ]
    }
  ],
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
  ]
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

function init() {
  renderRuler();
  renderLibrary();
  renderTracks();
  renderVersions();
  seedConsole();
  attachEvents();
  updateTempoLabel();
  updateHumanizeLabel();
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
  tracksContainer.innerHTML = '';
  state.tracks.forEach((track, index) => {
    const node = trackTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.trackId = track.id;
    const infoName = node.querySelector('.track-name');
    const infoTags = node.querySelector('.track-tags');
    const arm = node.querySelector('.track-arm');
    const lane = node.querySelector('.clip-lane');

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
    selectTrack(newTrack.id);
    updateInspector(newTrack);
    triggerAction(`Pista "${newTrack.name}" lista. Ajustada al mood ${mood}.`);
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
