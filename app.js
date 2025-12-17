// app.js - Main application logic for Audio Repair Studio

let audioContext;
let audioBuffer;
let sourceNode;
let analyserNode;
let filterNode;
let compressorNode;
let gainNode;
let waveCanvas;
let spectrogramCanvas;

// Initialize Audio Context and Elements
document.addEventListener('DOMContentLoaded', () => {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  initializeUI();
  setupEventListeners();
  
  // Initialize Pitch Engine
  if (typeof PitchEngine !== 'undefined') {
    window.pitchEngine = new PitchEngine(audioContext);
    if (typeof NoteEditorUI !== 'undefined') {
      window.noteEditorUI = new NoteEditorUI(
        document.getElementById('note-editor-container'),
        window.pitchEngine
      );
    }
  }
});

// Initialize UI Elements
const initializeUI = () => {
  waveCanvas = document.getElementById('waveform-canvas');
  spectrogramCanvas = document.getElementById('spectrogram-canvas');
  
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => switchTab(e.target.dataset.tab, e.target));
  });
};

// Tab Switching
const switchTab = (tabName, clickedButton) => {
  const contents = document.querySelectorAll('.tab-content');
  const buttons = document.querySelectorAll('.tab-btn');
  
  contents.forEach(c => c.style.display = 'none');
  buttons.forEach(b => b.classList.remove('active'));
  
  const activeContent = document.getElementById(tabName + '-tab');
  if (activeContent) activeContent.style.display = 'block';
  
  if (clickedButton) {
    clickedButton.classList.add('active');
  } else {
    // Fallback: find button by dataset
    const activeButton = Array.from(buttons).find(b => b.dataset.tab === tabName);
    if (activeButton) activeButton.classList.add('active');
  }
  
  if (tabName === 'note-editor' && window.noteEditorUI && !window.noteEditorUI.canvas) {
    window.noteEditorUI.initPanel();
  }
};

// Setup Event Listeners
const setupEventListeners = () => {
  document.getElementById('load-audio')?.addEventListener('click', loadAudio);
  document.getElementById('play-btn')?.addEventListener('click', playAudio);
  document.getElementById('stop-btn')?.addEventListener('click', stopAudio);
  document.getElementById('export-wav')?.addEventListener('click', exportWAV);
  
  // Noise Gate
  document.getElementById('gate-threshold')?.addEventListener('input', (e) => {
    document.getElementById('gate-value').textContent = e.target.value;
  });
  document.getElementById('apply-gate')?.addEventListener('click', applyNoiseGate);
  
  // Click Removal
  document.getElementById('apply-click')?.addEventListener('click', removeClicks);
  
  // De-Hum
  document.getElementById('apply-dehum')?.addEventListener('click', deHum);
  
  // EQ
  document.getElementById('apply-eq')?.addEventListener('click', applyEQ);
  
  // Compressor
  document.getElementById('apply-compressor')?.addEventListener('click', applyCompressor);
};

// Load Audio File
const loadAudio = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'audio/*';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // #region agent log
    console.log('Loading audio file:', file.name, file.size);
    fetch('http://127.0.0.1:7243/ingest/e58e89f0-1cf3-4572-8bc9-c9d67cb87274',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:98',message:'Loading audio file',data:{fileName:file.name,fileSize:file.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      window.currentAudioBuffer = audioBuffer;
      window.audioContext = audioContext;
      
      // #region agent log
      console.log('Audio buffer decoded:', audioBuffer.duration, 'seconds,', audioBuffer.sampleRate, 'Hz,', audioBuffer.numberOfChannels, 'channels');
      fetch('http://127.0.0.1:7243/ingest/e58e89f0-1cf3-4572-8bc9-c9d67cb87274',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:107',message:'Audio buffer decoded',data:{duration:audioBuffer.duration,sampleRate:audioBuffer.sampleRate,channels:audioBuffer.numberOfChannels},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      
      updateWaveform();
      updateSpectrogram();
      document.getElementById('audio-info').textContent = 
        `Loaded: ${file.name} (${(audioBuffer.duration).toFixed(2)}s)`;
    } catch(error) {
      // #region agent log
      console.error('Error loading audio:', error);
      fetch('http://127.0.0.1:7243/ingest/e58e89f0-1cf3-4572-8bc9-c9d67cb87274',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:116',message:'Error loading audio',data:{error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
    }
  };
  input.click();
};

