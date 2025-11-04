const uploadInput = document.querySelector('#audio-upload');
const trackList = document.querySelector('#track-list');
const workspaceStatus = document.querySelector('#workspace-status');

const workflows = {
  enhance: track => mockProcess(`Enhancing ${track.name}`, 2000),
  create: idea => mockProcess(`Generating track from "${idea}"`, 2500),
  edit: track => mockProcess(`Applying edits to ${track.name}`, 1800),
  master: track => mockProcess(`Mastering ${track.name}`, 2200)
};

const uploadedTracks = [];

document.querySelectorAll('[data-action]')
  .forEach(button => button.addEventListener('click', handleAction));

if (uploadInput) {
  uploadInput.addEventListener('change', event => {
    const files = Array.from(event.target.files || []);
    files.forEach(file => {
      uploadedTracks.push({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        createdAt: new Date()
      });
    });
    renderTrackList();
    updateStatus(`${files.length} track(s) ready in your workspace`);
    uploadInput.value = '';
  });
}

function handleAction(event) {
  const action = event.currentTarget.dataset.action;
  if (action === 'create') {
    const idea = promptForIdea();
    if (!idea) return;
    updateStatus('AI composer is generating your new track...');
    workflows.create(idea).then(result => updateStatus(result));
    return;
  }

  const track = uploadedTracks[0];
  if (!track) {
    updateStatus('Upload a track to get started.');
    return;
  }

  updateStatus(`AI engine is preparing to ${action} your track...`);
  workflows[action](track).then(result => updateStatus(result));
}

function renderTrackList() {
  if (!trackList) return;
  if (!uploadedTracks.length) {
    trackList.innerHTML = '<p class="empty">No tracks uploaded yet. Drag and drop files to begin.</p>';
    return;
  }

  trackList.innerHTML = uploadedTracks.map(track => `
    <article class="track">
      <div>
        <h4>${track.name}</h4>
        <p>${(track.size / 1024 / 1024).toFixed(2)} MB · ${track.createdAt.toLocaleTimeString()}</p>
      </div>
      <button class="track-action" data-track="${track.id}">Preview</button>
    </article>
  `).join('');
}

function updateStatus(message) {
  if (workspaceStatus) {
    workspaceStatus.textContent = message;
  }
}

function promptForIdea() {
  const idea = window.prompt('Describe the track you want to create:');
  return idea && idea.trim() ? idea.trim() : null;
}

function mockProcess(message, delay) {
  return new Promise(resolve => {
    setTimeout(() => resolve(message + ' • Preview ready for review.'), delay);
  });
}

renderTrackList();
