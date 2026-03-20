// audioDebugger.js - Audio validation and debugging utilities (FIXED)

export class AudioDebugger {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.stats = {
      trackReceived: false,
      streamConnected: false,
      audioPlaying: false,
      audioLevel: 0,
      frequency: 0,
      errors: [],
    };
  }

  // Initialize audio context for analysis
  initAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      console.log(`✅ AudioContext created: ${this.audioContext.state}`);
      return true;
    } catch (err) {
      console.error("❌ AudioContext not supported:", err);
      this.stats.errors.push("AudioContext not supported");
      return false;
    }
  }

  // Connect audio element to analyser (FIXED - skip if not supported)
  connectAudioElement(audioElement) {
    if (!this.audioContext) {
      this.initAudioContext();
    }

    try {
      // ⭐ FIX: Check if createMediaElementAudioSource exists
      if (typeof this.audioContext.createMediaElementAudioSource !== "function") {
        console.warn("⚠️ createMediaElementAudioSource not available, skipping analyser setup");
        return true; // Still return true - audio will work, just no analysis
      }

      // Create source from audio element
      const source = this.audioContext.createMediaElementAudioSource(audioElement);
      
      // Create analyser
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      
      // Connect: audio → analyser → destination
      source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      console.log("✅ Audio element connected to analyser");
      return true;
    } catch (err) {
      console.warn("⚠️ Could not connect analyser:", err.message);
      // Don't fail - audio will still play
      return true;
    }
  }

  // Analyze real-time audio data
  analyzeAudio() {
    if (!this.analyser || !this.dataArray) return null;

    try {
      this.analyser.getByteFrequencyData(this.dataArray);
      
      // Calculate average level
      const sum = this.dataArray.reduce((a, b) => a + b, 0);
      const average = Math.round(sum / this.dataArray.length);
      
      // Find peak frequency
      const peak = Math.max(...this.dataArray);
      
      // Detect if audio is playing (threshold)
      const isPlaying = average > 5;
      
      return {
        averageLevel: average,
        peakLevel: peak,
        isPlaying,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.error("❌ Analysis error:", err);
      return null;
    }
  }

  // Monitor audio element properties
  monitorAudioElement(audioElement) {
    console.log("\n📊 Audio Element Status:");
    console.log("  srcObject:", audioElement.srcObject ? "✅ Set" : "❌ Not set");
    console.log("  paused:", audioElement.paused ? "⏸️ Paused" : "▶️ Playing");
    console.log("  currentTime:", audioElement.currentTime);
    console.log("  duration:", audioElement.duration);
    console.log("  volume:", audioElement.volume);
    console.log("  muted:", audioElement.muted ? "🔇 Muted" : "🔊 Not muted");
    console.log("  readyState:", audioElement.readyState, "(0=nothing, 1=metadata, 2=current, 3=future, 4=enough)");
    console.log("  networkState:", audioElement.networkState, "(0=empty, 1=idle, 2=loading, 3=no source)");

    return {
      hasSrcObject: !!audioElement.srcObject,
      paused: audioElement.paused,
      currentTime: audioElement.currentTime,
      duration: audioElement.duration,
      volume: audioElement.volume,
      muted: audioElement.muted,
      readyState: audioElement.readyState,
      networkState: audioElement.networkState,
    };
  }

  // Check WebRTC track status
  analyzeTrack(track) {
    if (!track) {
      console.error("❌ No track provided");
      return null;
    }

    console.log("\n📡 Track Status:");
    console.log("  kind:", track.kind);
    console.log("  id:", track.id);
    console.log("  enabled:", track.enabled ? "✅ Enabled" : "❌ Disabled");
    console.log("  readyState:", track.readyState, "(live/ended)");
    console.log("  muted:", track.muted ? "🔇 Muted" : "🔊 Not muted");

    return {
      kind: track.kind,
      id: track.id,
      enabled: track.enabled,
      readyState: track.readyState,
      muted: track.muted,
    };
  }

  // Check WebRTC stream status
  analyzeStream(stream) {
    if (!stream) {
      console.error("❌ No stream provided");
      return null;
    }

    const audioTracks = stream.getAudioTracks();
    
    console.log("\n🎵 Stream Status:");
    console.log("  audioTracks:", audioTracks.length);
    audioTracks.forEach((track, i) => {
      console.log(`  Track ${i}:`, {
        enabled: track.enabled,
        readyState: track.readyState,
        muted: track.muted,
      });
    });

    return {
      audioTrackCount: audioTracks.length,
      tracks: audioTracks.map((t) => ({
        id: t.id,
        enabled: t.enabled,
        readyState: t.readyState,
      })),
    };
  }

  // Continuous monitoring
  startMonitoring(audioElement, interval = 1000) {
    console.log("🔍 Starting audio monitoring...");
    
    const monitor = setInterval(() => {
      const analysis = this.analyzeAudio();
      if (analysis) {
        console.log(`📊 Audio Analysis:`, {
          level: `${analysis.averageLevel}/255`,
          peak: `${analysis.peakLevel}/255`,
          playing: analysis.isPlaying ? "▶️" : "⏸️",
        });
      }
      
      this.monitorAudioElement(audioElement);
    }, interval);

    return () => {
      clearInterval(monitor);
      console.log("⏹️ Monitoring stopped");
    };
  }

  // Generate full report
  generateReport(audioElement, stream, track) {
    console.log("\n" + "=".repeat(60));
    console.log("🔍 FULL AUDIO DEBUG REPORT");
    console.log("=".repeat(60));

    const elementStatus = this.monitorAudioElement(audioElement);
    const streamStatus = this.analyzeStream(stream);
    const trackStatus = track ? this.analyzeTrack(track) : null;
    const audioAnalysis = this.analyzeAudio();

    console.log("\n📋 Summary:");
    console.log("  Stream connected:", streamStatus?.audioTrackCount > 0 ? "✅" : "❌");
    console.log("  Track enabled:", trackStatus?.enabled ? "✅" : "❌");
    console.log("  Audio playing:", audioAnalysis?.isPlaying ? "✅" : "❌");
    console.log("  No errors:", this.stats.errors.length === 0 ? "✅" : `❌ (${this.stats.errors.length})`);

    if (this.stats.errors.length > 0) {
      console.log("\n❌ Errors:");
      this.stats.errors.forEach((err) => console.log("  -", err));
    }

    console.log("\n" + "=".repeat(60));

    return {
      element: elementStatus,
      stream: streamStatus,
      track: trackStatus,
      audio: audioAnalysis,
      errors: this.stats.errors,
    };
  }

  // Test audio playback with tone
  playTestTone(frequency = 440, duration = 2000) {
    if (!this.audioContext) {
      this.initAudioContext();
    }

    console.log(`🔊 Playing test tone: ${frequency}Hz for ${duration}ms`);
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      oscillator.frequency.value = frequency;
      oscillator.type = "sine";
      
      oscillator.connect(gain);
      gain.connect(this.audioContext.destination);
      
      gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);

      console.log("✅ Test tone played successfully");
    } catch (err) {
      console.error("❌ Test tone error:", err);
    }
  }
}

export default AudioDebugger;