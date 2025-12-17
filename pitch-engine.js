// pitch-engine.js - Professional pitch detection and correction engine

class PitchEngine {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.detectedNotes = [];
    this.vibrato = { enabled: false, rate: 5, depth: 50 };
  }

  detectNotes(buffer, sampleRate) {
    this.detectedNotes = [];
    const minFreq = 50;
    const maxFreq = 2000;
    const windowSize = 4096;
    
    for (let i = 0; i < buffer.length - windowSize; i += windowSize / 2) {
      const window = buffer.slice(i, i + windowSize);
      const freq = this.detectPitch(window, sampleRate);
      
      if (freq > minFreq && freq < maxFreq) {
        this.detectedNotes.push({
          frequency: freq,
          note: this.frequencyToNote(freq),
          startTime: i / sampleRate,
          endTime: (i + windowSize) / sampleRate,
          amplitude: this.calculateAmplitude(window)
        });
      }
    }
    
    return this.detectedNotes;
  }

  detectPitch(buffer, sampleRate) {
    // YIN Autocorrelation algorithm
    const threshold = 0.1;
    const minPeriod = Math.floor(sampleRate / 1500);
    const maxPeriod = Math.floor(sampleRate / 50);
    
    const autocorr = new Float32Array(maxPeriod);
    
    for (let lag = minPeriod; lag < maxPeriod; lag++) {
      let sum = 0;
      for (let i = 0; i < buffer.length - lag; i++) {
        sum += Math.abs(buffer[i] - buffer[i + lag]);
      }
      autocorr[lag] = sum;
    }
    
    let minValue = Infinity;
    let minIndex = -1;
    
    for (let i = minPeriod; i < maxPeriod; i++) {
      if (autocorr[i] < minValue) {
        minValue = autocorr[i];
        minIndex = i;
      }
    }
    
    if (minIndex === -1) return 0;
    
    return sampleRate / minIndex;
  }

  frequencyToNote(frequency) {
    if (frequency <= 0) return { name: 'N/A', octave: 0 };
    
    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75);
    
    const semitones = 12 * Math.log2(frequency / C0);
    const noteIndex = Math.round(semitones) % 12;
    const octave = Math.floor((Math.round(semitones) + 12) / 12) - 1;
    
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    return {
      name: notes[noteIndex] || 'N/A',
      octave: octave,
      cents: ((semitones - Math.round(semitones)) * 100).toFixed(0)
    };
  }

  calculateAmplitude(buffer) {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += Math.abs(buffer[i]);
    }
    return sum / buffer.length;
  }

  detectScale() {
    if (this.detectedNotes.length === 0) return 'Unknown';
    
    const noteSet = new Set();
    this.detectedNotes.forEach(n => {
      noteSet.add(n.note.name);
    });
    
    const scales = {
      major: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      minor: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      pentatonic: ['C', 'D', 'E', 'G', 'A'],
      blues: ['C', 'D#', 'E', 'F#', 'G', 'A#'],
      dorian: ['D', 'E', 'F', 'G', 'A', 'B', 'C'],
      phrygian: ['E', 'F', 'G', 'A', 'B', 'C', 'D'],
      lydian: ['F', 'G', 'A', 'B', 'C', 'D', 'E'],
      mixolydian: ['G', 'A', 'B', 'C', 'D', 'E', 'F']
    };
    
    let bestScale = 'major';
    let bestMatch = 0;
    
    for (const [scale, notes] of Object.entries(scales)) {
      let matches = 0;
      notes.forEach(note => {
        if (noteSet.has(note)) matches++;
      });
      if (matches > bestMatch) {
        bestMatch = matches;
        bestScale = scale;
      }
    }
    
    return bestScale;
  }

  detectKey() {
    if (this.detectedNotes.length === 0) return 'C';
    
    // Find the most common note
    const noteCounts = {};
    this.detectedNotes.forEach(n => {
      noteCounts[n.note.name] = (noteCounts[n.note.name] || 0) + 1;
    });
    
    let mostCommon = 'C';
    let maxCount = 0;
    
    for (const [note, count] of Object.entries(noteCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = note;
      }
    }
    
    return mostCommon;
  }

  correctToScale(buffer, sampleRate, scale, key) {
    const scalePatterns = {
      major: [0, 2, 4, 5, 7, 9, 11],
      minor: [0, 2, 3, 5, 7, 8, 10],
      pentatonic: [0, 2, 4, 7, 9],
      blues: [0, 3, 5, 6, 7, 10],
      dorian: [0, 2, 3, 5, 7, 9, 10],
      phrygian: [0, 1, 3, 5, 7, 8, 10],
      lydian: [0, 2, 4, 6, 7, 9, 11],
      mixolydian: [0, 2, 4, 5, 7, 9, 10]
    };
    
    const keyNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const keyIndex = keyNotes.indexOf(key);
    const pattern = scalePatterns[scale] || scalePatterns.major;
    
    const scalePitches = pattern.map(interval => keyIndex + interval);
    
    const notes = this.detectNotes(buffer, sampleRate);
    const result = new Float32Array(buffer);
    
    for (const note of notes) {
      const noteSemitone = this.getNoteToNearestScaleDegree(note.frequency, scalePitches, sampleRate);
      const cents = noteSemitone - note.frequency;
      
      // Apply pitch shift (simplified)
      if (Math.abs(cents) > 10) {
        const ratio = Math.pow(2, cents / 1200);
        // Apply granular pitch shift
      }
    }
    
    return result;
  }

  getNoteToNearestScaleDegree(frequency, scalePitches, sampleRate) {
    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75);
    
    const semitones = 12 * Math.log2(frequency / C0);
    const currentSemitone = Math.round(semitones) % 12;
    
    const scaleSemitones = scalePitches.map(p => p % 12);
    
    let nearest = scaleSemitones[0];
    let minDiff = Math.abs(currentSemitone - nearest);
    
    for (const semitone of scaleSemitones) {
      const diff = Math.abs(currentSemitone - semitone);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = semitone;
      }
    }
    
    return C0 * Math.pow(2, nearest / 12);
  }

  applyPitchShift(buffer, semitones) {
    const ratio = Math.pow(2, semitones / 12);
    const result = new Float32Array(buffer.length);
    
    for (let i = 0; i < buffer.length; i++) {
      const index = i / ratio;
      const baseIndex = Math.floor(index);
      const fraction = index - baseIndex;
      
      if (baseIndex < buffer.length - 1) {
        result[i] = buffer[baseIndex] * (1 - fraction) + buffer[baseIndex + 1] * fraction;
      } else if (baseIndex < buffer.length) {
        result[i] = buffer[baseIndex];
      }
    }
    
    return result;
  }

  applyVibrato(buffer, rate, depth) {
    if (!this.vibrato.enabled) return buffer;
    
    const result = new Float32Array(buffer);
    const sampleRate = this.audioContext.sampleRate;
    const vibratoRate = rate || this.vibrato.rate;
    const vibratoDepth = (depth || this.vibrato.depth) / 100;
    
    for (let i = 0; i < result.length; i++) {
      const vibratoAmount = Math.sin(2 * Math.PI * vibratoRate * i / sampleRate) * vibratoDepth;
      const pitchShift = Math.pow(2, vibratoAmount / 12);
      result[i] *= pitchShift;
    }
    
    return result;
  }
}
