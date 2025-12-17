// note-editor-ui.js - Professional note detection and pitch correction interface

class NoteEditorUI {
  constructor(container, pitchEngine) {
    this.container = container;
    this.engine = pitchEngine;
    this.canvas = null;
    this.noteDisplay = [];
  }

  // Initialize Note Editor UI panel
  initPanel() {
    const panel = document.createElement('div');
    panel.id = 'note-editor-panel';
    panel.className = 'note-editor-panel';
    panel.innerHTML = `
      <div class="editor-header">
        <h3>🎵 Note Detection & Pitch Correction</h3>
      </div>
      
      <div class="editor-section">
        <h4>Detection</h4>
        <div class="control-group">
          <button id="detect-notes-btn" class="primary">🔍 Detect Notes</button>
          <button id="analyze-scale-btn">📊 Analyze Scale/Key</button>
        </div>
        <div id="detection-results" style="font-size: 12px; margin-top: 10px;">
          <div>Detected Notes: <span id="note-count">0</span></div>
          <div>Scale: <span id="detected-scale">-</span></div>
          <div>Key: <span id="detected-key">-</span></div>
        </div>
      </div>

      <div class="editor-section">
        <h4>Note Visualization</h4>
        <canvas id="note-display-canvas" width="400" height="200" style="background: #1a2240; border: 1px solid #2d3548; border-radius: 4px;"></canvas>
        <div style="font-size: 11px; color: #a0a8c0; margin-top: 8px;">
          ⬆ Vertical: Pitch | ⬅ Horizontal: Time
        </div>
      </div>

      <div class="editor-section">
        <h4>Scale-Based Correction</h4>
        <div class="control-group">
          <label>Scale:
            <select id="scale-select">
              <option value="major">Major</option>
              <option value="minor">Minor</option>
              <option value="pentatonic">Pentatonic</option>
              <option value="blues">Blues</option>
              <option value="dorian">Dorian</option>
              <option value="phrygian">Phrygian</option>
              <option value="lydian">Lydian</option>
              <option value="mixolydian">Mixolydian</option>
            </select>
          </label>
        </div>
        <div class="control-group">
          <label>Key:
            <select id="key-select">
              <option value="C">C</option>
              <option value="C#">C#</option>
              <option value="D">D</option>
              <option value="D#">D#</option>
              <option value="E">E</option>
              <option value="F">F</option>
              <option value="F#">F#</option>
              <option value="G">G</option>
              <option value="G#">G#</option>
              <option value="A">A</option>
              <option value="A#">A#</option>
              <option value="B">B</option>
            </select>
          </label>
        </div>
        <button id="correct-scale-btn" class="primary" style="width: 100%; margin-top: 10px;">Apply Scale Correction</button>
      </div>

      <div class="editor-section">
        <h4>Pitch Correction</h4>
        <div class="control-group">
          <label>Pitch Shift (semitones):
            <input type="range" id="pitch-shift" min="-12" max="12" value="0" step="0.1">
            <span id="pitch-shift-value">0</span>
          </label>
        </div>
        <button id="apply-pitch-btn" class="primary" style="width: 100%;">Apply Pitch Shift</button>
      </div>

      <div class="editor-section">
        <h4>Vibrato Control</h4>
        <div class="control-header">
          <input type="checkbox" id="vibrato-toggle">
          <label for="vibrato-toggle">Enable Vibrato</label>
        </div>
        <div class="control-slider" style="margin-left: 28px;">
          <label style="min-width: 50px; font-size: 11px; color: #a0a8c0;">Rate (Hz)</label>
          <input type="range" id="vibrato-rate" min="3" max="10" value="5" step="0.1">
          <span class="slider-value"><span id="vibrato-rate-val">5</span> Hz</span>
        </div>
        <div class="control-slider" style="margin-left: 28px;">
          <label style="min-width: 50px; font-size: 11px; color: #a0a8c0;">Depth (%)</label>
          <input type="range" id="vibrato-depth" min="0" max="100" value="50" step="1">
          <span class="slider-value"><span id="vibrato-depth-val">50</span>%</span>
        </div>
      </div>

      <style>
        .note-editor-panel {
          background-color: #12172e;
          border: 1px solid #2d3548;
          border-radius: 8px;
          padding: 15px;
          color: #e0e6ff;
        }

        .editor-header {
          border-bottom: 1px solid #2d3548;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }

        .editor-header h3 {
          margin: 0;
          font-size: 14px;
          color: #32b8c6;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .editor-section {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #2d3548;
        }

        .editor-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .editor-section h4 {
          margin: 0 0 10px 0;
          font-size: 12px;
          font-weight: 600;
          color: #32b8c6;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .editor-section label {
          font-size: 12px;
          color: #a0a8c0;
          display: block;
          margin-bottom: 8px;
        }

        .editor-section select {
          background-color: #1a2240;
          color: #e0e6ff;
          border: 1px solid #2d3548;
          padding: 6px 8px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          margin-left: 8px;
        }

        .editor-section input[type="range"] {
          margin-left: 8px;
          max-width: 150px;
          vertical-align: middle;
          cursor: pointer;
        }

        .editor-section input[type="checkbox"] {
          cursor: pointer;
          margin-right: 8px;
        }

        .editor-section input[type="number"] {
          background-color: #1a2240;
          color: #e0e6ff;
          border: 1px solid #2d3548;
          padding: 4px 6px;
          border-radius: 4px;
          font-size: 12px;
          margin-left: 8px;
        }

        #detection-results {
          background-color: #1a2240;
          border: 1px solid #2d3548;
          border-radius: 4px;
          padding: 8px;
          line-height: 1.6;
        }

        #note-display-canvas {
          display: block;
          margin: 0 auto;
          width: 100%;
          max-width: 100%;
        }

        .control-group {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .control-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .control-header label {
          margin-bottom: 0;
          display: inline-block;
        }

        .control-slider {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 8px;
        }

        .slider-value {
          min-width: 50px;
          text-align: right;
          color: #32b8c6;
          font-weight: 600;
          font-size: 12px;
        }

        .primary {
          background-color: #32b8c6;
          color: #0a0e1a;
          border: none;
          padding: 10px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          font-size: 12px;
          transition: all 0.3s;
        }

        .primary:hover {
          background-color: #2aa3b0;
          transform: translateY(-1px);
        }

        .primary:active {
          transform: translateY(0);
        }
      </style>
    `;

    this.container.appendChild(panel);
    this.canvas = document.getElementById('note-display-canvas');
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.getElementById('detect-notes-btn')?.addEventListener('click', () => {
      this.onDetectNotes();
    });

    document.getElementById('analyze-scale-btn')?.addEventListener('click', () => {
      this.onAnalyzeScale();
    });

    document.getElementById('correct-scale-btn')?.addEventListener('click', () => {
      this.onCorrectScale();
    });

    document.getElementById('apply-pitch-btn')?.addEventListener('click', () => {
      this.onApplyPitch();
    });

    document.getElementById('pitch-shift')?.addEventListener('input', (e) => {
      document.getElementById('pitch-shift-value').textContent = 
        (Math.round(e.target.value * 10) / 10).toFixed(1);
    });

    document.getElementById('vibrato-rate')?.addEventListener('input', (e) => {
      document.getElementById('vibrato-rate-val').textContent = 
        (Math.round(e.target.value * 10) / 10).toFixed(1);
      if (this.engine) this.engine.vibrato.rate = parseFloat(e.target.value);
    });

    document.getElementById('vibrato-depth')?.addEventListener('input', (e) => {
      document.getElementById('vibrato-depth-val').textContent = e.target.value;
      if (this.engine) this.engine.vibrato.depth = parseInt(e.target.value);
    });

    document.getElementById('vibrato-toggle')?.addEventListener('change', (e) => {
      if (this.engine) this.engine.vibrato.enabled = e.target.checked;
    });
  }

