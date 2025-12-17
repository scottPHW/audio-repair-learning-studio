// audio-processing.js - Advanced audio processing tools

class AudioProcessor {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.buffer = null;
  }

  // Noise Gate
  noiseGate(buffer, threshold = -40, attackTime = 0.1, releaseTime = 0.2) {
    const data = buffer.getChannelData(0);
    const thresholdLinear = Math.pow(10, threshold / 20);
    const sr = buffer.sampleRate;
    const attackSamples = Math.floor(attackTime * sr);
    const releaseSamples = Math.floor(releaseTime * sr);
    
    let gateOpen = false;
    let gateCounter = 0;
    
    for (let i = 0; i < data.length; i++) {
      const level = Math.abs(data[i]);
      
      if (level > thresholdLinear && !gateOpen) {
        gateOpen = true;
        gateCounter = 0;
      } else if (level <= thresholdLinear && gateOpen) {
        gateCounter++;
        if (gateCounter > releaseSamples) {
          gateOpen = false;
          gateCounter = 0;
        }
      }
      
      if (!gateOpen) {
        data[i] *= 0.9;
      }
    }
    
    return buffer;
  }

  // Click/Pop Removal
  removeClicks(buffer, threshold = 0.3, windowSize = 5) {
    const data = buffer.getChannelData(0);
    
    for (let i = windowSize; i < data.length - windowSize; i++) {
      const diff = Math.abs(data[i] - data[i - 1]);
      
      if (diff > threshold) {
        let sum = 0;
        let count = 0;
        for (let j = -windowSize; j <= windowSize; j++) {
          if (i + j !== i && i + j >= 0 && i + j < data.length) {
            sum += data[i + j];
            count++;
          }
        }
        data[i] = sum / count;
      }
    }
    
    return buffer;
  }

  // De-Hum (Notch filter for 50/60 Hz)
  deHum(buffer, frequency = 60, bandwidth = 10) {
    const data = buffer.getChannelData(0);
    const sr = buffer.sampleRate;
    
    const w0 = 2 * Math.PI * frequency / sr;
    const alpha = Math.sin(w0) / (2 * (frequency / bandwidth));
    
    const b0 = 1;
    const b1 = -2 * Math.cos(w0);
    const b2 = 1;
    const a0 = 1 + alpha;
    const a1 = -2 * Math.cos(w0);
    const a2 = 1 - alpha;
    
    const coeffs = [b0/a0, b1/a0, b2/a0, a1/a0, a2/a0];
    
    let y0 = 0, y1 = 0, x0 = 0, x1 = 0;
    
    for (let i = 0; i < data.length; i++) {
      x0 = data[i];
      y0 = coeffs[0] * x0 + coeffs[1] * x1 - coeffs[3] * y1;
      x1 = x0;
      y1 = y0;
      data[i] = y0;
    }
    
    return buffer;
  }

  // 3-Band EQ
  applyEQ(buffer, lowGain = 0, midGain = 0, highGain = 0) {
    const data = buffer.getChannelData(0);
    const sr = buffer.sampleRate;
    
    // Low pass for low band
    const lowFreq = 200;
    const midFreq = 2000;
    
    // Simple EQ by boosting/cutting different frequency bands
    const lowDb = lowGain;
    const midDb = midGain;
    const highDb = highGain;
    
    const lowGainLinear = Math.pow(10, lowDb / 20);
    const midGainLinear = Math.pow(10, midDb / 20);
    const highGainLinear = Math.pow(10, highDb / 20);
    
    // Apply gentle EQ (this is simplified)
    for (let i = 0; i < data.length; i++) {
      data[i] *= (lowGainLinear * 0.33 + midGainLinear * 0.33 + highGainLinear * 0.34);
    }
    
    return buffer;
  }

  // Soft-knee Compressor
  compress(buffer, threshold = -20, ratio = 4, attackTime = 0.005, releaseTime = 0.1, makeupGain = 0) {
    const data = buffer.getChannelData(0);
    const sr = buffer.sampleRate;
    const thresholdLinear = Math.pow(10, threshold / 20);
    const attackSamples = Math.floor(attackTime * sr);
    const releaseSamples = Math.floor(releaseTime * sr);
    const kneeWidth = 6;
    
    let gainReduction = 1;
    let gainCounter = 0;
    
    for (let i = 0; i < data.length; i++) {
      const level = Math.abs(data[i]);
      const levelDb = 20 * Math.log10(Math.max(level, 0.00001));
      
      let targetGainReduction = 1;
      
      if (levelDb > threshold + kneeWidth / 2) {
        const excess = levelDb - (threshold + kneeWidth / 2);
        targetGainReduction = Math.pow(10, (-excess / 20) * (1 - 1 / ratio));
      } else if (levelDb > threshold - kneeWidth / 2) {
        const knee = (levelDb - (threshold - kneeWidth / 2)) / kneeWidth;
        const excess = kneeWidth / 2 * knee * knee;
        targetGainReduction = Math.pow(10, (-excess / 20) * (1 - 1 / ratio));
      }
      
      if (targetGainReduction < gainReduction) {
        gainReduction -= (gainReduction - targetGainReduction) / attackSamples;
      } else {
        gainReduction += (targetGainReduction - gainReduction) / releaseSamples;
      }
      
      const makeupGainLinear = Math.pow(10, makeupGain / 20);
      data[i] *= gainReduction * makeupGainLinear;
    }
    
    return buffer;
  }

  // Normalize audio
  normalize(buffer, targetLevel = -3) {
    const data = buffer.getChannelData(0);
    let maxLevel = 0;
    
    for (let i = 0; i < data.length; i++) {
      maxLevel = Math.max(maxLevel, Math.abs(data[i]));
    }
    
    if (maxLevel > 0) {
      const targetLinear = Math.pow(10, targetLevel / 20);
      const normalizeFactor = targetLinear / maxLevel;
      
      for (let i = 0; i < data.length; i++) {
        data[i] *= normalizeFactor;
      }
    }
    
    return buffer;
  }

  // Fade in/out
  applyFade(buffer, fadeInTime = 0, fadeOutTime = 0) {
    const data = buffer.getChannelData(0);
    const sr = buffer.sampleRate;
    const fadeInSamples = Math.floor(fadeInTime * sr);
    const fadeOutSamples = Math.floor(fadeOutTime * sr);
    
    for (let i = 0; i < fadeInSamples && i < data.length; i++) {
      data[i] *= i / fadeInSamples;
    }
    
    const startFadeOut = Math.max(0, data.length - fadeOutSamples);
    for (let i = startFadeOut; i < data.length; i++) {
      data[i] *= (data.length - i) / fadeOutSamples;
    }
    
    return buffer;
  }
}
