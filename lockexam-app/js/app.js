/**
 * LockExam Authentic Client Controller
 * Menyesuaikan struktur dan alur kerja asli https://lockexam.online
 */

class LockExamApp {
  constructor() {
    this.currentRole = 'siswa'; // 'siswa' | 'guru' | 'admin'
    this.currentUser = null;
    this.selectedSchool = null;
    this.currentSemester = '2026_genap';
    this.activeAuthTab = 'siswa'; // 'siswa' | 'admin'
    this.wizardCurrentStep = 1;

    this.defaultSchools = [
      { id: 'sch_1', nama: 'SMAN 1 Teladan Jakarta', npsn: '10293847', jenjang: 'SMA', kabkota: 'Kota Jakarta Pusat', adminEmail: 'proktor@sman1teladan.sch.id' },
      { id: 'sch_2', nama: 'SMK Teknologi & Informatika', npsn: '20384756', jenjang: 'SMK', kabkota: 'Kota Surabaya', adminEmail: 'admin@smkti.sch.id' },
      { id: 'sch_3', nama: 'SMP Negeri 5 Bintang Bangsa', npsn: '30495867', jenjang: 'SMP', kabkota: 'Kota Bandung', adminEmail: 'admin@smpn5.sch.id' },
      { id: 'sch_4', nama: 'MAN Insan Cendekia', npsn: '40586978', jenjang: 'SMA', kabkota: 'Kota Tangerang Selatan', adminEmail: 'proktor@manic.sch.id' },
    ];

    this.schools = [];

    this.settings = {
      fullscreenLock: true,
      maxCheats: 3,
      randomizeQuestions: true,
    };

    this.sampleExams = [
      {
        id: 'exam_1',
        title: 'Penilaian Akhir Semester (PAS)',
        subject: 'Matematika Wajib',
        class: 'XII MIPA 1',
        durationMinutes: 90,
        totalQuestions: 10,
        status: 'Aktif',
        description: 'Materi Ujian: Aljabar, Limit Fungsi, Turunan, dan Peluang.',
      },
      {
        id: 'exam_2',
        title: 'Asesmen Sumatif Tengah Semester',
        subject: 'Bahasa Indonesia',
        class: 'XII MIPA 1',
        durationMinutes: 60,
        totalQuestions: 10,
        status: 'Aktif',
        description: 'Materi Ujian: Teks Editorial, Sistematika Surat Lamaran, dan Kebahasaan.',
      },
      {
        id: 'exam_3',
        title: 'Tryout Simulasi Ujian Mandiri',
        subject: 'Ilmu Pengetahuan Alam',
        class: 'XII MIPA 1',
        durationMinutes: 45,
        totalQuestions: 10,
        status: 'Terjadwal',
        description: 'Simulasi latihan persiapan seleksi masuk perguruan tinggi.',
      }
    ];

    this.pendingExam = null;
  }

  async init() {
    await this.loadSchools();
    this.restoreLastSelectedSchool();

    // Sembunyikan boot screen seperti lockexam asli
    setTimeout(() => {
      const boot = document.getElementById('boot-screen');
      if (boot) {
        boot.style.opacity = '0';
        setTimeout(() => boot.classList.add('hidden'), 500);
      }
    }, 700);

    proctor.init();
    if (window.lucide) lucide.createIcons();
  }