  onDetectNotes() {
    if (!window.currentAudioBuffer || !this.engine) {
      alert('Please load an audio file first');
      return;
    }

    const notes = this.engine.detectNotes(
      window.currentAudioBuffer.getChannelData(0),
      window.currentAudioBuffer.sampleRate
    );
    
    document.getElementById('note-count').textContent = notes.length;
    this.drawNoteDisplay();
    console.log('Detected notes:', notes);
  }

  onAnalyzeScale() {
    if (!this.engine) return;

    if (this.engine.detectedNotes.length === 0) {
      this.onDetectNotes();
    }
    
    const scale = this.engine.detectScale();
    const key = this.engine.detectKey();
    
    document.getElementById('detected-scale').textContent = scale || 'Unknown';
    document.getElementById('detected-key').textContent = key || 'Unknown';
    
    document.getElementById('scale-select').value = scale || 'major';
    document.getElementById('key-select').value = key || 'C';
    
    console.log(`Detected scale: ${scale}, key: ${key}`);
  }

  onCorrectScale() {
    if (!window.currentAudioBuffer || !this.engine) return;

    const scale = document.getElementById('scale-select')?.value || 'major';
    const key = document.getElementById('key-select')?.value || 'C';

    const corrected = this.engine.correctToScale(
      window.currentAudioBuffer.getChannelData(0),
      window.currentAudioBuffer.sampleRate,
      scale,
      key
    );

    // Update audio buffer with corrected data
    window.currentAudioBuffer.getChannelData(0).set(corrected);
    this.drawNoteDisplay();
    console.log(`Applied ${scale} scale correction in key of ${key}`);
  }

