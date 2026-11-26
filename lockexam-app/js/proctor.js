/**
 * LockExam Proctor & Admin Control Center
 * Realtime monitoring, live cheat detection, token release, score compilation & export
 */

class ProctorControlCenter {
  constructor() {
    this.activeToken = 'LKX892';
    this.students = [
      { id: '1', name: 'Ahmad Fauzi', nisn: '1234567890', kelas: 'XII MIPA 1', password: 'siswa', progress: 14, total: 20, timeRemaining: '01:12:45', cheats: 0, status: 'Mengerjakan' },
      { id: '2', name: 'Bella Safitri', nisn: '1234567891', kelas: 'XII MIPA 1', password: 'siswa', progress: 18, total: 20, timeRemaining: '01:05:12', cheats: 1, status: 'Mengerjakan' },
      { id: '3', name: 'Dimas Pratama', nisn: '1234567892', kelas: 'XII MIPA 1', password: 'siswa', progress: 8, total: 20, timeRemaining: '01:22:00', cheats: 3, status: 'Terkunci' },
      { id: '4', name: 'Eka Nuraini', nisn: '1234567893', kelas: 'XII MIPA 1', password: 'siswa', progress: 20, total: 20, timeRemaining: '00:00:00', cheats: 0, status: 'Selesai' },
      { id: '5', name: 'Fajar Nugraha', nisn: '1234567894', kelas: 'XII MIPA 1', password: 'siswa', progress: 12, total: 20, timeRemaining: '01:16:30', cheats: 2, status: 'Mengerjakan' },
      { id: '6', name: 'Gita Lestari', nisn: '1234567895', kelas: 'XII MIPA 1', password: 'siswa', progress: 20, total: 20, timeRemaining: '00:00:00', cheats: 0, status: 'Selesai' },
    ];

    this.results = [
      { rank: 1, name: 'Eka Nuraini', nisn: '1234567893', correct: 19, wrong: 1, score: 95.0, status: 'Tuntas' },
      { rank: 2, name: 'Gita Lestari', nisn: '1234567895', correct: 17, wrong: 3, score: 85.0, status: 'Tuntas' },
    ];
  }

  init() {
    this.renderMonitoringTable();
    this.renderTokenView();
    this.renderMasterSiswa();
    this.renderNilaiTable();
    this.renderQuestionBank();
    this.updateStats();
  }

