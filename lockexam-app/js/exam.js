/**
 * LockExam Student Exam Runner Engine
 * Pengatur lembar ujian, navigasi soal, timer, penyimpanan jawaban, dan kalkulasi nilai
 */

class ExamEngine {
  constructor() {
    this.currentExam = null;
    this.questions = [];
    this.currentIndex = 0;
    this.answers = {}; // { questionId: selectedOptionKey }
    this.doubtStatus = {}; // { questionId: boolean }
    this.timerInterval = null;
    this.remainingSeconds = 0;
    this.fontSize = 'md';

    this.sampleQuestions = [
      {
        id: 1,
        text: 'Diketahui suatu barisan aritmetika dengan suku ke-3 adalah 14 dan suku ke-7 adalah 26. Berapakah suku ke-15 dari barisan tersebut?',
        options: { A: '48', B: '50', C: '52', D: '54', E: '56' },
        correctKey: 'B'
      },
      {
        id: 2,
        text: 'Jika f(x) = 3x² - 5x + 7, maka turunan pertama f\'(x) untuk nilai x = 4 adalah...',
        options: { A: '19', B: '23', C: '25', D: '27', E: '31' },
        correctKey: 'A'
      },
      {
        id: 3,
        text: 'Sebuah kubus ABCD.EFGH memiliki panjang rusuk 8 cm. Jarak antara titik A ke bidang BDE adalah...',
        options: { A: '4√3 cm', B: '8/3 √3 cm', C: '4/3 √3 cm', D: '8√2 cm', E: '2√6 cm' },
        correctKey: 'B'
      },
      {
        id: 4,
        text: 'Himpunan penyelesaian dari pertidaksamaan 2x - 5 < 3x + 1 untuk x bilangan bulat adalah...',
        options: { A: 'x > -6', B: 'x < -6', C: 'x ≥ 6', D: 'x ≤ -6', E: 'x > 6' },
        correctKey: 'A'
      },
      {
        id: 5,
        text: 'Nilai dari lim (x→3) (x² - 9) / (x - 3) adalah...',
        options: { A: '0', B: '3', C: '6', D: '9', E: 'Tak hingga' },
        correctKey: 'C'
      },
      {
        id: 6,
        text: 'Dua buah dadu dilempar bersamaan sebanyak satu kali. Peluang munculnya mata dadu berjumlah 8 atau 11 adalah...',
        options: { A: '5/36', B: '7/36', C: '9/36', D: '11/36', E: '13/36' },
        correctKey: 'B'
      },
      {
        id: 7,
        text: 'Sebuah kotak berisi 5 bola merah dan 3 bola putih. Jika diambil 2 bola secara acak sekaligus, peluang terambil keduanya bola merah adalah...',
        options: { A: '5/14', B: '10/28', C: '5/28', D: '15/56', E: '3/8' },
        correctKey: 'A'
      },
      {
        id: 8,
        text: 'Persamaan lingkaran yang berpusat di titik (0,0) dan melalui titik (-3, 4) adalah...',
        options: { A: 'x² + y² = 7', B: 'x² + y² = 16', C: 'x² + y² = 25', D: 'x² + y² = 49', E: 'x² + y² = 12' },
        correctKey: 'C'
      },
      {
        id: 9,
        text: 'Jika sin A = 3/5 dengan sudut A berada di kuadran I, maka nilai dari cos 2A adalah...',
        options: { A: '7/25', B: '16/25', C: '24/25', D: '-7/25', E: '4/5' },
        correctKey: 'A'
      },
      {
        id: 10,
        text: 'Rata-rata nilai ujian matematika dari 39 siswa adalah 72. Jika nilai seorang siswa baru digabungkan, nilai rata-rata menjadi 72,5. Nilai siswa baru tersebut adalah...',
        options: { A: '88', B: '90', C: '92', D: '94', E: '96' },
        correctKey: 'C'
      }
    ];
  }

