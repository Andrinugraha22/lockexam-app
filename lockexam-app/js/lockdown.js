/**
 * LockExam Security & Anti-Cheat Lockdown Engine
 * Mencegah kecurangan, ganti tab, keluar fullscreen, dan tombol shortcut
 */

class LockdownEngine {
  constructor() {
    this.isActive = false;
    this.violationCount = 0;
    this.maxViolations = 3;
    this.lastBackPressTime = 0;
    this.isViolationModalOpen = false;
    this.onViolationCallback = null;
    this.onLockoutCallback = null;
    this.audioContext = null;

    this.initEventListeners();
  }

  initEventListeners() {
    // 1. Detect Fullscreen Exit
    document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
    document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
    document.addEventListener('mozfullscreenchange', () => this.handleFullscreenChange());
    document.addEventListener('MSFullscreenChange', () => this.handleFullscreenChange());

    // 2. Detect Tab Switch / App Minimize (Visibility Change)
    document.addEventListener('visibilitychange', () => {
      if (this.isActive && document.hidden) {
        this.recordViolation('Berpindah tab atau membuka aplikasi lain');
      }
    });

    // 3. Detect Window Blur (Layar Kehilangan Fokus)
    window.addEventListener('blur', () => {
      if (this.isActive && !this.isViolationModalOpen) {
        this.recordViolation('Layar ujian kehilangan fokus (klik di luar atau membuka jendela lain)');
      }
    });

    // 4. Disable Context Menu (Klik Kanan)
    document.addEventListener('contextmenu', (e) => {
      if (this.isActive) {
        e.preventDefault();
        return false;
      }
    });

    // 5. Block Suspicious Shortcuts (F12, Ctrl+U, Ctrl+Shift+I/J/C, Ctrl+C, Ctrl+V, Ctrl+P)
    document.addEventListener('keydown', (e) => {
      if (!this.isActive) return;

      // F12 (DevTools)
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        this.recordViolation('Mencoba membuka Developer Tools (F12)');
        return false;
      }

      // Ctrl or Meta combinations
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        // Prevent copy, paste, inspect, print, view source
        if (['c', 'v', 'u', 'p', 's', 'a'].includes(key) || (e.shiftKey && ['i', 'j', 'c'].includes(key))) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }

      // Alt+Tab simulation guard or Esc guard
      if (e.key === 'Escape') {
        // Fullscreen exit prompt guard
        if (this.isActive) {
          setTimeout(() => this.handleFullscreenChange(), 200);
        }
      }
    });

    // 6. Mobile & Browser Back Button Guard ("Tekan sekali lagi untuk keluar")
    window.addEventListener('popstate', (e) => {
      if (this.isActive) {
        const now = Date.now();
        if (now - this.lastBackPressTime < 2000) {
          // Double back pressed
          alert('Ujian sedang berlangsung! Gunakan tombol Selesaikan Ujian di dalam layar.');
        } else {
          this.lastBackPressTime = now;
          this.showToast('Tekan sekali lagi untuk keluar');
        }
        history.pushState(null, '', location.href);
      }
    });
  }

  // Start Lockdown Mode
  start(maxViolations = 3, onViolation = null, onLockout = null) {
    this.isActive = true;
    this.violationCount = 0;
    this.maxViolations = maxViolations;
    this.onViolationCallback = onViolation;
    this.onLockoutCallback = onLockout;

    // Push history state to block immediate back
    history.pushState(null, '', location.href);

    // Request fullscreen
    this.enterFullscreen();
  }

  // Stop Lockdown Mode
  stop() {
    this.isActive = false;
    this.violationCount = 0;
    this.exitFullscreen();
    document.getElementById('modal-violation-alert')?.classList.add('hidden');
    document.getElementById('modal-locked-screen')?.classList.add('hidden');
  }

  // Enter browser fullscreen
  enterFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  }

  // Exit fullscreen
  exitFullscreen() {
    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen && document.webkitFullscreenElement) {
      document.webkitExitFullscreen();
    }
  }

  // Handle fullscreen status change
  handleFullscreenChange() {
    if (!this.isActive) return;

    const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    if (!isFullscreen) {
      this.recordViolation('Keluar dari mode layar penuh (Fullscreen)');
    }
  }

  // Record a cheating attempt / security violation
  recordViolation(reason) {
    if (!this.isActive || this.isViolationModalOpen) return;

    this.violationCount++;
    this.playWarningBeep();

    if (this.onViolationCallback) {
      this.onViolationCallback(this.violationCount, reason);
    }

    if (this.violationCount >= this.maxViolations) {
      // Exceeded threshold -> Lockout!
      this.triggerLockout();
    } else {
      // Show warning modal
      this.showViolationModal(reason);
    }
  }

  showViolationModal(reason) {
    this.isViolationModalOpen = true;
    const modal = document.getElementById('modal-violation-alert');
    const reasonEl = document.getElementById('violation-reason');
    const countEl = document.getElementById('violation-count-badge');
    const maxEl = document.getElementById('violation-max-badge');

    if (modal && reasonEl && countEl && maxEl) {
      reasonEl.textContent = reason;
      countEl.textContent = this.violationCount;
      maxEl.textContent = this.maxViolations;
      modal.classList.remove('hidden');
    }
  }

  resumeExam() {
    this.isViolationModalOpen = false;
    document.getElementById('modal-violation-alert')?.classList.add('hidden');
    this.enterFullscreen();
  }

  triggerLockout() {
    this.isViolationModalOpen = true;
    document.getElementById('modal-violation-alert')?.classList.add('hidden');
    document.getElementById('modal-locked-screen')?.classList.remove('hidden');

    if (this.onLockoutCallback) {
      this.onLockoutCallback(this.violationCount);
    }
  }

  unlockFromProctor() {
    this.violationCount = 0;
    this.isViolationModalOpen = false;
    document.getElementById('modal-locked-screen')?.classList.add('hidden');
    this.enterFullscreen();
  }

  playWarningBeep() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs font-bold py-2.5 px-4 rounded-full shadow-lg pointer-events-none transition-all';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }
}

const lockdown = new LockdownEngine();
window.lockdown = lockdown;