  openTab(tabName) {
    // 1. Update button styling
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.remove('border-blue-600', 'text-blue-700');
      btn.classList.add('border-transparent', 'text-slate-600');
    });

    const activeBtn = document.getElementById(`nav-tab-${tabName}`);
    if (activeBtn) {
      activeBtn.classList.remove('border-transparent', 'text-slate-600');
      activeBtn.classList.add('border-blue-600', 'text-blue-700');
    }

    // 2. Hide all panels, show the targeted one
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.add('hidden'));
    const activePanel = document.getElementById(`panel-${tabName}`);
    if (activePanel) {
      activePanel.classList.remove('hidden');
    }

    if (window.lucide) lucide.createIcons();
  }

  switchTab(tabName) {
    this.openTab(tabName);
  }

  updateStats() {
    const total = this.students.length;
    const active = this.students.filter(s => s.status === 'Mengerjakan').length;
    const cheats = this.students.filter(s => s.cheats > 0 || s.status === 'Terkunci').length;
    const done = this.students.filter(s => s.status === 'Selesai').length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-active').textContent = active;
    document.getElementById('stat-cheats').textContent = cheats;
    document.getElementById('stat-done').textContent = done;
  }

  renderMonitoringTable() {
    const tbody = document.getElementById('proctor-student-rows');
    if (!tbody) return;

    tbody.innerHTML = '';
    this.students.forEach((s) => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition-colors';

      let statusBadge = '';
      if (s.status === 'Terkunci') {
        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-700 animate-pulse"><i data-lucide="lock" class="w-3 h-3"></i> Terkunci (${s.cheats}x Pelanggaran)</span>`;
      } else if (s.status === 'Selesai') {
        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700"><i data-lucide="check-circle" class="w-3 h-3"></i> Selesai</span>`;
      } else if (s.cheats > 0) {
        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800"><i data-lucide="alert-triangle" class="w-3 h-3"></i> Peringatan (${s.cheats}x Ganti Tab)</span>`;
      } else {
        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800"><i data-lucide="shield" class="w-3 h-3"></i> Aman (Fullscreen)</span>`;
      }

      tr.innerHTML = `
        <td class="py-3 px-4">
          <div class="font-extrabold text-slate-800">${s.name}</div>
          <div class="text-[11px] text-slate-400 font-mono">NISN: ${s.nisn}</div>
        </td>
        <td class="py-3 px-4 font-semibold text-slate-600">${s.kelas}</td>
        <td class="py-3 px-4">
          <div class="flex items-center gap-2">
            <div class="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
              <div class="bg-blue-600 h-full rounded-full" style="width: ${(s.progress / s.total) * 100}%"></div>
            </div>
            <span class="font-bold text-slate-700">${s.progress}/${s.total}</span>
          </div>
        </td>
        <td class="py-3 px-4 font-mono font-semibold text-slate-600">${s.timeRemaining}</td>
        <td class="py-3 px-4">${statusBadge}</td>
        <td class="py-3 px-4 text-right">
          <div class="inline-flex items-center gap-1.5">
            ${s.status === 'Terkunci' ? `
              <button onclick="proctor.unlockStudent('${s.nisn}')" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs flex items-center gap-1">
                <i data-lucide="unlock" class="w-3 h-3"></i> Buka Kunci
              </button>
            ` : `
              <button onclick="proctor.warnStudent('${s.nisn}')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px]">
                Peringatan
              </button>
            `}
            <button onclick="proctor.resetStudentExam('${s.nisn}')" class="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px]">
              Reset
            </button>
          </div>
        </td>
      `;

      tbody.appendChild(tr);
    });

    if (window.lucide) lucide.createIcons();
    this.updateStats();
  }

  unlockStudent(nisn) {
    const student = this.students.find(s => s.nisn === nisn);
    if (student) {
      student.status = 'Mengerjakan';
      student.cheats = 0;
      this.renderMonitoringTable();

      // If active current user is this student, unlock their screen too!
      if (app.currentUser?.nisn === nisn) {
        lockdown.unlockFromProctor();
      }
      alert(`Akun siswa ${student.name} berhasil dibuka kuncinya oleh proktor.`);
    }
  }

  warnStudent(nisn) {
    const student = this.students.find(s => s.nisn === nisn);
    if (student) {
      student.cheats++;
      if (student.cheats >= 3) {
        student.status = 'Terkunci';
      }
      this.renderMonitoringTable();
      alert(`Peringatan pelanggaran telah dikirimkan ke siswa ${student.name}.`);
    }
  }

  resetStudentExam(nisn) {
    const student = this.students.find(s => s.nisn === nisn);
    if (student && confirm(`Apakah Anda yakin ingin me-reset pengerjaan ujian untuk siswa ${student.name}? Semua jawaban akan dihapus.`)) {
      student.progress = 0;
      student.cheats = 0;
      student.status = 'Mengerjakan';
      this.renderMonitoringTable();
      alert(`Ujian siswa ${student.name} telah di-reset.`);
    }
  }

  simulateActivity() {
    // Randomly update progress of active students
    this.students.forEach(s => {
      if (s.status === 'Mengerjakan') {
        if (s.progress < s.total && Math.random() > 0.3) {
          s.progress++;
          if (s.progress === s.total) {
            s.status = 'Selesai';
            this.results.push({
              rank: this.results.length + 1,
              name: s.name,
              nisn: s.nisn,
              correct: Math.floor(Math.random() * 5) + 15,
              wrong: Math.floor(Math.random() * 5),
              score: Math.floor(Math.random() * 20) + 75,
              status: 'Tuntas'
            });
          }
        }
      }
    });

    this.renderMonitoringTable();
    this.renderNilaiTable();
  }

  updateLiveStudentProgress(nisn, answered, total) {
    const student = this.students.find(s => s.nisn === nisn);
    if (student) {
      student.progress = answered;
      student.total = total;
      this.renderMonitoringTable();
    }
  }

  recordLiveStudentViolation(nisn, count, reason) {
    const student = this.students.find(s => s.nisn === nisn);
    if (student) {
      student.cheats = count;
      this.renderMonitoringTable();
    }
  }

  recordLiveStudentLockout(nisn) {
    const student = this.students.find(s => s.nisn === nisn);
    if (student) {
      student.status = 'Terkunci';
      student.cheats = 3;
      this.renderMonitoringTable();
    }
  }

  recordExamSubmission(nisn, data) {
    const student = this.students.find(s => s.nisn === nisn);
    if (student) {
      student.status = 'Selesai';
      student.progress = student.total;
    }

    this.results.push({
      rank: this.results.length + 1,
      name: data.name,
      nisn: data.nisn,
      correct: data.correct,
      wrong: data.wrong,
      score: data.score,
      status: data.score >= 75 ? 'Tuntas' : 'Remedial'
    });

    // Re-rank
    this.results.sort((a, b) => b.score - a.score);
    this.results.forEach((r, idx) => r.rank = idx + 1);

    this.renderMonitoringTable();
    this.renderNilaiTable();

    // Kirim ke database server jika aktif
    try {
      fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(() => {});
    } catch (e) {}
  }

  // Token Management
  renderTokenView() {
    const tokenEl = document.getElementById('proctor-active-token');
    const dashTokenEl = document.getElementById('dash-token-display');
    if (tokenEl) tokenEl.textContent = this.activeToken;
    if (dashTokenEl) dashTokenEl.textContent = this.activeToken;
  }

  generateNewToken() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.activeToken = res;
    this.renderTokenView();

    // Kirim ke server
    try {
      fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: this.activeToken })
      }).catch(() => {});
    } catch (e) {}

    alert(`Token ujian baru berhasil dirilis: ${this.activeToken}`);
  }

  // Question Bank
  renderQuestionBank() {
    const list = document.getElementById('admin-question-list') || document.getElementById('proctor-question-list');
    if (!list) return;

    list.innerHTML = '';
    const qList = (window.exam && window.exam.sampleQuestions) ? window.exam.sampleQuestions : [];
    qList.forEach((q, idx) => {
      const card = document.createElement('div');
      card.className = 'p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-4';
      card.innerHTML = `
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-bold">Nomor ${idx + 1}</span>
            <span class="text-xs text-slate-500 font-semibold">Kunci Jawaban: <strong class="text-emerald-700 font-bold">${q.correctKey}</strong></span>
          </div>
          <p class="text-xs font-semibold text-slate-800 leading-relaxed">${q.text}</p>
        </div>
        <button onclick="alert('Edit butir soal #` + (idx + 1) + `')" class="text-xs font-bold text-blue-600 hover:text-blue-800 shrink-0">Edit Soal</button>
      `;
      list.appendChild(card);
    });
  }

  addSampleQuestion() {
    const newQ = {
      id: (window.exam?.sampleQuestions?.length || 0) + 1,
      text: 'Berapakah hasil dari 15 × 8 ÷ 4 + 10?',
      options: { A: '35', B: '40', C: '45', D: '50', E: '55' },
      correctKey: 'B'
    };
    if (window.exam && window.exam.sampleQuestions) {
      window.exam.sampleQuestions.push(newQ);
    }
    this.renderQuestionBank();
    alert('Soal baru berhasil ditambahkan ke bank soal!');
  }

  // Master Data Siswa
  renderMasterSiswa() {
    const tbody = document.getElementById('proctor-master-siswa');
    if (!tbody) return;

    tbody.innerHTML = '';
    this.students.forEach((s, idx) => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50';
      tr.innerHTML = `
        <td class="py-3 px-4 font-bold text-slate-400">${idx + 1}</td>
        <td class="py-3 px-4 font-bold text-slate-800">${s.name}</td>
        <td class="py-3 px-4 font-mono text-slate-600">${s.nisn}</td>
        <td class="py-3 px-4 font-semibold text-slate-600">${s.kelas}</td>
        <td class="py-3 px-4 font-mono text-xs text-slate-500">${s.password}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  exportSiswaExcel() {
    let csv = 'No,Nama Siswa,NISN,Kelas,Kata Sandi\n';
    this.students.forEach((s, idx) => {
      csv += `${idx + 1},"${s.name}",${s.nisn},"${s.kelas}","${s.password}"\n`;
    });
    this.downloadFile(csv, 'Data_Peserta_LockExam.csv', 'text/csv');
  }

  // Rekap Nilai
  renderNilaiTable() {
    const tbody = document.getElementById('proctor-nilai-rows');
    if (!tbody) return;

    tbody.innerHTML = '';
    this.results.forEach((r) => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50';

      const isPass = r.score >= 75;
      tr.innerHTML = `
        <td class="py-3 px-4 font-black text-slate-700">#${r.rank}</td>
        <td class="py-3 px-4 font-bold text-slate-800">${r.name}</td>
        <td class="py-3 px-4 font-mono text-slate-500">${r.nisn}</td>
        <td class="py-3 px-4 font-bold text-emerald-600">${r.correct}</td>
        <td class="py-3 px-4 font-bold text-rose-500">${r.wrong}</td>
        <td class="py-3 px-4 font-black text-blue-700 text-sm">${r.score}</td>
        <td class="py-3 px-4">
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
            isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
          }">${isPass ? 'Tuntas' : 'Remedial'}</span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  exportNilaiExcel() {
    let csv = 'Peringkat,Nama Siswa,NISN,Jawaban Benar,Jawaban Salah,Nilai Akhir,Status KKM\n';
    this.results.forEach((r) => {
      csv += `${r.rank},"${r.name}",${r.nisn},${r.correct},${r.wrong},${r.score},"${r.status}"\n`;
    });
    this.downloadFile(csv, 'Rekap_Nilai_LockExam.csv', 'text/csv');
  }

  printReport() {
    const printWin = window.open('', '_blank');
    const html = `
      <html>
        <head>
          <title>Laporan Nilai Ujian LockExam</title>
          <style>
            body { font-family: sans-serif; padding: 24px; color: #1e293b; }
            .kop { border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 20px; text-align: center; }
            .kop h2 { margin: 0; font-size: 20px; text-transform: uppercase; }
            .kop p { margin: 4px 0 0 0; font-size: 13px; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
            th { background: #f1f5f9; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="kop">
            <h2>PEMERINTAH DAERAH DINAS PENDIDIKAN</h2>
            <h2>SMA NEGERI 1 TELADAN</h2>
            <p>Jalan Pendidikan No. 10 Jakarta &bull; NPSN: 10293847 &bull; Website: www.lockexam.online</p>
          </div>
          <h3 style="text-align:center;margin-bottom:4px;">REKAPITULASI HASIL UJIAN ONLINE</h3>
          <p style="text-align:center;font-size:12px;margin-top:0;">Mata Pelajaran: Matematika &bull; Tahun Ajaran 2026/2027</p>
          <table>
            <thead>
              <tr><th>Rank</th><th>Nama Siswa</th><th>NISN</th><th>Benar</th><th>Salah</th><th>Nilai</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${this.results.map(r => `
                <tr>
                  <td>#${r.rank}</td>
                  <td>${r.name}</td>
                  <td>${r.nisn}</td>
                  <td>${r.correct}</td>
                  <td>${r.wrong}</td>
                  <td><strong>${r.score}</strong></td>
                  <td>${r.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>window.onload = function(){ window.print(); }<\/script>
        </body>
      </html>
    `;
    printWin.document.write(html);
    printWin.document.close();
  }

  saveSettings() {
    app.settings.fullscreenLock = document.getElementById('set-fullscreen').checked;
    app.settings.blockShortcuts = document.getElementById('set-shortcuts').checked;
    app.settings.maxCheats = parseInt(document.getElementById('set-max-cheats').value, 10);
    app.settings.randomizeQuestions = document.getElementById('set-randomize').checked;
    app.settings.showScoreToStudent = document.getElementById('set-show-score').checked;

    alert('Pengaturan keamanan Kiosk LockExam berhasil disimpan!');
  }

  downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
}

const proctor = new ProctorControlCenter();
window.proctor = proctor;