  // Load and start exam
  startExam(examData, questionsList) {
    this.currentExam = examData;
    this.questions = [...questionsList];
    this.currentIndex = 0;
    this.answers = {};
    this.doubtStatus = {};

    // Randomize questions if enabled
    if (app.settings.randomizeQuestions) {
      this.questions.sort(() => Math.random() - 0.5);
    }

    // Set duration
    this.remainingSeconds = (examData.durationMinutes || 90) * 60;

    // Update UI Header
    document.getElementById('exam-header-title').textContent = examData.title;
    document.getElementById('exam-header-subject').textContent = `${examData.subject} • ${this.questions.length} Soal • ${examData.durationMinutes} Menit`;

    // Initialize Timer
    this.startTimer();

    // Render Matrix & Current Question
    this.renderQuestionMatrix();
    this.renderCurrentQuestion();

    // Start Lockdown
    lockdown.start(
      app.settings.maxCheats || 3,
      (count, reason) => {
        // Callback violation
        proctor.recordLiveStudentViolation(app.currentUser?.nisn || 'DEMO', count, reason);
      },
      (count) => {
        // Callback lockout
        proctor.recordLiveStudentLockout(app.currentUser?.nisn || 'DEMO');
      }
    );

    // Switch view
    app.navigate('exam-room');
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    const timerEl = document.getElementById('exam-timer');
    const updateDisplay = () => {
      const hours = Math.floor(this.remainingSeconds / 3600);
      const minutes = Math.floor((this.remainingSeconds % 3600) / 60);
      const seconds = this.remainingSeconds % 60;

      const formatted = 
        String(hours).padStart(2, '0') + ':' +
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0');

      if (timerEl) {
        timerEl.textContent = formatted;
        if (this.remainingSeconds <= 300) {
          timerEl.classList.add('text-red-500', 'animate-pulse');
        } else {
          timerEl.classList.remove('text-red-500', 'animate-pulse');
        }
      }

      if (this.remainingSeconds <= 0) {
        clearInterval(this.timerInterval);
        alert('Waktu ujian telah habis! Sistem akan mengumpulkan jawaban Anda secara otomatis.');
        this.submitExam();
      }
      this.remainingSeconds--;
    };

    updateDisplay();
    this.timerInterval = setInterval(updateDisplay, 1000);
  }

  renderCurrentQuestion() {
    const q = this.questions[this.currentIndex];
    if (!q) return;

    // Number & Status
    document.getElementById('exam-q-number').textContent = `Soal ${this.currentIndex + 1}`;
    
    const statusEl = document.getElementById('exam-q-status');
    const isAnswered = this.answers[q.id] !== undefined;
    const isDoubt = !!this.doubtStatus[q.id];

    if (isDoubt) {
      statusEl.className = 'ex-badge';
      statusEl.style.background = '#fef3c7';
      statusEl.style.color = '#b45309';
      statusEl.innerHTML = `<i data-lucide="flag" style="width:14px;height:14px;"></i> Ragu-Ragu`;
    } else if (isAnswered) {
      statusEl.className = 'ex-badge ok';
      statusEl.style.background = '#dcfce7';
      statusEl.style.color = '#15803d';
      statusEl.innerHTML = `<i data-lucide="check" style="width:14px;height:14px;"></i> Sudah dijawab (${this.answers[q.id]})`;
    } else {
      statusEl.className = 'ex-badge';
      statusEl.style.background = 'var(--s100)';
      statusEl.style.color = 'var(--s600)';
      statusEl.textContent = 'Belum dijawab';
    }

    // Question Text with font size
    const textEl = document.getElementById('exam-q-text');
    textEl.innerHTML = q.text;

    // Multiple Choice Options (.ex-opts, .opt, .opt.on, b, .optx)
    const optionsContainer = document.getElementById('exam-q-options');
    optionsContainer.innerHTML = '';

    const currentAnswer = this.answers[q.id];

    // Options keys A, B, C, D, E
    Object.keys(q.options).forEach((key, optIdx) => {
      const isSelected = currentAnswer === key;
      const optBtn = document.createElement('button');
      optBtn.type = 'button';
      optBtn.setAttribute('role', 'radio');
      optBtn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      optBtn.className = `opt ${isSelected ? 'on' : ''}`;
      optBtn.style.display = 'flex';
      optBtn.style.alignItems = 'center';
      optBtn.style.gap = '14px';
      optBtn.style.padding = '12px 16px';
      optBtn.style.borderRadius = '12px';
      optBtn.style.border = isSelected ? '2px solid var(--bl700)' : '1px solid var(--s200)';
      optBtn.style.background = isSelected ? 'var(--bl50)' : '#fff';
      optBtn.style.cursor = 'pointer';
      optBtn.style.textAlign = 'left';
      optBtn.style.transition = 'all 0.15s';

      optBtn.onclick = () => this.selectAnswer(q.id, key);

      optBtn.innerHTML = `
        <b style="width:30px;height:30px;border-radius:8px;background:${isSelected ? 'var(--bl700)' : 'var(--s100)'};color:${isSelected ? '#fff' : 'var(--s700)'};display:grid;place-items:center;font-size:13px;flex:none;">${key}</b>
        <span class="optx" style="font-size:14px;font-weight:600;color:var(--s800);">${q.options[key]}</span>
      `;
      optionsContainer.appendChild(optBtn);
    });

    // Update Doubt Button Style
    const doubtBtn = document.getElementById('btn-doubt-question');
    if (doubtBtn) {
      if (isDoubt) {
        doubtBtn.style.background = '#f59e0b';
        doubtBtn.style.color = '#fff';
        doubtBtn.style.borderColor = '#f59e0b';
      } else {
        doubtBtn.style.background = '#fef3c7';
        doubtBtn.style.color = '#b45309';
        doubtBtn.style.borderColor = '#fcd34d';
      }
    }

    // Previous Button Disabled on first
    const prevBtn = document.getElementById('btn-prev-question');
    if (prevBtn) {
      prevBtn.disabled = this.currentIndex === 0;
      prevBtn.style.opacity = this.currentIndex === 0 ? '0.4' : '1';
    }

    // Next Button text changes on last question
    const nextBtn = document.getElementById('btn-next-question');
    if (nextBtn) {
      if (this.currentIndex === this.questions.length - 1) {
        nextBtn.innerHTML = `Selesai <i data-lucide="check-square" style="width:16px;height:16px;"></i>`;
      } else {
        nextBtn.innerHTML = `Selanjutnya <i data-lucide="chevron-right" style="width:16px;height:16px;"></i>`;
      }
    }

    this.renderQuestionMatrix();
    if (window.lucide) lucide.createIcons();
  }