  onApplyPitch() {
    if (!window.currentAudioBuffer || !this.engine) return;

    const semitones = parseFloat(document.getElementById('pitch-shift')?.value || 0);
    if (semitones === 0) return;

    const shifted = this.engine.applyPitchShift(
      window.currentAudioBuffer.getChannelData(0),
      semitones
    );

    window.currentAudioBuffer.getChannelData(0).set(shifted);
    this.drawNoteDisplay();
    console.log(`Applied ${semitones} semitone pitch shift`);
  }

  drawNoteDisplay() {
    if (!this.canvas || !this.engine || this.engine.detectedNotes.length === 0) return;

    const ctx = this.canvas.getContext('2d');
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear canvas
    ctx.fillStyle = '#1a2240';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#2d3548';
    ctx.lineWidth = 1;

    // Horizontal lines (octaves)
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical lines (time)
    const timeStep = 100; // ms
    const maxTime = Math.max(
      1000,
      (this.engine.detectedNotes[this.engine.detectedNotes.length - 1]?.endTime || 1000) * 1000
    );
    
    for (let t = 0; t <= maxTime; t += timeStep) {
      const x = (t / maxTime) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw notes
    const accentColor = '#32b8c6';
    
    this.engine.detectedNotes.forEach(note => {
      const startX = (note.startTime / (maxTime / 1000)) * width;
      const endX = (note.endTime / (maxTime / 1000)) * width;
      const noteWidth = Math.max(endX - startX, 3);

      // Normalize frequency to Y position (lower = lower on screen)
      const minFreq = 50;
      const maxFreq = 2000;
      const normalized = (Math.log2(note.frequency) - Math.log2(minFreq)) / 
                        (Math.log2(maxFreq) - Math.log2(minFreq));
      const y = height - (normalized * height);

      // Draw note block
      ctx.fillStyle = accentColor;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(startX, y - 15, noteWidth, 30);
      
      ctx.globalAlpha = 1;
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, y - 15, noteWidth, 30);

      // Draw note name
      ctx.fillStyle = accentColor;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        note.note.name + note.note.octave,
        startX + noteWidth / 2,
        y + 4
      );
    });

    ctx.globalAlpha = 1;
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NoteEditorUI;
}