  // Load schools from backend server API with fallback to localStorage
  async loadSchools() {
    try {
      const res = await fetch('/api/schools');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          this.schools = data;
          localStorage.setItem('lockexam-schools-data', JSON.stringify(data));
          return;
        }
      }
    } catch (e) {
      console.log('[LockExam] Mode lokal aktif');
    }

    const saved = localStorage.getItem('lockexam-schools-data');
    if (saved) {
      try {
        this.schools = JSON.parse(saved);
        return;
      } catch (e) {}
    }

    this.schools = [...this.defaultSchools];
  }

  // Switch Login Tab ("Siswa & Guru" vs "Admin Sekolah")
  switchTab(tab) {
    this.activeAuthTab = tab;
    this.hideError();

    const btnSiswa = document.getElementById('tab-btn-siswa-guru');
    const btnAdmin = document.getElementById('tab-btn-admin-sekolah');
    const schoolContainer = document.getElementById('field-sekolah-container');
    const labelIdentifier = document.getElementById('label-identifier');
    const inputIdentifier = document.getElementById('input-identifier');
    const iconIdentifier = document.getElementById('icon-identifier');
    const forgotLink = document.getElementById('link-forgot-password');
    const footerSiswa = document.getElementById('footer-link-siswa');
    const footerAdmin = document.getElementById('footer-link-admin');

    if (tab === 'siswa') {
      btnSiswa.className = 'py-2.5 rounded-xl font-bold text-xs transition-all text-blue-700 bg-white shadow-xs';
      btnAdmin.className = 'py-2.5 rounded-xl font-bold text-xs transition-all text-slate-500 hover:text-slate-800';

      schoolContainer.classList.remove('hidden');
      labelIdentifier.textContent = 'NISN / NIP';
      inputIdentifier.placeholder = 'Contoh: 1234567890 atau 1980...';
      inputIdentifier.value = '';
      iconIdentifier.setAttribute('data-lucide', 'user');
      forgotLink.classList.add('hidden');
      footerSiswa.classList.remove('hidden');
      footerAdmin.classList.add('hidden');
    } else {
      btnAdmin.className = 'py-2.5 rounded-xl font-bold text-xs transition-all text-blue-700 bg-white shadow-xs';
      btnSiswa.className = 'py-2.5 rounded-xl font-bold text-xs transition-all text-slate-500 hover:text-slate-800';

      schoolContainer.classList.add('hidden');
      labelIdentifier.textContent = 'Email sekolah';
      inputIdentifier.placeholder = 'admin@sekolah.sch.id';
      inputIdentifier.value = '';
      iconIdentifier.setAttribute('data-lucide', 'mail');
      forgotLink.classList.remove('hidden');
      footerSiswa.classList.add('hidden');
      footerAdmin.classList.remove('hidden');
    }

    if (window.lucide) lucide.createIcons();
  }

  // Autocomplete School Search
  searchSchools(query) {
    const dropdown = document.getElementById('school-search-dropdown');
    if (!dropdown) return;

    const q = query.trim().toLowerCase();
    if (q.length < 2) {
      dropdown.classList.add('hidden');
      return;
    }

    const matches = this.schools.filter(s => 
      s.nama.toLowerCase().includes(q) || 
      (s.npsn && s.npsn.includes(q))
    );

    dropdown.innerHTML = '';
    if (matches.length === 0) {
      dropdown.innerHTML = `<li class="cs-info">Sekolah tidak ditemukan. Pastikan sekolah sudah mendaftar di LockExam.</li>`;
    } else {
      matches.forEach(s => {
        const li = document.createElement('li');
        li.innerHTML = `
          <b>${s.nama}</b>
          <small>NPSN ${s.npsn} &bull; ${s.kabkota || s.jenjang || 'Indonesia'}</small>
        `;
        li.onclick = () => this.selectSchool(s);
        dropdown.appendChild(li);
      });
    }

    dropdown.classList.remove('hidden');
  }

  selectSchool(school) {
    this.selectedSchool = school;
    localStorage.setItem('lockexam-sekolah-terakhir', JSON.stringify(school));

    document.getElementById('school-search-dropdown')?.classList.add('hidden');
    document.getElementById('school-search-box')?.classList.add('hidden');

    const card = document.getElementById('school-selected-card');
    document.getElementById('sel-school-name').textContent = school.nama;
    document.getElementById('sel-school-npsn').textContent = `NPSN ${school.npsn} • ${school.kabkota || school.jenjang || 'Indonesia'}`;
    card?.classList.remove('hidden');
  }

  clearSchoolSelection() {
    this.selectedSchool = null;
    localStorage.removeItem('lockexam-sekolah-terakhir');

    document.getElementById('school-selected-card')?.classList.add('hidden');
    const searchBox = document.getElementById('school-search-box');
    searchBox?.classList.remove('hidden');
    const input = document.getElementById('school-search-input');
    if (input) {
      input.value = '';
      input.focus();
    }
  }

  restoreLastSelectedSchool() {
    try {
      const saved = localStorage.getItem('lockexam-sekolah-terakhir');
      if (saved) {
        const sch = JSON.parse(saved);
        this.selectSchool(sch);
      } else if (this.schools.length > 0) {
        this.selectSchool(this.schools[0]);
      }
    } catch (e) {}
  }

  togglePasswordEye() {
    const pw = document.getElementById('input-password');
    const eye = document.getElementById('eye-icon');
    if (pw) {
      const isPw = pw.type === 'password';
      pw.type = isPw ? 'text' : 'password';
      eye.setAttribute('data-lucide', isPw ? 'eye-off' : 'eye');
      if (window.lucide) lucide.createIcons();
    }
  }

  showError(msg) {
    const err = document.getElementById('login-error');
    const text = document.getElementById('login-error-text');
    if (err && text) {
      text.textContent = msg;
      err.classList.remove('hidden');
    }
  }

  hideError() {
    document.getElementById('login-error')?.classList.add('hidden');
  }

  // Quick Demo fill buttons
  quickFill(role) {
    if (role === 'siswa') {
      this.switchTab('siswa');
      if (!this.selectedSchool) this.selectSchool(this.schools[0]);
      document.getElementById('input-identifier').value = '1234567890';
      document.getElementById('input-password').value = 'siswa';
    } else if (role === 'guru') {
      this.switchTab('siswa');
      if (!this.selectedSchool) this.selectSchool(this.schools[0]);
      document.getElementById('input-identifier').value = '198001012005011001';
      document.getElementById('input-password').value = 'guru123';
    } else {
      this.switchTab('admin');
      document.getElementById('input-identifier').value = 'proktor@sman1teladan.sch.id';
      document.getElementById('input-password').value = 'admin123';
    }
  }

  // Handle Login Authentication Submit
  handleAuthSubmit(e) {
    e.preventDefault();
    this.hideError();

    const identifier = document.getElementById('input-identifier').value.trim();
    const password = document.getElementById('input-password').value;
    const semester = document.getElementById('select-semester').value;
    this.currentSemester = semester;

    if (this.activeAuthTab === 'siswa') {
      if (!this.selectedSchool) {
        this.showError('Pilih sekolah Anda terlebih dahulu: ketik nama sekolah atau NPSN.');
        return;
      }

      // Check if Guru (starts with 19 or role) or Siswa
      if (identifier.startsWith('19') || identifier === 'guru') {
        // Log in as Guru / Proktor
        this.currentUser = {
          name: 'Budi Santoso, S.Pd',
          nip: identifier,
          role: 'Guru Mata Pelajaran',
          school: this.selectedSchool.nama
        };
        this.currentRole = 'guru';
        this.showAdminApp();
      } else {
        // Log in as Siswa
        this.currentUser = {
          name: 'Ahmad Fauzi',
          nisn: identifier,
          kelas: 'XII MIPA 1',
          school: this.selectedSchool.nama
        };
        this.currentRole = 'siswa';
        this.showSiswaDashboard();
      }
    } else {
      // Log in as Admin Sekolah
      const school = this.schools.find(s => s.adminEmail?.toLowerCase() === identifier.toLowerCase()) || this.selectedSchool || this.schools[0];
      this.currentUser = {
        name: 'Admin Utama Sekolah',
        email: identifier,
        role: 'Administrator Sekolah',
        school: school.nama
      };
      this.currentRole = 'admin';
      this.selectedSchool = school;
      this.showAdminApp();
    }
  }

  // View Switchers
  showLoginView() {
    this.hideAllViews();
    document.getElementById('view-login')?.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  }

  showRegisterWizard() {
    this.hideAllViews();
    this.wizardCurrentStep = 1;
    this.updateWizardUI();
    document.getElementById('view-daftar-sekolah')?.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  }

  showAdminApp() {
    this.hideAllViews();
    const appView = document.getElementById('view-admin-app');
    document.getElementById('app-school-label').textContent = this.currentUser.school;
    document.getElementById('app-user-name').textContent = this.currentUser.name;
    document.getElementById('app-user-role').textContent = this.currentUser.role;

    appView?.classList.remove('hidden');
    proctor.openTab('dashboard');
    if (window.lucide) lucide.createIcons();
  }

  showSiswaDashboard() {
    this.hideAllViews();
    const siswaView = document.getElementById('view-siswa-dashboard');
    document.getElementById('siswa-header-name').textContent = this.currentUser.name;
    document.getElementById('siswa-header-class').textContent = `Kelas ${this.currentUser.kelas}`;
    document.getElementById('siswa-header-school').textContent = this.currentUser.school;

    this.renderSiswaExams();
    siswaView?.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  }

  hideAllViews() {
    document.querySelectorAll('.view-screen').forEach(v => v.classList.add('hidden'));
  }

  // 3-Step Wizard Registration
  wizardNext() {
    if (this.wizardCurrentStep === 1) {
      const nama = document.getElementById('reg-nama').value.trim();
      const npsn = document.getElementById('reg-npsn').value.trim();
      if (!nama || npsn.length !== 8) {
        alert('Mohon isi nama sekolah dan NPSN (tepat 8 angka).');
        return;
      }
      this.wizardCurrentStep = 2;
    } else if (this.wizardCurrentStep === 2) {
      this.wizardCurrentStep = 3;
    }
    this.updateWizardUI();
  }

  wizardPrev() {
    if (this.wizardCurrentStep > 1) {
      this.wizardCurrentStep--;
      this.updateWizardUI();
    }
  }

  updateWizardUI() {
    for (let i = 1; i <= 3; i++) {
      const stepPill = document.getElementById(`wizard-step-${i}`);
      const stepContent = document.getElementById(`step-content-${i}`);
      if (i === this.wizardCurrentStep) {
        stepPill?.classList.add('active');
        stepPill?.classList.remove('done');
        stepContent?.classList.remove('hidden');
      } else if (i < this.wizardCurrentStep) {
        stepPill?.classList.remove('active');
        stepPill?.classList.add('done');
        stepContent?.classList.add('hidden');
      } else {
        stepPill?.classList.remove('active', 'done');
        stepContent?.classList.add('hidden');
      }
    }

    const btnPrev = document.getElementById('btn-wizard-prev');
    const btnNext = document.getElementById('btn-wizard-next');
    const btnSubmit = document.getElementById('btn-wizard-submit');

    if (this.wizardCurrentStep === 1) {
      btnPrev?.classList.add('hidden');
      btnNext?.classList.remove('hidden');
      btnSubmit?.classList.add('hidden');
    } else if (this.wizardCurrentStep === 2) {
      btnPrev?.classList.remove('hidden');
      btnNext?.classList.remove('hidden');
      btnSubmit?.classList.add('hidden');
    } else {
      btnPrev?.classList.remove('hidden');
      btnNext?.classList.add('hidden');
      btnSubmit?.classList.remove('hidden');
    }
  }

  async handleWizardSubmit(e) {
    e.preventDefault();
    const nama = document.getElementById('reg-nama').value.trim();
    const npsn = document.getElementById('reg-npsn').value.trim();
    const jenjang = document.getElementById('reg-jenjang').value;
    const kabkota = document.getElementById('reg-kabkota').value.trim() || 'Indonesia';
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const ulang = document.getElementById('reg-ulang-password').value;

    if (password !== ulang) {
      alert('Kata sandi dan konfirmasi kata sandi tidak cocok!');
      return;
    }

    const newSchool = {
      id: `sch_${Date.now()}`,
      nama,
      npsn,
      jenjang,
      kabkota,
      adminEmail: email,
      createdAt: new Date().toISOString()
    };

    // Save to list
    this.schools.push(newSchool);
    localStorage.setItem('lockexam-schools-data', JSON.stringify(this.schools));

    // Save to backend database server
    try {
      await fetch('/api/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchool)
      });
    } catch (e) {}

    alert(`Selamat! Sekolah "${nama}" berhasil didaftarkan di LockExam. Silakan masuk menggunakan akun admin.`);
    this.selectSchool(newSchool);
    this.showLoginView();
    this.switchTab('admin');
    document.getElementById('input-identifier').value = email;
  }

  showForgotModal() {
    alert('Silakan hubungi administrator sekolah Anda untuk mereset kata sandi.');
  }

  // Render Student Exams
  renderSiswaExams() {
    const grid = document.getElementById('siswa-exam-grid');
    if (!grid) return;

    grid.innerHTML = '';
    this.sampleExams.forEach((ex) => {
      const card = document.createElement('div');
      card.className = 'bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between';
      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              ex.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }">${ex.status}</span>
            <span class="text-xs font-bold text-blue-700">${ex.class}</span>
          </div>
          <h3 class="text-base font-black text-slate-800">${ex.title}</h3>
          <div class="text-xs font-bold text-blue-600 mt-0.5 mb-2">${ex.subject}</div>
          <p class="text-xs text-slate-500 mb-4">${ex.description}</p>
          <div class="flex items-center gap-4 text-xs font-semibold text-slate-600 py-2 border-y border-slate-100 mb-5">
            <span class="flex items-center gap-1.5"><i data-lucide="clock" class="w-3.5 h-3.5 text-slate-400"></i> ${ex.durationMinutes} Menit</span>
            <span class="flex items-center gap-1.5"><i data-lucide="help-circle" class="w-3.5 h-3.5 text-slate-400"></i> ${ex.totalQuestions} Soal PG</span>
          </div>
        </div>
        <button onclick="app.openExamModal('${ex.id}')" class="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-700/20 flex items-center justify-center gap-2">
          <i data-lucide="lock" class="w-4 h-4"></i> Masuk Ujian
        </button>
      `;
      grid.appendChild(card);
    });
    if (window.lucide) lucide.createIcons();
  }

  // Open Gate Confirmation Screen (Persis Siswa Chunk LockExam)
  openExamModal(examId) {
    const ex = this.sampleExams.find(e => e.id === examId) || this.sampleExams[0];
    this.pendingExam = ex;

    document.getElementById('gate-school-title').textContent = this.currentUser?.school || 'LockExam';
    document.getElementById('gate-exam-title').textContent = `${ex.title} - ${ex.subject}`;
    document.getElementById('gate-student-av').textContent = (this.currentUser?.name || 'S').charAt(0).toUpperCase();
    document.getElementById('gate-student-name').textContent = this.currentUser?.name || 'Ahmad Fauzi';
    document.getElementById('gate-student-nisn').textContent = `NISN: ${this.currentUser?.nisn || '1234567890'}`;
    document.getElementById('gate-exam-duration').textContent = `${ex.durationMinutes} menit`;
    document.getElementById('gate-exam-questions').textContent = `${ex.totalQuestions} soal`;
    document.getElementById('gate-token-input').value = '';

    this.hideAllViews();
    document.getElementById('view-exam-gate')?.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  }

  startRealExam() {
    const token = document.getElementById('gate-token-input').value.trim().toUpperCase();
    if (!token) {
      alert('Masukkan kode token ujian dari proktor.');
      return;
    }

    if (token !== proctor.activeToken) {
      alert(`Token ujian salah! Token aktif di ruang kelas adalah "${proctor.activeToken}".`);
      return;
    }

    this.hideAllViews();
    document.getElementById('view-exam-room')?.classList.remove('hidden');

    exam.startExam(this.pendingExam || this.sampleExams[0], exam.sampleQuestions);
  }

  showResultScreen(score, correct, wrong, examData) {
    this.hideAllViews();
    const resultView = document.getElementById('view-exam-result');

    document.getElementById('result-title').textContent = examData?.title || 'Penilaian Akhir Semester';
    document.getElementById('result-mapel').textContent = examData?.subject || 'Matematika Wajib';
    document.getElementById('result-score-val').textContent = score;
    document.getElementById('result-correct').textContent = `${correct} Soal`;
    document.getElementById('result-wrong').textContent = `${wrong} Soal`;

    // SVG Circular Ring Animation (k = 2 * PI * 54 = 339.29)
    const circle = document.getElementById('result-circle-fg');
    if (circle) {
      const k = 339.29;
      circle.style.strokeDashoffset = k;
      setTimeout(() => {
        circle.style.strokeDashoffset = k * (1 - Math.min(score, 100) / 100);
      }, 100);
    }

    resultView?.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  }

  logout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      lockdown.stop();
      this.currentUser = null;
      this.showLoginView();
    }
  }
}

const app = new LockExamApp();
window.app = app;

window.addEventListener('DOMContentLoaded', () => {
  app.init();
});