  selectAnswer(questionId, optionKey) {
    this.answers[questionId] = optionKey;
    this.renderCurrentQuestion();

    // Auto-update student progress in proctor room
    const answeredCount = Object.keys(this.answers).length;
    proctor.updateLiveStudentProgress(app.currentUser?.nisn || 'DEMO', answeredCount, this.questions.length);
  }

  toggleDoubt() {
    const q = this.questions[this.currentIndex];
    if (!q) return;

    this.doubtStatus[q.id] = !this.doubtStatus[q.id];
    this.renderCurrentQuestion();
  }

  nextQuestion() {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      this.renderCurrentQuestion();
    } else {
      this.confirmSubmit();
    }
  }

  prevQuestion() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.renderCurrentQuestion();
    }
  }

  goToQuestion(index) {
    if (index >= 0 && index < this.questions.length) {
      this.currentIndex = index;
      this.renderCurrentQuestion();
    }
  }

  setFontSize(size) {
    this.fontSize = size;
    this.renderCurrentQuestion();
  }

  toggleNavDrawer() {
    const drawer = document.getElementById('exam-nav-drawer');
    if (drawer) {
      drawer.classList.toggle('hidden');
    }
  }

  renderQuestionMatrix() {
    const matrixContainer = document.getElementById('exam-number-matrix');
    const answeredStat = document.getElementById('exam-stat-answered');
    const unansweredStat = document.getElementById('exam-stat-unanswered');
    if (!matrixContainer) return;

    matrixContainer.innerHTML = '';
    let answeredCount = 0;

    this.questions.forEach((q, idx) => {
      const isCurrent = idx === this.currentIndex;
      const isAnswered = this.answers[q.id] !== undefined;
      const isDoubt = !!this.doubtStatus[q.id];

      if (isAnswered) answeredCount++;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `qn ${isAnswered ? 'done' : ''} ${isCurrent ? 'cur' : ''}`;
      btn.style.height = '38px';
      btn.style.borderRadius = '8px';
      btn.style.fontSize = '12px';
      btn.style.fontWeight = '800';
      btn.style.cursor = 'pointer';
      btn.style.border = isCurrent ? '2px solid var(--bl700)' : '1px solid var(--s200)';
      btn.style.background = isDoubt ? '#f59e0b' : isAnswered ? '#10b981' : isCurrent ? '#dbeafe' : 'var(--s100)';
      btn.style.color = (isDoubt || isAnswered) ? '#fff' : 'var(--s800)';

      btn.onclick = () => this.goToQuestion(idx);

      const chosenOption = this.answers[q.id];
      btn.innerHTML = chosenOption ? `<span>${idx + 1}</span><small style="display:block;font-size:9px;line-height:1;">${chosenOption}</small>` : `${idx + 1}`;

      matrixContainer.appendChild(btn);
    });

    if (answeredStat) answeredStat.textContent = answeredCount;
    if (unansweredStat) unansweredStat.textContent = this.questions.length - answeredCount;
  }

  confirmSubmit() {
    const answeredCount = Object.keys(this.answers).length;
    const totalCount = this.questions.length;
    const unansweredCount = totalCount - answeredCount;

    let warningMsg = `Anda telah menjawab ${answeredCount} dari ${totalCount} soal.`;
    if (unansweredCount > 0) {
      warningMsg += ` Masih terdapat ${unansweredCount} soal yang belum dijawab.`;
    }
    warningMsg += `\n\nApakah Anda yakin ingin menyelesaikan dan mengumpulkan ujian?`;

    if (confirm(warningMsg)) {
      this.submitExam();
    }
  }

  submitExam() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    lockdown.stop();

    // Calculate score
    let correct = 0;
    this.questions.forEach((q) => {
      if (this.answers[q.id] === q.correctKey) {
        correct++;
      }
    });

    const total = this.questions.length;
    const score = Math.round((correct / total) * 100);

    // Save result to proctor data
    proctor.recordExamSubmission(app.currentUser?.nisn || 'DEMO', {
      name: app.currentUser?.name || 'Siswa Uji Coba',
      nisn: app.currentUser?.nisn || '1234567890',
      subject: this.currentExam?.subject || 'Ujian',
      correct,
      wrong: total - correct,
      score,
      completedAt: new Date().toLocaleTimeString('id-ID')
    });

    // Show Authentic Circular Ring Result Screen
    app.showResultScreen(score, correct, total - correct, this.currentExam);
  }
}

const exam = new ExamEngine();
window.exam = exam;