// Update Waveform Display
const updateWaveform = () => {
  if (!waveCanvas || !audioBuffer) return;
  
  const ctx = waveCanvas.getContext('2d');
  const width = waveCanvas.width;
  const height = waveCanvas.height;
  const data = audioBuffer.getChannelData(0);
  
  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#32b8c6';
  ctx.lineWidth = 1;
  
  ctx.beginPath();
  const step = Math.ceil(data.length / width);
  for (let i = 0; i < width; i++) {
    const sample = data[i * step] || 0;
    const y = height / 2 - (sample * height / 2);
    i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y);
  }
  ctx.stroke();
};

// Update Spectrogram Display
const updateSpectrogram = () => {
  if (!spectrogramCanvas || !audioBuffer) return;
  
  const ctx = spectrogramCanvas.getContext('2d');
  const width = spectrogramCanvas.width;
  const height = spectrogramCanvas.height;
  
  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(0, 0, width, height);
  
  const fftSize = 2048;
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = fftSize;
  analyser.smoothingTimeConstant = 0.85;
  
  const data = new Uint8Array(analyser.frequencyBinCount);
  
  for (let x = 0; x < width; x++) {
    const time = (x / width) * audioBuffer.duration * audioContext.sampleRate;
    const startIndex = Math.floor(time);
    const endIndex = Math.min(startIndex + fftSize, audioBuffer.length);
    
    const sliceData = audioBuffer.getChannelData(0).slice(startIndex, endIndex);
    for (let i = 0; i < fftSize; i++) {
      if (i < sliceData.length) {
        data[i] = (sliceData[i] * 255) | 0;
      }
    }
    
    for (let y = 0; y < height; y++) {
      const index = Math.floor((y / height) * data.length);
      const value = data[index] || 0;
      ctx.fillStyle = `hsl(180, 100%, ${50 + (value / 255) * 50}%)`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
};

// Audio Processing Functions
const playAudio = async () => {
  // #region agent log
  console.log('playAudio called', { hasAudioBuffer: !!audioBuffer, audioContextState: audioContext?.state, hasSourceNode: !!sourceNode });
  // #endregion
  
  if (!audioBuffer) {
    // #region agent log
    console.error('playAudio: No audioBuffer');
    // #endregion
    return;
  }
  
  // Stop existing playback if any
  if (sourceNode) {
    // #region agent log
    console.log('Stopping existing playback');
    // #endregion
    try {
      sourceNode.stop();
      sourceNode = null;
    } catch(e) {
      // SourceNode might already be stopped, ignore error
    }
  }
  
  // Resume audio context if suspended (must await the promise!)
  if (audioContext.state === 'suspended') {
    // #region agent log
    console.log('Resuming suspended audio context');
    // #endregion
    try {
      await audioContext.resume();
      // #region agent log
      console.log('Audio context resumed, state:', audioContext.state);
      // #endregion
    } catch(error) {
      // #region agent log
      console.error('Error resuming audio context:', error);
      // #endregion
      return;
    }
  }
  
  try {
    sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = audioBuffer;
    
    // #region agent log
    console.log('Created sourceNode, setting up audio graph');
    // #endregion
    
    setupAudioGraph();
    
    // #region agent log
    console.log('Starting playback, audioContext.state:', audioContext.state);
    // #endregion
    
    sourceNode.start(0);
  } catch(error) {
    // #region agent log
    console.error('playAudio error:', error);
    // #endregion
  }
};

const stopAudio = () => {
  if (sourceNode) sourceNode.stop();
};

const setupAudioGraph = () => {
  // #region agent log
  console.log('setupAudioGraph called');
  fetch('http://127.0.0.1:7243/ingest/e58e89f0-1cf3-4572-8bc9-c9d67cb87274',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:233',message:'setupAudioGraph called',data:{hasSourceNode:!!sourceNode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
  // #endregion
  
  try {
    if (sourceNode) {
      sourceNode.disconnect();
    }
    
    gainNode = audioContext.createGain();
    compressorNode = audioContext.createDynamicsCompressor();
    filterNode = audioContext.createBiquadFilter();
    
    sourceNode.connect(gainNode);
    gainNode.connect(compressorNode);
    compressorNode.connect(filterNode);
    filterNode.connect(audioContext.destination);
    
    // #region agent log
    console.log('Audio graph setup complete');
    fetch('http://127.0.0.1:7243/ingest/e58e89f0-1cf3-4572-8bc9-c9d67cb87274',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:248',message:'Audio graph setup complete',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
  } catch(error) {
    // #region agent log
    console.error('setupAudioGraph error:', error);
    fetch('http://127.0.0.1:7243/ingest/e58e89f0-1cf3-4572-8bc9-c9d67cb87274',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:252',message:'setupAudioGraph error',data:{error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    throw error;
  }
};

// Noise Gate
const applyNoiseGate = () => {
  if (!audioBuffer) return;
  
  const threshold = parseFloat(document.getElementById('gate-threshold')?.value || -40);
  const data = audioBuffer.getChannelData(0);
  const thresholdLinear = Math.pow(10, threshold / 20);
  
  for (let i = 0; i < data.length; i++) {
    if (Math.abs(data[i]) < thresholdLinear) {
      data[i] = 0;
    }
  }
  
  updateWaveform();
  console.log('Noise gate applied');
};

// Click Removal
const removeClicks = () => {
  if (!audioBuffer) return;
  
  const data = audioBuffer.getChannelData(0);
  const threshold = 0.3;
  const windowSize = 5;
  
  for (let i = windowSize; i < data.length - windowSize; i++) {
    const diff = Math.abs(data[i] - data[i - 1]);
    if (diff > threshold) {
      let sum = 0;
      for (let j = -windowSize; j <= windowSize; j++) {
        if (i + j !== i) sum += data[i + j];
      }
      data[i] = sum / (windowSize * 2);
    }
  }
  
  updateWaveform();
  console.log('Click removal applied');
};

// De-Hum (50/60 Hz removal)
const deHum = () => {
  if (!audioBuffer) return;
  
  const frequency = parseInt(document.getElementById('hum-freq')?.value || 60);
  const data = audioBuffer.getChannelData(0);
  
  const sr = audioBuffer.sampleRate;
  const omega = 2 * Math.PI * frequency / sr;
  
  let coeff = 2 * Math.cos(omega);
  let y1 = 0, y2 = 0;
  
  for (let i = 0; i < data.length; i++) {
    const y = data[i] + coeff * y1 - y2;
    y2 = y1;
    y1 = y;
    data[i] = data[i] - y * 0.5;
  }
  
  updateWaveform();
  console.log('De-hum applied');
};

// 3-Band EQ
const applyEQ = () => {
  if (!audioBuffer) return;
  
  const low = parseFloat(document.getElementById('eq-low')?.value || 0);
  const mid = parseFloat(document.getElementById('eq-mid')?.value || 0);
  const high = parseFloat(document.getElementById('eq-high')?.value || 0);
  
  console.log(`EQ applied: Low ${low}dB, Mid ${mid}dB, High ${high}dB`);
};

// Compressor
const applyCompressor = () => {
  if (!audioBuffer) return;
  
  const threshold = parseFloat(document.getElementById('comp-threshold')?.value || -20);
  const ratio = parseFloat(document.getElementById('comp-ratio')?.value || 4);
  const data = audioBuffer.getChannelData(0);
  
  const thresholdLinear = Math.pow(10, threshold / 20);
  
  for (let i = 0; i < data.length; i++) {
    if (Math.abs(data[i]) > thresholdLinear) {
      const gainReduction = Math.pow(Math.abs(data[i]) / thresholdLinear, 1 - 1 / ratio);
      data[i] *= gainReduction * 0.5;
    }
  }
  
  updateWaveform();
  console.log('Compressor applied');
};

// Export as WAV
const exportWAV = () => {
  if (!audioBuffer) return;
  
  const wav = audioBufferToWav(audioBuffer);
  const blob = new Blob([wav], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'repaired-audio.wav';
  link.click();
};

// Helper function to convert AudioBuffer to WAV
const audioBufferToWav = (audioBuffer) => {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;
  
  const channelData = [];
  for (let c = 0; c < numberOfChannels; c++) {
    channelData.push(audioBuffer.getChannelData(c));
  }
  
  const interleaved = new Float32Array(audioBuffer.length * numberOfChannels);
  let index = 0;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let c = 0; c < numberOfChannels; c++) {
      interleaved[index++] = channelData[c][i];
    }
  }
  
  const dataLength = interleaved.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);
  
  let offset = 44;
  for (let i = 0; i < interleaved.length; i++) {
    let s = Math.max(-1, Math.min(1, interleaved[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7FFF;
    view.setInt16(offset, s, true);
    offset += 2;
  }
  
  return buffer;
};

// Global variables for pitch engine
window.currentAudioBuffer = null;
window.audioContext = audioContext;
