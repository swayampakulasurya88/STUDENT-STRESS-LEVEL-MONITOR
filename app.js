/* =========================================================
   DATA LAYER — localStorage-backed "database"
   ========================================================= */
const DB_KEY = 'ssm_db_v2';
const SESSION_KEY = 'ssm_session_v1';

/* =========================================================
   CONFIG
   This app ships as a single static HTML file with no build step,
   so there is no real .env — this object is the one place to change
   deployment-specific values. In a hosted build, populate these from
   real environment variables at build/deploy time instead of editing
   this file directly.
   ========================================================= */
const CONFIG = {
  supportEmail: (window.CALM_COMPASS_SUPPORT_EMAIL || 'support@calmcompass.example'),
  institutionName: (window.CALM_COMPASS_INSTITUTION || 'your institution'),
};

/* dark-theme chart defaults so every Chart.js canvas stays readable */
if (typeof Chart !== 'undefined') {
  Chart.defaults.color = '#64748B';
  Chart.defaults.borderColor = 'rgba(0,0,0,0.06)';
  Chart.defaults.font.family = "'Manrope', 'Segoe UI', sans-serif";
}

/* NOTE on password storage: hashPw() below is a lightweight, reversible
   obfuscation (Base64), NOT a cryptographic hash. It exists only so this
   demo never stores plain-text passwords in localStorage in an obviously
   readable form. This is a client-only academic demo with no server —
   a production deployment must hash passwords server-side with a proper
   algorithm (e.g. bcrypt/argon2) and never evaluate auth in the browser. */

const QUOTES = [
  "Progress, not perfection.",
  "You don't have to carry it all today.",
  "Small consistent steps beat one big push.",
  "Rest is part of the work, not a break from it.",
  "One hard week doesn't define the semester.",
  "Ask for help before you need it, not after.",
  "Your worth isn't your GPA.",
  "Breathe. This moment is manageable."
];

/** Wraps a password <input> with a show/hide toggle button. Safe to call
 *  more than once on the same field (e.g. after a re-render) — it no-ops
 *  if the wrapper already exists. */
function addPwToggle(inputId){
  const input = document.getElementById(inputId);
  if(!input || (input.parentElement && input.parentElement.classList.contains('pw-field'))) return;
  const wrap = document.createElement('div');
  wrap.className = 'pw-field';
  input.parentNode.insertBefore(wrap, input);
  wrap.appendChild(input);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'pw-toggle';
  btn.setAttribute('aria-label','Show password');
  btn.innerHTML = '<i class="fa-solid fa-eye" aria-hidden="true"></i>';
  btn.addEventListener('click', () => {
    const nowShowing = input.type === 'text';
    input.type = nowShowing ? 'password' : 'text';
    btn.setAttribute('aria-label', nowShowing ? 'Show password' : 'Hide password');
    btn.innerHTML = nowShowing ? '<i class="fa-solid fa-eye" aria-hidden="true"></i>' : '<i class="fa-solid fa-eye-slash" aria-hidden="true"></i>';
  });
  wrap.appendChild(btn);
}

/** Reusable crisis-support component. Shown on the assessment and result
 *  pages. Never claims to monitor anyone in real time — it points to real
 *  human help. */
function renderCrisisHelp(){
  return `
    <div class="crisis-box" role="note" aria-label="Crisis support information">
      <i class="fa-solid fa-life-ring crisis-icon" aria-hidden="true"></i>
      <div>
        <h6 class="fw-bold mb-1">If you're in danger or crisis right now</h6>
        <p class="small mb-2" style="color:#B91C1C;">
          Calm Compass is an awareness tool, not an emergency or monitoring service — no one is watching this in real time.
          If you feel unsafe or are thinking about harming yourself, please contact local emergency services right away,
          or reach out immediately to a trusted person, a doctor, or ${CONFIG.institutionName}'s counselling service.
        </p>
        <button type="button" class="btn-crisis" onclick="Router.go('about')">
          <i class="fa-solid fa-hand-holding-heart me-1" aria-hidden="true"></i>Talk to someone / get support options
        </button>
      </div>
    </div>`;
}

function uid(prefix){ return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
/** Escapes user-supplied free text (e.g. the optional check-in reflection)
 *  before it's inserted via innerHTML, so a student's own words can never
 *  break out of the markup they're rendered into. */
function escapeHtml(str){
  return String(str || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function hashPw(pw){ return btoa(unescape(encodeURIComponent('ssm::'+pw))); }
function todayISO(){ return new Date().toISOString().slice(0,10); }
function renderSubjectsUsed(targetId){
  document.getElementById(targetId).innerHTML = `
    <h4 class="font-display mb-1">Subjects &amp; Technologies Used</h4>
    <p class="text-muted small mb-4" style="max-width:640px;">A quick map of the academic subjects and technologies that went into building Calm Compass.</p>
    <div class="row g-3">
      <div class="col-md-4"><div class="card-cc h-100"><div class="icon-tile"><i class="fa-solid fa-code"></i></div><h6 class="fw-bold">Web Programming</h6><p class="small text-muted mb-0">HTML5, CSS3, Bootstrap 5 and JavaScript for structure, styling and interactivity.</p></div></div>
      <div class="col-md-4"><div class="card-cc h-100"><div class="icon-tile"><i class="fa-solid fa-c"></i></div><h6 class="fw-bold">Programming Fundamentals (C)</h6><p class="small text-muted mb-0">Variables, conditionals, loops and modular functions — the same building blocks from C carried into the JavaScript logic here.</p></div></div>
      <div class="col-md-4"><div class="card-cc h-100"><div class="icon-tile"><i class="fa-solid fa-diagram-project"></i></div><h6 class="fw-bold">Data Structures</h6><p class="small text-muted mb-0">Arrays, structure-like objects, searching and sorting power every list, table and report on this site.</p></div></div>
      <div class="col-md-4"><div class="card-cc h-100"><div class="icon-tile"><i class="fa-solid fa-database"></i></div><h6 class="fw-bold">DBMS Concepts</h6><p class="small text-muted mb-0">Browser local storage plays the role of a database: structured records, CRUD operations and relationships between students, departments and assessments.</p></div></div>
      <div class="col-md-4"><div class="card-cc h-100"><div class="icon-tile"><i class="fa-solid fa-cubes"></i></div><h6 class="fw-bold">Object-Oriented Concepts</h6><p class="small text-muted mb-0">Store, Router, StudentUI, TeacherUI and AdminUI are self-contained objects that bundle data with the behaviour that acts on it.</p></div></div>
      <div class="col-md-4"><div class="card-cc h-100"><div class="icon-tile"><i class="fa-solid fa-chart-simple"></i></div><h6 class="fw-bold">Statistics</h6><p class="small text-muted mb-0">Averages, percentages and score distributions drive the dashboards and exported reports.</p></div></div>
    </div>
    <div class="mt-4 mb-5">
      <button class="btn-cc-outline btn-sm" onclick="Router.go('cds')"><i class="fa-solid fa-arrow-up-right-from-square me-1"></i>See exactly what C &amp; Data Structures concepts were used</button>
    </div>

    <h4 class="font-display mb-1 mt-2">Cross-Subject Mini-Project Alignment</h4>
    <p class="text-muted small mb-3" style="max-width:640px;">How this project's core idea combines multiple semesters' subjects into one AI-assisted mini-project, mapped to the R23 curriculum.</p>
    <div class="table-responsive table-cc">
      <table class="table mb-0">
        <thead>
          <tr>
            <th>Combined Subjects</th>
            <th>Topics Integrated</th>
            <th>AI/LLM Layer</th>
            <th>Coding Framework</th>
            <th>Mini-Project Outcome</th>
            <th>R23 Alignment</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="small fw-bold">Data Structures + Linear Algebra + Programming</td>
            <td class="small">Queues, Matrices, Sorting</td>
            <td class="small">AI suggests optimal schedule adjustments</td>
            <td class="small">Python + Constraint logic (simple)</td>
            <td class="small">Console app: Input classes &rarr; detect/resolve conflicts</td>
            <td class="small">Sem-II DS + Sem-I Math</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

/* Each question belongs to one of 5 wellbeing domains. This groups the
   same 20 questions into sections on the check-in and gives the result
   page a domain-by-domain breakdown, without changing the overall
   0–80 scoring model. */
const DOMAINS = ['Sleep','Academic workload','Focus','Mood','Social connection'];
const DOMAIN_ICONS = {
  'Sleep':'fa-bed', 'Academic workload':'fa-book', 'Focus':'fa-crosshairs',
  'Mood':'fa-face-flushed', 'Social connection':'fa-people-group'
};
const QUESTION_BANK = [
  { text:"I feel anxious before exams.", domain:'Mood' },
  { text:"I have trouble sleeping.", domain:'Sleep' },
  { text:"I often feel mentally exhausted.", domain:'Sleep' },
  { text:"I find it difficult to concentrate.", domain:'Focus' },
  { text:"I feel pressure from academic work.", domain:'Academic workload' },
  { text:"I feel lonely.", domain:'Social connection' },
  { text:"I worry about my future.", domain:'Mood' },
  { text:"I feel overwhelmed with assignments.", domain:'Academic workload' },
  { text:"I avoid social interactions.", domain:'Social connection' },
  { text:"I frequently feel stressed.", domain:'Mood' },
  { text:"I feel irritated easily.", domain:'Mood' },
  { text:"I have headaches or body aches that I link to stress.", domain:'Sleep' },
  { text:"I feel unmotivated to study.", domain:'Focus' },
  { text:"I compare myself negatively to other students.", domain:'Social connection' },
  { text:"I feel like I don't have enough time to relax.", domain:'Academic workload' },
  { text:"I feel nervous about my grades.", domain:'Academic workload' },
  { text:"I skip meals because of stress or workload.", domain:'Academic workload' },
  { text:"I feel like I can't cope with my responsibilities.", domain:'Focus' },
  { text:"I have racing thoughts I find hard to control.", domain:'Focus' },
  { text:"I feel physically tense (shoulders, jaw, or stomach).", domain:'Sleep' }
];

const SCHEMA_VERSION = 2;

function seedDB(){
  const db = {
    schemaVersion: SCHEMA_VERSION,
    students: [],
    teachers: [
      { id: uid('t'), name:'Ramki', email:'Ramki', passwordHash: hashPw('Ramki@123') }
    ],
    admin: [ { username:'admin', passwordHash: hashPw('admin@123') } ],
    departments: [
      {id: uid('d'), name:'Computer Science'},
      {id: uid('d'), name:'Electronics & Comm.'},
      {id: uid('d'), name:'Mechanical'},
      {id: uid('d'), name:'Civil'},
      {id: uid('d'), name:'Information Technology'}
    ],
    questions: QUESTION_BANK.map(q => ({ id: uid('q'), text: q.text, domain: q.domain })),
    assessments: [],
    recommendations: [],
    notifications: [],
    auditLog: []
  };
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  return db;
}

/** Fills in any fields missing from an older/partial database object,
 *  so imports or interrupted saves never crash the app. */
function normalizeDB(db){
  const fallback = {
    schemaVersion: SCHEMA_VERSION, students:[], teachers:[], admin:[],
    departments:[], questions:[], assessments:[], recommendations:[], notifications:[], auditLog:[]
  };
  const merged = Object.assign({}, fallback, db || {});
  merged.schemaVersion = SCHEMA_VERSION;
  merged.questions = (merged.questions || []).map(q => ({ domain:'General', ...q }));
  merged.auditLog = merged.auditLog || [];
  return merged;
}

/** Appends an entry to the audit log (capped to the most recent 500
 *  entries) and saves it. Used for sensitive staff/admin actions:
 *  viewing an individual student's detail, exporting data, editing
 *  accounts, and restoring a backup. */
function logAudit(db, actorRole, actorLabel, action, detail){
  db.auditLog = db.auditLog || [];
  db.auditLog.push({
    id: uid('log'),
    at: new Date().toISOString(),
    actorRole, actorLabel,
    action, detail: detail || ''
  });
  if(db.auditLog.length > 500) db.auditLog = db.auditLog.slice(-500);
}

const Store = {
  db(){
    let raw;
    try{ raw = localStorage.getItem(DB_KEY); }catch(e){ console.error('Storage read failed', e); return seedDB(); }
    if(!raw){ return seedDB(); }
    try{
      const parsed = JSON.parse(raw);
      return normalizeDB(parsed);
    }catch(e){
      console.error('Corrupt local database, reseeding', e);
      return seedDB();
    }
  },
  save(db){
    db.schemaVersion = SCHEMA_VERSION;
    db.lastSavedAt = new Date().toISOString();
    try{
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      return true;
    }catch(e){
      console.error('Storage write failed', e);
      toast('Could not save — storage may be full. Export a backup and clear old data.', 'danger');
      return false;
    }
  },
  session(){
    let raw;
    try{ raw = localStorage.getItem(SESSION_KEY); }catch(e){ return null; }
    return raw ? JSON.parse(raw) : null;
  },
  setSession(s){ localStorage.setItem(SESSION_KEY, JSON.stringify(s)); },
  clearSession(){ localStorage.removeItem(SESSION_KEY); },
  exportJSON(){
    return JSON.stringify(this.db(), null, 2);
  },
  importJSON(str){
    let parsed;
    try{ parsed = JSON.parse(str); }
    catch(e){ throw new Error('That file is not valid JSON.'); }
    if(!parsed || !Array.isArray(parsed.students)){ throw new Error('That file does not look like a Calm Compass backup.'); }
    this.save(normalizeDB(parsed));
  }
};

function categoryFor(score, max){
  // Four proportional bands (25% / 50% / 75% of max). Defaults to the classic
  // 0–80 model (20 questions) and scales if the admin changes question count.
  max = max || 80;
  if(score <= max*0.25) return 'Low';
  if(score <= max*0.5) return 'Moderate';
  if(score <= max*0.75) return 'High';
  return 'Very High';
}
function chipClass(cat){
  return {Low:'chip-low', Moderate:'chip-mod', High:'chip-high', 'Very High':'chip-vhigh'}[cat] || 'chip-low';
}
/** Current max possible score = number of questions × 4 (each scores 0–4).
 *  20 seeded questions → 80, and it adjusts automatically if an admin
 *  adds or removes questions. */
function maxScore(){
  return Store.db().questions.length * 4;
}
function recommendationsFor(cat){
  const map = {
    Low: [
      "Keep up your current routine — whatever you're doing is working.",
      "Maintain consistent sleep and light exercise to stay ahead of exam-season pressure.",
      "Consider mentoring a peer who's struggling — teaching reinforces your own calm."
    ],
    Moderate: [
      "Break large assignments into smaller blocks with short breaks between them.",
      "Try a 10-minute wind-down routine before bed to protect your sleep.",
      "Talk to a friend or family member about what's on your plate this week."
    ],
    High: [
      "Reach out to your class counselor this week for a short check-in.",
      "Reduce commitments where possible for the next two weeks and prioritize sleep.",
      "Practice a daily 5-minute breathing exercise — regularity matters more than length."
    ],
    'Very High': [
      "Please book time with your institution's counseling cell as soon as possible.",
      "Talk to a trusted teacher, mentor, or family member about how you're feeling today.",
      "If you feel unsafe or in crisis, contact local emergency services or a crisis helpline immediately."
    ]
  };
  return map[cat] || map['Low'];
}

/* =========================================================
   SELF-TESTS
   Lightweight, dependency-free assertions the Admin "System Tests"
   tab runs live in the browser. This is a single static HTML file
   with no package.json/build step, so there's no separate test
   runner to invoke — these functions play that role and can also
   be run from the browser console via runSelfTests().
   ========================================================= */
function runSelfTests(){
  const results = [];
  function check(name, condition, detail){
    results.push({ name, pass: !!condition, detail: detail || (condition ? 'OK' : 'Assertion failed') });
  }

  // --- Scoring / categorisation ---
  check('categoryFor: lower boundary (0)', categoryFor(0)==='Low', 'categoryFor(0) = '+categoryFor(0));
  check('categoryFor: Low/Moderate boundary', categoryFor(20)==='Low' && categoryFor(21)==='Moderate', '20→'+categoryFor(20)+', 21→'+categoryFor(21));
  check('categoryFor: Moderate/High boundary', categoryFor(40)==='Moderate' && categoryFor(41)==='High', '40→'+categoryFor(40)+', 41→'+categoryFor(41));
  check('categoryFor: High/Very High boundary', categoryFor(60)==='High' && categoryFor(61)==='Very High', '60→'+categoryFor(60)+', 61→'+categoryFor(61));
  check('categoryFor: upper boundary (80)', categoryFor(80)==='Very High', 'categoryFor(80) = '+categoryFor(80));
  check('recommendationsFor: always returns a non-empty list', ['Low','Moderate','High','Very High'].every(c=>recommendationsFor(c).length>0), 'checked all 4 bands');

  // --- Question bank integrity ---
  check('Question bank has exactly 20 questions', QUESTION_BANK.length===20, 'length = '+QUESTION_BANK.length);
  check('Every question has one of the 5 domains', QUESTION_BANK.every(q=>DOMAINS.includes(q.domain)), 'domains: '+[...new Set(QUESTION_BANK.map(q=>q.domain))].join(', '));

  // --- Password hashing (demo-level, see note near hashPw) ---
  check('hashPw: same input hashes identically', hashPw('Test@123')===hashPw('Test@123'));
  check('hashPw: different input hashes differently', hashPw('Test@123')!==hashPw('Different@123'));
  check('hashPw: does not store the raw password string', hashPw('Test@123').indexOf('Test@123')===-1, 'stored value does not contain the plain password');

  // --- Role-based route guards (Router.resolveView is a pure function) ---
  check('Guard: no session → protected view redirects to login',
    Router.resolveView('student', null).view === 'login');
  check('Guard: student session can reach the student view',
    Router.resolveView('student', {role:'student', id:'x'}).view === 'student' && !Router.resolveView('student', {role:'student', id:'x'}).redirected);
  check('Guard: student session cannot reach the admin view',
    Router.resolveView('admin', {role:'student', id:'x'}).view === 'student');
  check('Guard: teacher session cannot reach the student view',
    Router.resolveView('student', {role:'teacher', id:'x'}).view === 'teacher');
  check('Guard: public views need no session',
    !Router.resolveView('landing', null).redirected && !Router.resolveView('privacy', null).redirected);

  return results;
}

/* =========================================================
   TOAST
   ========================================================= */
function toast(msg, type){
  type = type || 'primary';
  const el = document.createElement('div');
  el.className = 'toast align-items-center text-white border-0 show mb-2';
  el.style.background = ({primary:'#0D9488',success:'#16A34A',danger:'#DC2626',warning:'#D97706'})[type] || '#0D9488';
  el.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.closest('.toast').remove()"></button></div>`;
  document.getElementById('toastHost').appendChild(el);
  setTimeout(()=>el.remove(), 3500);
}

/* =========================================================
   ROUTER
   ========================================================= */
const Router = {
  // Views that require a signed-in session, and the role each one is restricted to.
  protectedRoles: { student:'student', teacher:'teacher', admin:'admin' },
  publicInfoViews: ['landing','about','privacy','cds'],
  /** Pure function: given a requested view and the current session, returns the
   *  view that should actually be shown. Kept side-effect-free (no DOM, no toast)
   *  so it can be unit-tested directly by runSelfTests(). */
  resolveView(view, session){
    const requiredRole = this.protectedRoles[view];
    if(!requiredRole) return { view, redirected:false };
    if(!session) return { view:'login', redirected:true, reason:'not-signed-in' };
    if(session.role !== requiredRole) return { view:session.role, redirected:true, reason:'wrong-role' };
    return { view, redirected:false };
  },
  go(view){
    // Server-style guard: block direct navigation to a role dashboard unless the
    // session role matches. In a real deployment this check is re-enforced by the
    // backend on every API call — this client check only protects the UI route.
    const resolved = this.resolveView(view, Store.session());
    if(resolved.redirected){
      toast(resolved.reason==='not-signed-in' ? 'Please log in to continue.' : "That area isn't available for your account type.", 'warning');
    }
    view = resolved.view;
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    document.getElementById('view-'+view).classList.add('active');
    document.getElementById('footerBar').style.display = this.publicInfoViews.includes(view) ? 'block' : 'none';
    window.scrollTo(0,0);
    NavUI.render();
    if(view==='student') StudentUI.tab('s-dash', document.querySelector('#view-student .side-link'));
    if(view==='teacher') TeacherUI.tab('t-dash', document.querySelector('#view-teacher .side-link'));
    if(view==='admin') AdminUI.tab('a-dash', document.querySelector('#view-admin .side-link'));
  }
};

const NavUI = {
  render(){
    const s = Store.session();
    const box = document.getElementById('navRight');
    if(!s){
      box.innerHTML = `
        <button class="btn-cc-ghost" onclick="Router.go('login')">Log in</button>
        <button class="btn-cc-primary" onclick="Router.go('register')">Register</button>`;
      return;
    }
    let label = '';
    if(s.role==='student'){ const st = Store.db().students.find(x=>x.id===s.id); label = st ? st.name : 'Student'; }
    if(s.role==='teacher'){ const t = Store.db().teachers.find(x=>x.id===s.id); label = t ? t.name : 'Teacher'; }
    if(s.role==='admin'){ label = 'Admin'; }
    box.innerHTML = `
      <span class="small fw-bold text-muted d-none d-sm-inline">${escapeHtml(label)} · <span class="text-capitalize">${escapeHtml(s.role)}</span></span>
      <button class="btn-cc-outline" onclick="Auth.logout()"><i class="fa-solid fa-right-from-bracket me-1"></i>Log out</button>`;
  }
};

/* =========================================================
   AUTH
   ========================================================= */
const Auth = {
  loginRole: 'student',
  setLoginRole(role, el){
    this.loginRole = role;
    document.querySelectorAll('.role-tab').forEach(t=>t.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('loginIdLabel').textContent = role==='student' ? 'Student ID or Email' : (role==='teacher' ? 'Username' : 'Username');
    document.getElementById('loginError').textContent='';
  },
  login(e){
    e.preventDefault();
    const id = document.getElementById('loginId').value.trim();
    const pw = document.getElementById('loginPw').value;
    const db = Store.db();
    const errEl = document.getElementById('loginError');
    if(this.loginRole==='student'){
      const st = db.students.find(s => s.studentId.toLowerCase()===id.toLowerCase() || s.email.toLowerCase()===id.toLowerCase());
      if(!st || st.passwordHash !== hashPw(pw)){ errEl.textContent='Invalid ID or password.'; return false; }
      Store.setSession({role:'student', id: st.id});
      toast('Welcome back, '+escapeHtml(st.name.split(' ')[0])+'!','success');
      Router.go('student');
    } else if(this.loginRole==='teacher'){
      const t = db.teachers.find(x=>x.email.toLowerCase()===id.toLowerCase());
      if(!t || t.passwordHash !== hashPw(pw)){ errEl.textContent='Invalid email or password.'; return false; }
      Store.setSession({role:'teacher', id: t.id});
      logAudit(db, 'teacher', t.name, 'Signed in'); Store.save(db);
      toast('Welcome back, '+escapeHtml(t.name.split(' ')[0])+'!','success');
      Router.go('teacher');
    } else {
      const a = db.admin.find(x=>x.username.toLowerCase()===id.toLowerCase());
      if(!a || a.passwordHash !== hashPw(pw)){ errEl.textContent='Invalid username or password.'; return false; }
      Store.setSession({role:'admin', id:'admin'});
      logAudit(db, 'admin', 'Admin', 'Signed in'); Store.save(db);
      toast('Welcome back, Admin!','success');
      Router.go('admin');
    }
    return false;
  },
  register(e){
    e.preventDefault();
    const db = Store.db();
    const errEl = document.getElementById('regError');
    const studentId = document.getElementById('regStudentId').value.trim();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const mobile = document.getElementById('regMobile').value.trim();
    const gender = document.getElementById('regGender').value;
    const department = document.getElementById('regDept').value;
    const year = document.getElementById('regYear').value;
    const section = document.getElementById('regSection').value.trim();
    const pw = document.getElementById('regPw').value;
    const pw2 = document.getElementById('regPw2').value;
    const consent = document.getElementById('regConsent').checked;

    if(!consent){ errEl.textContent = 'Please confirm you agree to the Privacy & Data Use policy to continue.'; return false; }
    if(pw !== pw2){ errEl.textContent = 'Passwords do not match.'; return false; }
    if(db.students.some(s=>s.studentId.toLowerCase()===studentId.toLowerCase())){ errEl.textContent = 'That Student ID is already registered.'; return false; }
    if(db.students.some(s=>s.email.toLowerCase()===email.toLowerCase())){ errEl.textContent = 'That email is already registered.'; return false; }

    const student = {
      id: uid('s'), studentId, name, email, mobile, gender, department, year, section,
      passwordHash: hashPw(pw), photo: null, createdAt: todayISO(), consentAt: todayISO()
    };
    db.students.push(student);
    Store.save(db);
    Store.setSession({role:'student', id: student.id});
    toast('Account created — welcome, '+escapeHtml(name.split(' ')[0])+'!','success');
    Router.go('student');
    return false;
  },
  logout(){
    Store.clearSession();
    toast('Logged out.','primary');
    Router.go('landing');
  }
};

/* =========================================================
   PRIVACY / DATA-DELETION REQUEST
   Since this is a client-only demo with no backend queue, a
   student's own deletion request is carried out immediately on
   their own account (their record + their assessments + their
   recommendations). Staff/admin accounts are asked to email
   support instead, since removing them affects other people's data.
   ========================================================= */
const PrivacyUI = {
  requestDeletion(){
    const s = Store.session();
    if(!s || s.role !== 'student'){
      toast('Please log in as a student, or email '+CONFIG.supportEmail+', to request deletion.', 'primary');
      return;
    }
    if(!confirm('This will permanently delete your account, check-in history, and recommendations from this browser. This cannot be undone. Continue?')) return;
    const db = Store.db();
    const st = db.students.find(x=>x.id===s.id);
    logAudit(db, 'student', st ? st.name : s.id, 'Requested and completed self-service data deletion');
    db.students = db.students.filter(x=>x.id!==s.id);
    db.assessments = db.assessments.filter(a=>a.studentId!==s.id);
    db.recommendations = db.recommendations.filter(r=>r.studentId!==s.id);
    Store.save(db);
    Store.clearSession();
    toast('Your data has been deleted.', 'success');
    Router.go('landing');
  }
};

/* =========================================================
   FORGOT PASSWORD — OTP FLOW
   (Simulated: there's no email/SMS server in this self-contained
   file, so the OTP is generated locally and shown on screen,
   clearly labelled as a demo delivery rather than a real send.)
   ========================================================= */
const ForgotFlow = {
  role: 'student',
  account: null,
  otp: null,
  expiresAt: 0,
  open(){
    this.role = 'student'; this.account = null; this.otp = null;
    Router.go('forgot');
    this.reset();
  },
  reset(){
    document.querySelectorAll('#view-forgot .role-tab').forEach(t=>t.classList.remove('active'));
    const first = document.querySelector('#view-forgot .role-tab[data-role="student"]');
    if(first) first.classList.add('active');
    document.getElementById('forgotIdLabel').textContent = 'Student ID or Email';
    document.getElementById('forgotId').value = '';
    document.getElementById('forgotError1').textContent = '';
    document.getElementById('forgotError2').textContent = '';
    document.getElementById('forgotError3').textContent = '';
    this.showStep(1);
  },
  setRole(role, el){
    this.role = role;
    document.querySelectorAll('#view-forgot .role-tab').forEach(t=>t.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('forgotIdLabel').textContent =
      role==='student' ? 'Student ID or Email' : (role==='teacher' ? 'Username' : 'Username');
  },
  showStep(n){
    document.getElementById('forgotStep1').style.display = n===1 ? 'block' : 'none';
    document.getElementById('forgotStep2').style.display = n===2 ? 'block' : 'none';
    document.getElementById('forgotStep3').style.display = n===3 ? 'block' : 'none';
    ['fstep1lbl','fstep2lbl','fstep3lbl'].forEach((id,i)=>{
      document.getElementById(id).style.color = (i+1===n) ? 'var(--primary-deep)' : '';
      document.getElementById(id).style.fontWeight = (i+1===n) ? '700' : '400';
    });
  },
  findAccount(id){
    const db = Store.db();
    id = id.trim().toLowerCase();
    if(this.role==='student') return db.students.find(s=>s.studentId.toLowerCase()===id || s.email.toLowerCase()===id);
    if(this.role==='teacher') return db.teachers.find(t=>t.email.toLowerCase()===id || t.name.toLowerCase()===id);
    return db.admin.find(a=>a.username.toLowerCase()===id);
  },
  sendOtp(isResend){
    const id = document.getElementById('forgotId').value;
    const errEl = document.getElementById('forgotError1');
    const acct = this.findAccount(id);
    if(!acct){ errEl.textContent = 'No account found with that identifier.'; return; }
    errEl.textContent = '';
    this.account = acct;
    this.otp = String(Math.floor(100000 + Math.random()*900000));
    this.expiresAt = Date.now() + 5*60*1000;
    document.getElementById('otpDisplayBox').innerHTML =
      `<i class="fa-solid fa-circle-info me-1"></i> This demo has no email/SMS server, so here's your one-time code directly:
       <div class="font-mono fw-bold fs-4 mt-1">${this.otp}</div>
       <div class="small text-muted">Valid for 5 minutes.</div>`;
    document.getElementById('forgotOtpInput').value = '';
    document.getElementById('forgotError2').textContent = '';
    this.showStep(2);
    toast(isResend ? 'New OTP generated.' : 'OTP generated.', 'success');
  },
  verifyOtp(){
    const entered = document.getElementById('forgotOtpInput').value.trim();
    const errEl = document.getElementById('forgotError2');
    if(Date.now() > this.expiresAt){ errEl.textContent = 'This OTP expired. Please resend.'; return; }
    if(entered !== this.otp){ errEl.textContent = 'Incorrect OTP. Please try again.'; return; }
    errEl.textContent = '';
    document.getElementById('forgotNewPw').value = '';
    document.getElementById('forgotNewPw2').value = '';
    document.getElementById('forgotError3').textContent = '';
    this.showStep(3);
  },
  resetPassword(){
    const pw = document.getElementById('forgotNewPw').value;
    const pw2 = document.getElementById('forgotNewPw2').value;
    const errEl = document.getElementById('forgotError3');
    if(pw.length < 6){ errEl.textContent = 'Password must be at least 6 characters.'; return; }
    if(pw !== pw2){ errEl.textContent = 'Passwords do not match.'; return; }
    const db = Store.db();
    if(this.role==='student'){ db.students.find(s=>s.id===this.account.id).passwordHash = hashPw(pw); }
    if(this.role==='teacher'){ db.teachers.find(t=>t.id===this.account.id).passwordHash = hashPw(pw); }
    if(this.role==='admin'){ db.admin.find(a=>a.username===this.account.username).passwordHash = hashPw(pw); }
    Store.save(db);
    toast('Password reset — please log in.', 'success');
    Router.go('login');
  }
};

function fillDeptSelect(selectId, includeAll){
  const db = Store.db();
  const sel = document.getElementById(selectId);
  if(!sel) return;
  let html = includeAll ? '<option value="">All departments</option>' : '<option value="">Select</option>';
  db.departments.forEach(d => html += `<option value="${d.name}">${d.name}</option>`);
  sel.innerHTML = html;
}

/* =========================================================
   STUDENT UI
   ========================================================= */

/** Shared report generator used by both the student's own "Download
 *  report" and the teacher's "Download latest report" button. */
function generateReportPdf(st, a){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFont('helvetica','bold'); doc.setFontSize(18);
  doc.text('Calm Compass — Stress Assessment Report', 14, 20);
  doc.setFontSize(11); doc.setFont('helvetica','normal');
  doc.text(`Student: ${st.name}  (${st.studentId})`, 14, 32);
  doc.text(`Department: ${st.department}   Year: ${st.year}   Section: ${st.section}`, 14, 39);
  doc.text(`Assessment date: ${a.date}`, 14, 46);
  doc.setFontSize(14); doc.setFont('helvetica','bold');
  const mx = maxScore();
  const risk = mx ? Math.round(a.totalScore/mx*100) : 0;
  doc.text(`Score: ${a.totalScore} / ${mx}   Category: ${a.category}   Risk: ${risk}%`, 14, 58);
  doc.setFontSize(11); doc.setFont('helvetica','bold');
  doc.text('Recommendations:', 14, 70);
  doc.setFont('helvetica','normal');
  let y = 77;
  recommendationsFor(a.category).forEach(r=>{
    const lines = doc.splitTextToSize('• '+r, 180);
    doc.text(lines, 14, y); y += lines.length*6;
  });
  doc.save(`stress-report-${st.studentId}-${a.date}.pdf`);
}

const StudentUI = {
  currentAnswers: {},
  tab(id, el){
    document.querySelectorAll('#view-student .stab').forEach(t=>t.style.display='none');
    document.getElementById(id).style.display='block';
    document.querySelectorAll('#view-student .side-link').forEach(s=>s.classList.remove('active'));
    if(el) el.classList.add('active');
    if(id==='s-dash') this.renderDashboard();
    if(id==='s-assess') this.renderAssessment();
    if(id==='s-history') this.renderHistory();
    if(id==='s-recs') this.renderRecs();
    if(id==='s-profile') this.renderProfile();
    if(id==='s-subjects') renderSubjectsUsed('s-subjects');
  },
  me(){ const s = Store.session(); return Store.db().students.find(x=>x.id===s.id); },
  myAssessments(){
    const st = this.me();
    return Store.db().assessments.filter(a=>a.studentId===st.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
  },
  renderDashboard(){
    const st = this.me();
    const mine = this.myAssessments();
    const latest = mine[0];
    const quote = QUOTES[Math.floor(Math.random()*QUOTES.length)];
    document.getElementById('s-dash').innerHTML = `
      <div class="card-cc mb-4">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h4 class="font-display mb-1">Hi ${escapeHtml(st.name.split(' ')[0])}, good to see you.</h4>
            <div class="small text-muted">${escapeHtml(st.department)} · ${escapeHtml(st.year)} · Section ${escapeHtml(st.section)}</div>
          </div>
          <button class="btn-cc-primary" onclick="StudentUI.tab('s-assess', document.querySelector('[data-tab=s-assess]'))">Start Assessment</button>
        </div>
      </div>
      <div class="row g-3 mb-4">
        <div class="col-md-3 col-6"><div class="stat-tile"><div class="val">${latest ? latest.totalScore : '—'}</div><div class="lbl">Current stress score</div></div></div>
        <div class="col-md-3 col-6"><div class="stat-tile"><div class="val">${mine.length}</div><div class="lbl">Total assessments</div></div></div>
        <div class="col-md-3 col-6"><div class="stat-tile">${latest ? `<span class="chip ${chipClass(latest.category)}">${latest.category}</span>` : '<span class="text-muted small">No data yet</span>'}<div class="lbl mt-1">Latest category</div></div></div>
        <div class="col-md-3 col-6"><div class="stat-tile"><div class="val">${latest ? latest.date : '—'}</div><div class="lbl">Latest assessment</div></div></div>
      </div>
      <div class="row g-3">
        <div class="col-lg-8">
          <div class="card-cc">
            <h6 class="fw-bold mb-3">Progress over time</h6>
            <canvas id="studentTrendChart" height="110"></canvas>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="quote-banner mb-3">"${quote}"</div>
          <div class="card-cc">
            <h6 class="fw-bold mb-2">Quick actions</h6>
            <div class="d-grid gap-2">
              <button class="btn-cc-outline btn-sm" onclick="StudentUI.tab('s-assess', document.querySelector('[data-tab=s-assess]'))"><i class="fa-solid fa-clipboard-check me-1"></i>Start Assessment</button>
              <button class="btn-cc-outline btn-sm" onclick="StudentUI.tab('s-history', document.querySelector('[data-tab=s-history]'))"><i class="fa-solid fa-clock-rotate-left me-1"></i>View History</button>
              <button class="btn-cc-outline btn-sm" onclick="StudentUI.tab('s-recs', document.querySelector('[data-tab=s-recs]'))"><i class="fa-solid fa-comment-medical me-1"></i>Recommendations</button>
              <button class="btn-cc-outline btn-sm" onclick="StudentUI.tab('s-profile', document.querySelector('[data-tab=s-profile]'))"><i class="fa-solid fa-user me-1"></i>Update Profile</button>
            </div>
          </div>
        </div>
      </div>
    `;
    const ctx = document.getElementById('studentTrendChart');
    const ordered = [...mine].reverse();
    new Chart(ctx, {
      type:'line',
      data:{ labels: ordered.map(a=>a.date), datasets:[{ label:'Stress score', data: ordered.map(a=>a.totalScore), borderColor:'#0D9488', backgroundColor:'rgba(13,148,136,.18)', fill:true, tension:.35 }] },
      options:{ plugins:{legend:{display:false}}, scales:{ y:{ min:0, max:maxScore() || 80 } } }
    });
  },
  renderAssessment(){
    const db = Store.db();
    this.currentAnswers = {};
    let html = `<h4 class="font-display mb-1">Weekly stress check-in</h4>
      <p class="text-muted mb-3">Answer honestly — there are no wrong answers. ${db.questions.length} questions across 5 wellbeing areas, about 4 minutes. Every question is required. Use Tab and Enter/Space to answer without a mouse.</p>`;
    html += renderCrisisHelp();
    html += `<div class="progress-cc my-4" role="progressbar" aria-label="Check-in progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="assessProgressWrap"><div id="assessProgressBar" style="width:0%"></div></div>`;
    let lastDomain = null;
    db.questions.forEach((q, i) => {
      const domain = q.domain || 'General';
      if(domain !== lastDomain){
        html += `<h5 class="domain-head"><span class="domain-icon" aria-hidden="true"><i class="fa-solid ${DOMAIN_ICONS[domain] || 'fa-circle-question'}"></i></span>${escapeHtml(domain)}</h5>`;
        lastDomain = domain;
      }
      html += `
      <fieldset class="q-card">
        <legend class="fw-bold small mb-1" style="float:none; width:auto; font-size:inherit; padding:0;">${i+1}. ${escapeHtml(q.text)}</legend>
        <div class="q-options" data-qid="${q.id}" role="radiogroup" aria-label="Question ${i+1}">
          ${['Never','Rarely','Sometimes','Often','Always'].map((lbl,v)=>`
            <label class="q-opt" tabindex="0" onclick="StudentUI.selectAnswer('${q.id}',${v}, this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault(); this.click();}">
              <input type="radio" name="q_${q.id}" value="${v}" tabindex="-1">${lbl}
            </label>`).join('')}
        </div>
      </fieldset>`;
    });
    html += `
      <h5 class="domain-head"><span class="domain-icon" aria-hidden="true"><i class="fa-solid fa-comment-dots"></i></span>Optional reflection</h5>
      <div class="q-card">
        <label class="fw-bold small mb-1 d-block" for="assessReflection">Anything you'd like to add? (optional, never scored)</label>
        <textarea class="form-control form-control-cc" id="assessReflection" rows="3" maxlength="500" aria-describedby="reflectionHelp"></textarea>
        <div class="small text-muted mt-1" id="reflectionHelp">Only you — and a counsellor you choose to contact — can see this note.</div>
      </div>
      <p class="small text-muted mt-3"><a href="#" onclick="Router.go('privacy');return false;">How is this data used?</a></p>
    `;
    html += `<button class="btn-cc-primary mt-2" onclick="StudentUI.submitAssessment()">Submit Assessment <i class="fa-solid fa-paper-plane ms-1" aria-hidden="true"></i></button>`;
    document.getElementById('s-assess').innerHTML = html;
  },
  selectAnswer(qid, val, labelEl){
    this.currentAnswers[qid] = val;
    const group = labelEl.closest('.q-options');
    group.querySelectorAll('.q-opt').forEach(o=>{ o.classList.remove('checked'); o.setAttribute('aria-checked','false'); });
    labelEl.classList.add('checked');
    labelEl.setAttribute('aria-checked','true');
    const db = Store.db();
    const pct = Math.round(Object.keys(this.currentAnswers).length / db.questions.length * 100);
    const bar = document.getElementById('assessProgressBar');
    if(bar) bar.style.width = pct + '%';
    const wrap = document.getElementById('assessProgressWrap');
    if(wrap) wrap.setAttribute('aria-valuenow', String(pct));
  },
  submitAssessment(){
    const db = Store.db();
    if(Object.keys(this.currentAnswers).length < db.questions.length){
      toast('Please answer every question before submitting.','warning');
      return;
    }
    const total = Object.values(this.currentAnswers).reduce((a,b)=>a+b,0);
    const cat = categoryFor(total, db.questions.length*4);
    const st = this.me();
    const domainTotals = {};
    db.questions.forEach(q=>{
      const d = q.domain || 'General';
      domainTotals[d] = (domainTotals[d]||0) + (this.currentAnswers[q.id] || 0);
    });
    const reflectionEl = document.getElementById('assessReflection');
    const assessment = {
      id: uid('a'), studentId: st.id, date: todayISO(),
      answers: Object.entries(this.currentAnswers).map(([qid,val])=>({qid, val})),
      totalScore: total, category: cat,
      domainTotals, reflection: reflectionEl ? reflectionEl.value.trim().slice(0,500) : ''
    };
    db.assessments.push(assessment);
    Store.save(db);
    toast('Assessment submitted.','success');
    this.showResult(assessment.id);
  },
  showResult(assessmentId){
    document.querySelectorAll('#view-student .stab').forEach(t=>t.style.display='none');
    document.getElementById('s-result').style.display='block';
    const st = this.me();
    const db = Store.db();
    const mine = db.assessments.filter(x=>x.studentId===st.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
    const a = mine.find(x=>x.id===assessmentId);
    const prior = mine.find(x=>x.id!==assessmentId); // most recent OTHER assessment
    const mx = maxScore();
    const pct = mx ? Math.round(a.totalScore/mx*100) : 0;
    const recs = recommendationsFor(a.category);
    const explain = {
      Low: "Your answers this week point to a manageable, steady load — the kind most students carry without much strain.",
      Moderate: "Your answers show some pressure building — normal during a busy stretch, worth keeping an eye on.",
      High: "Your answers suggest you're carrying a heavier load than usual right now — this is a good week to lean on support.",
      'Very High': "Your answers show a lot of pressure right now. You don't have to manage this alone — please use the support option below."
    }[a.category];
    let trendHtml = `<p class="small text-muted mb-0">This is your first check-in — future ones will show a trend here.</p>`;
    if(prior){
      const diff = a.totalScore - prior.totalScore;
      const dir = diff === 0 ? 'the same as' : (diff > 0 ? 'higher than' : 'lower than');
      const icon = diff === 0 ? 'fa-minus' : (diff > 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down');
      trendHtml = `<p class="small mb-0"><i class="fa-solid ${icon} me-1" aria-hidden="true"></i>Your score is <strong>${Math.abs(diff)} points ${dir}</strong> your previous check-in on ${prior.date} (${prior.totalScore}/${mx}, ${prior.category}).</p>`;
    }
    // Per-domain max = (number of questions in that domain) × 4, so the bars
    // stay accurate even if an admin adds/removes questions or uses "General".
    const domainMax = {};
    db.questions.forEach(q=>{ const d = q.domain || 'General'; domainMax[d] = (domainMax[d]||0) + 1; });
    const domKeys = Object.keys(a.domainTotals || {}).sort((x,y)=>{
      const ix = DOMAINS.indexOf(x), iy = DOMAINS.indexOf(y);
      return (ix < 0 ? 99 : ix) - (iy < 0 ? 99 : iy);
    });
    const domainRows = domKeys.map(d=>{
      const v = (a.domainTotals && a.domainTotals[d]) || 0;
      const max = Math.max((domainMax[d] || 0) * 4, 1);
      const domPct = Math.round(v/max*100);
      return `<div class="mb-2">
        <div class="d-flex justify-content-between small"><span>${escapeHtml(d)}</span><span class="font-mono">${v}/${max}</span></div>
        <div class="progress-cc"><div style="width:${domPct}%"></div></div>
      </div>`;
    }).join('');
    document.getElementById('s-result').innerHTML = `
      ${renderCrisisHelp()}
      <div class="card-cc mt-3">
        <div class="d-flex justify-content-between flex-wrap gap-3 align-items-start">
          <div>
            <div class="text-muted small">Your result</div>
            <h2 class="font-display mb-0">${a.totalScore} <span class="fs-6 text-muted">/ ${mx}</span></h2>
            <span class="chip ${chipClass(a.category)} mt-2 d-inline-block">${a.category} stress band</span>
          </div>
          <div class="text-end">
            <div class="text-muted small">Trend vs last check-in</div>
            ${trendHtml}
          </div>
        </div>
        <div class="mt-4">
          <div class="meter-track">
            <div class="meter-pin" style="left:calc(${pct}% - 2px)"></div>
          </div>
          <div class="d-flex justify-content-between small text-muted mt-1"><span>Low</span><span>Moderate</span><span>High</span><span>Very High</span></div>
        </div>
        <p class="small text-muted mt-3 mb-0">${explain}</p>
        <div class="mt-4">
          <h6 class="fw-bold">Breakdown by area</h6>
          ${domainRows}
        </div>
        <div class="mt-4">
          <h6 class="fw-bold">Practical next steps</h6>
          <ul>${recs.map(r=>`<li class="small">${r}</li>`).join('')}</ul>
        </div>
        <div class="quote-banner mt-3">"${QUOTES[Math.floor(Math.random()*QUOTES.length)]}"</div>
        <p class="small text-muted mt-3 mb-0"><a href="#" onclick="Router.go('privacy');return false;">How is this data used?</a> · This is not a clinical diagnosis.</p>
        <div class="d-flex gap-2 mt-3 flex-wrap">
          <button class="btn-cc-primary" onclick="StudentUI.downloadReport('${a.id}')"><i class="fa-solid fa-download me-1" aria-hidden="true"></i>Download Report</button>
          <button class="btn-cc-outline" onclick="StudentUI.tab('s-dash', document.querySelector('[data-tab=s-dash]'))">Back to Dashboard</button>
          <button class="btn-cc-outline" onclick="StudentUI.tab('s-assess', document.querySelector('[data-tab=s-assess]'))">Take Again</button>
        </div>
      </div>
    `;
  },
  downloadReport(assessmentId){
    const a = Store.db().assessments.find(x=>x.id===assessmentId);
    const st = this.me();
    generateReportPdf(st, a);
    toast('Report downloaded.','success');
  },
  renderHistory(){
    const mine = this.myAssessments();
    let rows = mine.map(a=>`
      <tr><td>${a.date}</td><td>${a.totalScore}</td><td><span class="chip ${chipClass(a.category)}">${a.category}</span></td><td class="small text-muted">${a.category==='Very High'?'Needs prompt attention':(a.category==='High'?'Monitor closely':'Stable')}</td></tr>
    `).join('') || `<tr><td colspan="4" class="text-center text-muted py-3">No assessments yet.</td></tr>`;
    document.getElementById('s-history').innerHTML = `
      <h4 class="font-display mb-3">Your history</h4>
      <div class="row g-3 mb-4">
        <div class="col-lg-6"><div class="card-cc"><h6 class="fw-bold">Monthly / trend</h6><canvas id="histLineChart" height="140"></canvas></div></div>
        <div class="col-lg-3"><div class="card-cc"><h6 class="fw-bold">Category split</h6><canvas id="histPieChart" height="140"></canvas></div></div>
        <div class="col-lg-3"><div class="card-cc"><h6 class="fw-bold">Score by attempt</h6><canvas id="histBarChart" height="140"></canvas></div></div>
      </div>
      <div class="table-responsive table-cc">
        <table class="table mb-0"><thead><tr><th>Date</th><th>Score</th><th>Stress Level</th><th>Remarks</th></tr></thead><tbody>${rows}</tbody></table>
      </div>
    `;
    const ordered = [...mine].reverse();
    new Chart(document.getElementById('histLineChart'), { type:'line', data:{ labels: ordered.map(a=>a.date), datasets:[{label:'Score', data:ordered.map(a=>a.totalScore), borderColor:'#0D9488', tension:.3}]}, options:{plugins:{legend:{display:false}}} });
    const counts = {Low:0,Moderate:0,High:0,'Very High':0};
    mine.forEach(a=>counts[a.category]++);
    new Chart(document.getElementById('histPieChart'), { type:'pie', data:{ labels:Object.keys(counts), datasets:[{data:Object.values(counts), backgroundColor:['#16A34A','#D97706','#EA580C','#DC2626']}]} });
    new Chart(document.getElementById('histBarChart'), { type:'bar', data:{ labels: ordered.map((a,i)=>'#'+(i+1)), datasets:[{data:ordered.map(a=>a.totalScore), backgroundColor:'#0D9488'}]}, options:{plugins:{legend:{display:false}}} });
  },
  renderRecs(){
    const st = this.me();
    const db = Store.db();
    // Match on studentId (not assessmentId) so a recommendation sent BEFORE a
    // student's first check-in (assessmentId falls back to a placeholder) still
    // shows up here.
    const recs = db.recommendations.filter(r=>r.studentId===st.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    document.getElementById('s-recs').innerHTML = `
      <h4 class="font-display mb-3">Counselor recommendations</h4>
      ${recs.length ? recs.map(r=>{
        const t = db.teachers.find(x=>x.id===r.teacherId);
        return `<div class="card-cc mb-3"><div class="d-flex justify-content-between"><strong>${t?escapeHtml(t.name):'Counselor'}</strong><span class="small text-muted">${escapeHtml(r.createdAt)}</span></div><p class="mb-0 mt-2">${escapeHtml(r.text)}</p></div>`;
      }).join('') : `<div class="card-cc text-center text-muted py-4">No recommendations yet — they'll appear here once a teacher sends one.</div>`}
    `;
  },
  renderProfile(){
    const st = this.me();
    const eName = escapeHtml(st.name), eEmail = escapeHtml(st.email), eMobile = escapeHtml(st.mobile);
    document.getElementById('s-profile').innerHTML = `
      <h4 class="font-display mb-3">Your profile</h4>
      <div class="card-cc" style="max-width:600px;">
        <div class="d-flex align-items-center gap-3 mb-3">
          <img src="${st.photo || 'https://api.dicebear.com/7.x/initials/svg?seed='+encodeURIComponent(st.name)}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;" id="profPhotoPreview">
          <div>
            <input type="file" accept="image/*" class="form-control form-control-sm" id="profPhotoInput" onchange="StudentUI.onPhoto(event)">
            <div class="small text-muted">JPEG/PNG, small file recommended.</div>
          </div>
        </div>
        <form onsubmit="return StudentUI.saveProfile(event)">
          <div class="row g-2">
            <div class="col-md-6"><label class="form-label small fw-bold">Name</label><input class="form-control form-control-cc" id="profName" value="${eName}" required></div>
            <div class="col-md-6"><label class="form-label small fw-bold">Email</label><input type="email" class="form-control form-control-cc" id="profEmail" value="${eEmail}" required></div>
            <div class="col-md-6"><label class="form-label small fw-bold">Phone</label><input class="form-control form-control-cc" id="profPhone" value="${eMobile}" required></div>
            <div class="col-md-6"><label class="form-label small fw-bold">Department</label><select class="form-select form-select-cc" id="profDeptSelect"></select></div>
            <div class="col-md-6">
              <label class="form-label small fw-bold">Year</label>
              <select class="form-select form-select-cc" id="profYear">
                ${['1st Year','2nd Year','3rd Year','4th Year'].map(y=>`<option ${y===st.year?'selected':''}>${y}</option>`).join('')}
              </select>
            </div>
            <div class="col-md-6"><label class="form-label small fw-bold">New password (optional)</label><input type="password" class="form-control form-control-cc" id="profPw" placeholder="Leave blank to keep current"></div>
          </div>
          <button class="btn-cc-primary mt-3" type="submit">Save changes</button>
        </form>
      </div>
    `;
    // Populate the dropdown AFTER the select element exists (it is created by
    // the innerHTML above). Previously fillDeptSelect() ran first and no-oped,
    // so the dropdown was empty and saving the profile erased the department.
    fillDeptSelect('profDeptSelect');
    const sel = document.getElementById('profDeptSelect');
    if(sel && st.department) sel.value = st.department;
    addPwToggle('profPw');
  },
  _pendingPhoto: null,
  onPhoto(e){
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      this._pendingPhoto = ev.target.result;
      document.getElementById('profPhotoPreview').src = ev.target.result;
    };
    reader.readAsDataURL(file);
  },
  saveProfile(e){
    e.preventDefault();
    const db = Store.db();
    const st = db.students.find(x=>x.id===this.me().id);
    st.name = document.getElementById('profName').value.trim();
    st.email = document.getElementById('profEmail').value.trim();
    st.mobile = document.getElementById('profPhone').value.trim();
    st.department = document.getElementById('profDeptSelect').value;
    st.year = document.getElementById('profYear').value;
    if(this._pendingPhoto) st.photo = this._pendingPhoto;
    const pw = document.getElementById('profPw').value;
    if(pw) st.passwordHash = hashPw(pw);
    Store.save(db);
    NavUI.render();
    toast('Profile updated.','success');
    return false;
  }
};

/* =========================================================
   TEACHER UI
   ========================================================= */
const TeacherUI = {
  selectedStudentId: null,
  tab(id, el){
    document.querySelectorAll('#view-teacher .ttab').forEach(t=>t.style.display='none');
    document.getElementById(id).style.display='block';
    if(el){
      document.querySelectorAll('#view-teacher .side-link').forEach(s=>s.classList.remove('active'));
      el.classList.add('active');
    }
    if(id==='t-dash') this.renderDashboard();
    if(id==='t-students') this.renderStudents();
    if(id==='t-student-detail') this.renderStudentDetail();
    if(id==='t-subjects') renderSubjectsUsed('t-subjects');
  },
  latestFor(studentId){
    const list = Store.db().assessments.filter(a=>a.studentId===studentId).sort((a,b)=>new Date(b.date)-new Date(a.date));
    return list[0];
  },
  renderDashboard(){
    const db = Store.db();
    const counts = {Low:0, Moderate:0, High:0, 'Very High':0};
    db.students.forEach(s=>{ const l = this.latestFor(s.id); if(l) counts[l.category]++; });
    document.getElementById('t-dash').innerHTML = `
      <h4 class="font-display mb-3">Cohort overview</h4>
      <div class="row g-3 mb-4">
        <div class="col-md-2 col-6"><div class="stat-tile"><div class="val">${db.students.length}</div><div class="lbl">Total students</div></div></div>
        <div class="col-md-2 col-6"><div class="stat-tile"><div class="val" style="color:#16A34A">${counts.Low}</div><div class="lbl">Low stress</div></div></div>
        <div class="col-md-2 col-6"><div class="stat-tile"><div class="val" style="color:#D97706">${counts.Moderate}</div><div class="lbl">Moderate</div></div></div>
        <div class="col-md-2 col-6"><div class="stat-tile"><div class="val" style="color:#EA580C">${counts.High}</div><div class="lbl">High</div></div></div>
        <div class="col-md-2 col-6"><div class="stat-tile"><div class="val" style="color:#DC2626">${counts['Very High']}</div><div class="lbl">Very High</div></div></div>
      </div>
      <div class="row g-3">
        <div class="col-lg-4"><div class="card-cc"><h6 class="fw-bold">Distribution</h6><canvas id="teachPie"></canvas></div></div>
        <div class="col-lg-4"><div class="card-cc"><h6 class="fw-bold">By category</h6><canvas id="teachBar"></canvas></div></div>
        <div class="col-lg-4"><div class="card-cc"><h6 class="fw-bold">Assessments over time</h6><canvas id="teachLine"></canvas></div></div>
      </div>
    `;
    new Chart(document.getElementById('teachPie'), {type:'pie', data:{labels:Object.keys(counts), datasets:[{data:Object.values(counts), backgroundColor:['#16A34A','#D97706','#EA580C','#DC2626']}]}});
    new Chart(document.getElementById('teachBar'), {type:'bar', data:{labels:Object.keys(counts), datasets:[{data:Object.values(counts), backgroundColor:'#0D9488'}]}, options:{plugins:{legend:{display:false}}}});
    const byDate = {};
    db.assessments.forEach(a=>{ byDate[a.date]=(byDate[a.date]||0)+1; });
    const dates = Object.keys(byDate).sort();
    new Chart(document.getElementById('teachLine'), {type:'line', data:{labels:dates, datasets:[{data:dates.map(d=>byDate[d]), borderColor:'#0D9488', tension:.3}]}, options:{plugins:{legend:{display:false}}}});
  },
  renderStudents(){
    const db = Store.db();
    document.getElementById('t-students').innerHTML = `
      <div class="d-flex justify-content-between flex-wrap gap-2 mb-3">
        <h4 class="font-display mb-0">Students</h4>
        <input class="form-control form-control-cc" style="max-width:280px;" placeholder="Search by name or ID..." oninput="TeacherUI.filterStudents(this.value)">
      </div>
      <div class="table-responsive table-cc">
        <table class="table mb-0" id="teacherStudentTable">
          <thead><tr><th>Student ID</th><th>Name</th><th>Department</th><th>Year</th><th>Latest score</th><th>Level</th><th></th></tr></thead>
          <tbody>${this.studentRows(db.students)}</tbody>
        </table>
      </div>
    `;
  },
  studentRows(list){
    return list.map(s=>{
      const l = this.latestFor(s.id);
      return `<tr>
        <td>${escapeHtml(s.studentId)}</td><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.department)}</td><td>${escapeHtml(s.year)}</td>
        <td>${l?l.totalScore:'—'}</td>
        <td>${l?`<span class="chip ${chipClass(l.category)}">${l.category}</span>`:'<span class="text-muted small">No data</span>'}</td>
        <td><button class="btn btn-sm btn-cc-outline" onclick="TeacherUI.openStudent('${escapeHtml(s.id)}')">View</button></td>
      </tr>`;
    }).join('') || `<tr><td colspan="7" class="text-center text-muted py-3">No students yet.</td></tr>`;
  },
  filterStudents(q){
    const db = Store.db();
    q = q.toLowerCase();
    const filtered = db.students.filter(s => s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q));
    document.querySelector('#teacherStudentTable tbody').innerHTML = this.studentRows(filtered);
  },
  openStudent(id){
    this.selectedStudentId = id;
    document.querySelectorAll('#view-teacher .ttab').forEach(t=>t.style.display='none');
    document.getElementById('t-student-detail').style.display='block';
    const db = Store.db();
    const st = db.students.find(x=>x.id===id);
    const session = Store.session();
    const t = db.teachers.find(x=>x.id===session.id);
    logAudit(db, 'teacher', t ? t.name : 'Teacher', 'Viewed student detail', st ? `${st.name} (${st.studentId})` : id);
    Store.save(db);
    this.renderStudentDetail();
  },
  renderStudentDetail(){
    const db = Store.db();
    const st = db.students.find(x=>x.id===this.selectedStudentId);
    if(!st){ document.getElementById('t-student-detail').innerHTML = '<div class="text-muted">Select a student from the Students tab.</div>'; return; }
    const mine = db.assessments.filter(a=>a.studentId===st.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
    const recs = db.recommendations.filter(r=>r.studentId===st.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    document.getElementById('t-student-detail').innerHTML = `
      <button class="btn btn-sm btn-cc-outline mb-3" onclick="TeacherUI.tab('t-students', document.querySelector('[data-tab=t-students]'))"><i class="fa-solid fa-arrow-left me-1"></i>Back to students</button>
      <div class="row g-3">
        <div class="col-lg-4">
          <div class="card-cc text-center">
            <img src="${st.photo || 'https://api.dicebear.com/7.x/initials/svg?seed='+encodeURIComponent(st.name)}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;">
            <h5 class="mt-2 mb-0">${escapeHtml(st.name)}</h5>
            <div class="text-muted small">${escapeHtml(st.studentId)} · ${escapeHtml(st.department)}</div>
            <div class="text-muted small">${escapeHtml(st.year)} · Section ${escapeHtml(st.section)}</div>
            <div class="text-muted small">${escapeHtml(st.email)} · ${escapeHtml(st.mobile)}</div>
            <button class="btn btn-sm btn-cc-primary mt-3" onclick="TeacherUI.downloadReport('${mine[0]?mine[0].id:''}')" ${mine.length?'':'disabled'}>Download latest report</button>
          </div>
          <div class="card-cc mt-3">
            <h6 class="fw-bold">Send recommendation</h6>
            <textarea class="form-control form-control-cc mb-2" id="teacherRecText" rows="3" placeholder="Advice, counseling notes, motivational message, or appointment suggestion..."></textarea>
            <button class="btn btn-sm btn-cc-primary" onclick="TeacherUI.sendRecommendation()">Send</button>
          </div>
        </div>
        <div class="col-lg-8">
          <div class="card-cc mb-3"><h6 class="fw-bold">Stress trend</h6><canvas id="teacherStudentTrend" height="100"></canvas></div>
          <div class="card-cc mb-3">
            <h6 class="fw-bold">Assessment history</h6>
            <div class="table-responsive">
              <table class="table table-sm mb-0"><thead><tr><th>Date</th><th>Score</th><th>Level</th></tr></thead>
              <tbody>${mine.map(a=>`<tr><td>${a.date}</td><td>${a.totalScore}</td><td><span class="chip ${chipClass(a.category)}">${a.category}</span></td></tr>`).join('') || '<tr><td colspan="3" class="text-muted text-center">No assessments yet.</td></tr>'}</tbody></table>
            </div>
          </div>
          ${mine[0] && mine[0].reflection ? `
          <div class="card-cc mb-3">
            <h6 class="fw-bold">Student's latest reflection note</h6>
            <p class="small text-muted mb-0 fst-italic">"${escapeHtml(mine[0].reflection)}"</p>
            <p class="small text-muted mt-1 mb-0">From the ${mine[0].date} check-in — optional and in the student's own words.</p>
          </div>` : ''}
          <div class="card-cc">
            <h6 class="fw-bold">Past recommendations</h6>
            ${recs.length ? recs.map(r=>`<div class="border-bottom pb-2 mb-2 small"><strong>${r.createdAt}</strong> — ${escapeHtml(r.text)}</div>`).join('') : '<div class="text-muted small">None yet.</div>'}
          </div>
        </div>
      </div>
    `;
    const ordered = [...mine].reverse();
    new Chart(document.getElementById('teacherStudentTrend'), {type:'line', data:{labels:ordered.map(a=>a.date), datasets:[{data:ordered.map(a=>a.totalScore), borderColor:'#0D9488', backgroundColor:'rgba(13,148,136,.18)', fill:true, tension:.35}]}, options:{plugins:{legend:{display:false}}, scales:{y:{min:0,max:maxScore() || 80}}}});
  },
  sendRecommendation(){
    const text = document.getElementById('teacherRecText').value.trim();
    if(!text){ toast('Write something before sending.','warning'); return; }
    const db = Store.db();
    const mine = db.assessments.filter(a=>a.studentId===this.selectedStudentId).sort((a,b)=>new Date(b.date)-new Date(a.date));
    const assessmentId = mine[0] ? mine[0].id : uid('a-none');
    const session = Store.session();
    db.recommendations.push({ id: uid('r'), assessmentId, studentId:this.selectedStudentId, teacherId: session.id, text, createdAt: todayISO() });
    Store.save(db);
    toast('Recommendation sent.','success');
    this.renderStudentDetail();
  },
  /** Fixes the old onClick that called StudentUI.downloadReport.call(...)
   *  — TeacherUI has no me(), so that threw "this.me is not a function". */
  downloadReport(assessmentId){
    const db = Store.db();
    const st = db.students.find(x=>x.id===this.selectedStudentId);
    const a = db.assessments.find(x=>x.id===assessmentId);
    if(!st || !a){ toast('No report available for this student yet.','warning'); return; }
    generateReportPdf(st, a);
    logAudit(db, 'teacher', (db.teachers.find(x=>x.id===Store.session().id)||{}).name || 'Teacher', 'Downloaded student stress report', `${st.name} (${st.studentId})`);
    Store.save(db);
    toast('Report downloaded.','success');
  }
};

/* =========================================================
   ADMIN UI
   ========================================================= */
const AdminUI = {
  tab(id, el){
    document.querySelectorAll('#view-admin .atab').forEach(t=>t.style.display='none');
    document.getElementById(id).style.display='block';
    if(el){
      document.querySelectorAll('#view-admin .side-link').forEach(s=>s.classList.remove('active'));
      el.classList.add('active');
    }
    if(id==='a-dash') this.renderDashboard();
    if(id==='a-students') this.renderStudents();
    if(id==='a-teachers') this.renderTeachers();
    if(id==='a-depts') this.renderDepts();
    if(id==='a-questions') this.renderQuestions();
    if(id==='a-reports') this.renderReports();
    if(id==='a-subjects') renderSubjectsUsed('a-subjects');
    if(id==='a-backup') this.renderBackup();
    if(id==='a-audit') this.renderAuditLog();
    if(id==='a-tests') this.renderSelfTests();
  },
  renderDashboard(){
    const db = Store.db();
    const highStress = db.assessments.filter(a=>a.category==='High'||a.category==='Very High').length;
    document.getElementById('a-dash').innerHTML = `
      <h4 class="font-display mb-3">System overview</h4>
      <div class="row g-3 mb-4">
        <div class="col-md-2 col-6"><div class="stat-tile"><div class="val">${db.students.length}</div><div class="lbl">Students</div></div></div>
        <div class="col-md-2 col-6"><div class="stat-tile"><div class="val">${db.teachers.length}</div><div class="lbl">Teachers</div></div></div>
        <div class="col-md-2 col-6"><div class="stat-tile"><div class="val">${db.assessments.length}</div><div class="lbl">Assessments</div></div></div>
        <div class="col-md-2 col-6"><div class="stat-tile"><div class="val">${db.departments.length}</div><div class="lbl">Departments</div></div></div>
        <div class="col-md-2 col-6"><div class="stat-tile"><div class="val" style="color:#DC2626">${highStress}</div><div class="lbl">High+ stress records</div></div></div>
      </div>
      <div class="row g-3 mb-4">
        <div class="col-lg-6"><div class="card-cc"><h6 class="fw-bold">Department distribution</h6><canvas id="adminDeptChart"></canvas></div></div>
        <div class="col-lg-6"><div class="card-cc"><h6 class="fw-bold">Stress category split</h6><canvas id="adminCatChart"></canvas></div></div>
      </div>
      <div class="card-cc">
        <h6 class="fw-bold">Latest assessments</h6>
        <div class="table-responsive"><table class="table table-sm mb-0"><thead><tr><th>Student</th><th>Date</th><th>Score</th><th>Level</th></tr></thead>
        <tbody>${[...db.assessments].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,8).map(a=>{
          const st = db.students.find(s=>s.id===a.studentId);
          return `<tr><td>${st?escapeHtml(st.name):'—'}</td><td>${a.date}</td><td>${a.totalScore}</td><td><span class="chip ${chipClass(a.category)}">${a.category}</span></td></tr>`;
        }).join('') || '<tr><td colspan="4" class="text-muted text-center">No assessments yet.</td></tr>'}</tbody></table></div>
      </div>
    `;
    const deptCounts = {};
    db.departments.forEach(d=>deptCounts[d.name]=0);
    db.students.forEach(s=>{ if(deptCounts[s.department]!==undefined) deptCounts[s.department]++; });
    new Chart(document.getElementById('adminDeptChart'), {type:'bar', data:{labels:Object.keys(deptCounts), datasets:[{data:Object.values(deptCounts), backgroundColor:'#0D9488'}]}, options:{plugins:{legend:{display:false}}}});
    const catCounts = {Low:0,Moderate:0,High:0,'Very High':0};
    db.assessments.forEach(a=>catCounts[a.category]++);
    new Chart(document.getElementById('adminCatChart'), {type:'doughnut', data:{labels:Object.keys(catCounts), datasets:[{data:Object.values(catCounts), backgroundColor:['#16A34A','#D97706','#EA580C','#DC2626']}]}});
  },
  renderStudents(){
    const db = Store.db();
    const container = document.getElementById('a-students');
    // Build the modal ONCE and never destroy it again. Rebuilding this modal's
    // DOM on every render (the old code did this via container.innerHTML)
    // could tear it down mid-close-animation, leaving Bootstrap's backdrop
    // and the body's "modal-open" lock stuck forever — which is exactly what
    // made "+ Add Student" (and Edit) stop responding after first use.
    if(!document.getElementById('studentModal')){
      container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="font-display mb-0">Manage students</h4>
          <button class="btn-cc-primary btn-sm" onclick="AdminUI.openStudentModal()">+ Add Student</button>
        </div>
        <div id="studentsTableWrap"></div>

        <div class="modal fade" id="studentModal" tabindex="-1">
          <div class="modal-dialog"><div class="modal-content p-2">
            <div class="modal-header border-0"><h5 class="modal-title font-display" id="studentModalTitle">Add Student</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
            <div class="modal-body">
              <input type="hidden" id="editStudentId">
              <div class="row g-2">
                <div class="col-6"><label class="small fw-bold">Student ID</label><input class="form-control form-control-cc" id="newStudentSid"></div>
                <div class="col-6"><label class="small fw-bold">Name</label><input class="form-control form-control-cc" id="newStudentName"></div>
                <div class="col-6"><label class="small fw-bold">Email</label><input class="form-control form-control-cc" id="newStudentEmail"></div>
                <div class="col-6"><label class="small fw-bold">Mobile</label><input class="form-control form-control-cc" id="newStudentMobile"></div>
                <div class="col-6"><label class="small fw-bold">Department</label><select class="form-select form-select-cc" id="newStudentDept"></select></div>
                <div class="col-6"><label class="small fw-bold">Year</label>
                  <select class="form-select form-select-cc" id="newStudentYear"><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option></select>
                </div>
                <div class="col-6"><label class="small fw-bold">Section</label><input class="form-control form-control-cc" id="newStudentSection"></div>
                <div class="col-6"><label class="small fw-bold">Password</label><input class="form-control form-control-cc" id="newStudentPw" placeholder="Leave blank to keep / auto for new"></div>
              </div>
            </div>
            <div class="modal-footer border-0"><button class="btn-cc-primary" onclick="AdminUI.saveStudent()">Save</button></div>
          </div></div>
        </div>
      `;
      // The modal must live as a direct child of <body>, not inside this
      // .view section. .view has position:relative + z-index:1, which
      // creates its own CSS stacking context — trapping the modal so
      // Bootstrap's backdrop (added straight to <body> at z-index:1050)
      // always renders ON TOP of it, no matter the modal's own z-index.
      // That's what made Add/Edit Student look greyed-out and unclickable.
      document.body.appendChild(document.getElementById('studentModal'));
    }
    document.getElementById('studentsTableWrap').innerHTML = `
      <div class="table-responsive table-cc">
        <table class="table mb-0"><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Department</th><th>Year</th><th></th></tr></thead>
        <tbody>${db.students.map(s=>`<tr>
          <td>${escapeHtml(s.studentId)}</td><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.email)}</td><td>${escapeHtml(s.department)}</td><td>${escapeHtml(s.year)}</td>
          <td>
            <button class="btn btn-sm btn-cc-ghost" onclick="AdminUI.openStudentModal('${s.id}')"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-sm btn-cc-ghost text-danger" onclick="AdminUI.deleteStudent('${s.id}')"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>`).join('') || '<tr><td colspan="6" class="text-center text-muted py-3">No students yet.</td></tr>'}</tbody></table>
      </div>
    `;
    fillDeptSelect('newStudentDept');
  },
  openStudentModal(id){
    document.getElementById('editStudentId').value = id || '';
    document.getElementById('studentModalTitle').textContent = id ? 'Edit Student' : 'Add Student';
    fillDeptSelect('newStudentDept');
    if(id){
      const st = Store.db().students.find(x=>x.id===id);
      document.getElementById('newStudentSid').value = st.studentId;
      document.getElementById('newStudentName').value = st.name;
      document.getElementById('newStudentEmail').value = st.email;
      document.getElementById('newStudentMobile').value = st.mobile;
      document.getElementById('newStudentDept').value = st.department;
      document.getElementById('newStudentYear').value = st.year;
      document.getElementById('newStudentSection').value = st.section;
      document.getElementById('newStudentPw').value = '';
    } else {
      ['newStudentSid','newStudentName','newStudentEmail','newStudentMobile','newStudentSection','newStudentPw'].forEach(i=>document.getElementById(i).value='');
    }
    // Show the modal directly instead of relying only on data-bs-toggle —
    // this works every time, even if a previous instance was left in a bad state.
    bootstrap.Modal.getOrCreateInstance(document.getElementById('studentModal')).show();
  },
  saveStudent(){
    const db = Store.db();
    const editId = document.getElementById('editStudentId').value;
    const data = {
      studentId: document.getElementById('newStudentSid').value.trim(),
      name: document.getElementById('newStudentName').value.trim(),
      email: document.getElementById('newStudentEmail').value.trim(),
      mobile: document.getElementById('newStudentMobile').value.trim(),
      department: document.getElementById('newStudentDept').value,
      year: document.getElementById('newStudentYear').value,
      section: document.getElementById('newStudentSection').value.trim()
    };
    if(!data.studentId || !data.name || !data.email){ toast('Fill in ID, name, and email.','warning'); return; }
    const pw = document.getElementById('newStudentPw').value;
    if(editId){
      const st = db.students.find(x=>x.id===editId);
      Object.assign(st, data);
      if(pw) st.passwordHash = hashPw(pw);
      logAudit(db, 'admin', 'Admin', 'Edited student account', `${data.name} (${data.studentId})`);
    } else {
      db.students.push({ id: uid('s'), ...data, passwordHash: hashPw(pw || 'student123'), photo:null, createdAt: todayISO() });
      logAudit(db, 'admin', 'Admin', 'Created student account', `${data.name} (${data.studentId})`);
    }
    Store.save(db);
    bootstrap.Modal.getOrCreateInstance(document.getElementById('studentModal')).hide();
    // Only the table refreshes — the modal itself is left alone, so its
    // close animation is never interrupted.
    document.getElementById('studentsTableWrap').innerHTML = '';
    this.renderStudents();
    toast('Student saved.','success');
  },
  deleteStudent(id){
    if(!confirm('Remove this student and their assessment history?')) return;
    const db = Store.db();
    const st = db.students.find(s=>s.id===id);
    logAudit(db, 'admin', 'Admin', 'Deleted student account', st ? `${st.name} (${st.studentId})` : id);
    db.students = db.students.filter(s=>s.id!==id);
    db.assessments = db.assessments.filter(a=>a.studentId!==id);
    db.recommendations = db.recommendations.filter(r=>r.studentId!==id);
    Store.save(db);
    this.renderStudents();
    toast('Student removed.','primary');
  },
  renderTeachers(){
    const db = Store.db();
    const container = document.getElementById('a-teachers');
    // Same fix as Students: build the modal once, never destroy it again.
    if(!document.getElementById('teacherModal')){
      container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="font-display mb-0">Manage teachers</h4>
          <button class="btn-cc-primary btn-sm" onclick="AdminUI.openTeacherModal()">+ Add Teacher</button>
        </div>
        <div id="teachersTableWrap"></div>
        <div class="modal fade" id="teacherModal" tabindex="-1">
          <div class="modal-dialog"><div class="modal-content p-2">
            <div class="modal-header border-0"><h5 class="modal-title font-display" id="teacherModalTitle">Add Teacher</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
            <div class="modal-body">
              <input type="hidden" id="editTeacherId">
              <label class="small fw-bold">Name</label><input class="form-control form-control-cc mb-2" id="newTeacherName">
              <label class="small fw-bold">Email</label><input class="form-control form-control-cc mb-2" id="newTeacherEmail">
              <label class="small fw-bold">Password</label><input class="form-control form-control-cc" id="newTeacherPw" placeholder="Leave blank to keep / auto for new">
            </div>
            <div class="modal-footer border-0"><button class="btn-cc-primary" onclick="AdminUI.saveTeacher()">Save</button></div>
          </div></div>
        </div>
      `;
      // Same fix as Students: pull the modal out to <body> so the
      // Bootstrap backdrop no longer renders above it.
      document.body.appendChild(document.getElementById('teacherModal'));
    }
    document.getElementById('teachersTableWrap').innerHTML = `
      <div class="table-responsive table-cc">
        <table class="table mb-0"><thead><tr><th>Name</th><th>Email</th><th></th></tr></thead>
        <tbody>${db.teachers.map(t=>`<tr><td>${escapeHtml(t.name)}</td><td>${escapeHtml(t.email)}</td><td>
          <button class="btn btn-sm btn-cc-ghost" onclick="AdminUI.openTeacherModal('${t.id}')"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-sm btn-cc-ghost text-danger" onclick="AdminUI.deleteTeacher('${t.id}')"><i class="fa-solid fa-trash"></i></button>
        </td></tr>`).join('') || '<tr><td colspan="3" class="text-center text-muted py-3">No teachers yet.</td></tr>'}</tbody></table>
      </div>
    `;
  },
  openTeacherModal(id){
    document.getElementById('editTeacherId').value = id || '';
    document.getElementById('teacherModalTitle').textContent = id ? 'Edit Teacher' : 'Add Teacher';
    if(id){
      const t = Store.db().teachers.find(x=>x.id===id);
      document.getElementById('newTeacherName').value = t.name;
      document.getElementById('newTeacherEmail').value = t.email;
    } else {
      document.getElementById('newTeacherName').value='';
      document.getElementById('newTeacherEmail').value='';
    }
    document.getElementById('newTeacherPw').value='';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('teacherModal')).show();
  },
  saveTeacher(){
    const db = Store.db();
    const editId = document.getElementById('editTeacherId').value;
    const name = document.getElementById('newTeacherName').value.trim();
    const email = document.getElementById('newTeacherEmail').value.trim();
    const pw = document.getElementById('newTeacherPw').value;
    if(!name || !email){ toast('Fill in name and email.','warning'); return; }
    if(editId){
      const t = db.teachers.find(x=>x.id===editId);
      t.name = name; t.email = email;
      if(pw) t.passwordHash = hashPw(pw);
      logAudit(db, 'admin', 'Admin', 'Edited teacher account', `${name} (${email})`);
    } else {
      db.teachers.push({ id: uid('t'), name, email, passwordHash: hashPw(pw || 'teacher123') });
      logAudit(db, 'admin', 'Admin', 'Created teacher account', `${name} (${email})`);
    }
    Store.save(db);
    bootstrap.Modal.getOrCreateInstance(document.getElementById('teacherModal')).hide();
    document.getElementById('teachersTableWrap').innerHTML = '';
    this.renderTeachers();
    toast('Teacher saved.','success');
  },
  deleteTeacher(id){
    if(!confirm('Remove this teacher?')) return;
    const db = Store.db();
    const t = db.teachers.find(x=>x.id===id);
    logAudit(db, 'admin', 'Admin', 'Deleted teacher account', t ? `${t.name} (${t.email})` : id);
    db.teachers = db.teachers.filter(t=>t.id!==id);
    Store.save(db);
    this.renderTeachers();
    toast('Teacher removed.','primary');
  },
  renderDepts(){
    const db = Store.db();
    document.getElementById('a-depts').innerHTML = `
      <h4 class="font-display mb-3">Manage departments</h4>
      <div class="card-cc mb-3" style="max-width:420px;">
        <div class="input-group">
          <input class="form-control form-control-cc" id="newDeptName" placeholder="e.g. Aerospace Engineering">
          <button class="btn-cc-primary" onclick="AdminUI.addDept()">Add</button>
        </div>
      </div>
      <div class="table-responsive table-cc" style="max-width:500px;">
        <table class="table mb-0"><thead><tr><th>Department</th><th></th></tr></thead>
        <tbody>${db.departments.map(d=>`<tr><td>${escapeHtml(d.name)}</td><td><button class="btn btn-sm btn-cc-ghost text-danger" onclick="AdminUI.deleteDept('${d.id}')"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('')}</tbody></table>
      </div>
    `;
  },
  addDept(){
    const name = document.getElementById('newDeptName').value.trim();
    if(!name) return;
    const db = Store.db();
    db.departments.push({id:uid('d'), name});
    Store.save(db);
    this.renderDepts();
    toast('Department added.','success');
  },
  deleteDept(id){
    const db = Store.db();
    db.departments = db.departments.filter(d=>d.id!==id);
    Store.save(db);
    this.renderDepts();
    toast('Department removed.','primary');
  },
  renderQuestions(){
    const db = Store.db();
    document.getElementById('a-questions').innerHTML = `
      <h4 class="font-display mb-3">Manage questionnaire</h4>
      <div class="card-cc mb-3">
        <div class="input-group">
          <input class="form-control form-control-cc" id="newQuestionText" placeholder="Add a new question...">
          <button class="btn-cc-primary" onclick="AdminUI.addQuestion()">Add</button>
        </div>
        <div class="small text-muted mt-2">Each question scores 0–4. The maximum score adjusts automatically with the question count (currently ${maxScore()}).</div>
      </div>
      <div class="table-responsive table-cc">
        <table class="table mb-0"><thead><tr><th>#</th><th>Question</th><th></th></tr></thead>
        <tbody>${db.questions.map((q,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(q.text)}</td><td><button class="btn btn-sm btn-cc-ghost text-danger" onclick="AdminUI.deleteQuestion('${q.id}')"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('')}</tbody></table>
      </div>
    `;
  },
  addQuestion(){
    const text = document.getElementById('newQuestionText').value.trim();
    if(!text) return;
    const db = Store.db();
    // Give every new question an explicit domain so scoring/breakdowns work
    // the same way as the 20 seeded items.
    db.questions.push({id:uid('q'), text, domain:'General'});
    Store.save(db);
    this.renderQuestions();
    toast('Question added.','success');
  },
  deleteQuestion(id){
    const db = Store.db();
    db.questions = db.questions.filter(q=>q.id!==id);
    Store.save(db);
    this.renderQuestions();
    toast('Question removed.','primary');
  },
  renderReports(){
    document.getElementById('a-reports').innerHTML = `
      <h4 class="font-display mb-3">Reports</h4>
      <div class="row g-3">
        <div class="col-md-4"><div class="card-cc"><h6 class="fw-bold">Department-wise</h6><p class="small text-muted">Every assessment grouped by department.</p><button class="btn-cc-outline btn-sm" onclick="AdminUI.exportCSV('department')">Export CSV</button></div></div>
        <div class="col-md-4"><div class="card-cc"><h6 class="fw-bold">Year-wise</h6><p class="small text-muted">Every assessment grouped by academic year.</p><button class="btn-cc-outline btn-sm" onclick="AdminUI.exportCSV('year')">Export CSV</button></div></div>
        <div class="col-md-4"><div class="card-cc"><h6 class="fw-bold">Monthly</h6><p class="small text-muted">Assessment counts by month.</p><button class="btn-cc-outline btn-sm" onclick="AdminUI.exportCSV('monthly')">Export CSV</button></div></div>
        <div class="col-md-4"><div class="card-cc"><h6 class="fw-bold">Overall report</h6><p class="small text-muted">Full raw export of every assessment.</p><button class="btn-cc-outline btn-sm" onclick="AdminUI.exportCSV('overall')">Export CSV</button></div></div>
        <div class="col-md-4"><div class="card-cc"><h6 class="fw-bold">Stress distribution</h6><p class="small text-muted">Counts per stress category.</p><button class="btn-cc-outline btn-sm" onclick="AdminUI.exportCSV('distribution')">Export CSV</button></div></div>
        <div class="col-md-4"><div class="card-cc"><h6 class="fw-bold">Overall (PDF)</h6><p class="small text-muted">Summary snapshot as a PDF.</p><button class="btn-cc-outline btn-sm" onclick="AdminUI.exportPDF()">Export PDF</button></div></div>
      </div>
    `;
  },
  exportCSV(kind){
    const db = Store.db();
    let rows = [];
    if(kind==='overall'){
      rows.push(['Student ID','Name','Department','Year','Date','Score','Category']);
      db.assessments.forEach(a=>{
        const st = db.students.find(s=>s.id===a.studentId);
        rows.push([st?st.studentId:'', st?st.name:'', st?st.department:'', st?st.year:'', a.date, a.totalScore, a.category]);
      });
    } else if(kind==='department'){
      rows.push(['Department','Avg Score','Assessment Count']);
      db.departments.forEach(d=>{
        const ids = db.students.filter(s=>s.department===d.name).map(s=>s.id);
        const list = db.assessments.filter(a=>ids.includes(a.studentId));
        const avg = list.length ? (list.reduce((a,b)=>a+b.totalScore,0)/list.length).toFixed(1) : 0;
        rows.push([d.name, avg, list.length]);
      });
    } else if(kind==='year'){
      rows.push(['Year','Avg Score','Assessment Count']);
      ['1st Year','2nd Year','3rd Year','4th Year'].forEach(y=>{
        const ids = db.students.filter(s=>s.year===y).map(s=>s.id);
        const list = db.assessments.filter(a=>ids.includes(a.studentId));
        const avg = list.length ? (list.reduce((a,b)=>a+b.totalScore,0)/list.length).toFixed(1) : 0;
        rows.push([y, avg, list.length]);
      });
    } else if(kind==='monthly'){
      rows.push(['Month','Assessment Count']);
      const byMonth = {};
      db.assessments.forEach(a=>{ const m = a.date.slice(0,7); byMonth[m]=(byMonth[m]||0)+1; });
      Object.keys(byMonth).sort().forEach(m=>rows.push([m, byMonth[m]]));
    } else if(kind==='distribution'){
      rows.push(['Category','Count']);
      const c = {Low:0,Moderate:0,High:0,'Very High':0};
      db.assessments.forEach(a=>c[a.category]++);
      Object.entries(c).forEach(([k,v])=>rows.push([k,v]));
    }
    const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `report-${kind}-${todayISO()}.csv`;
    link.click();
    logAudit(db, 'admin', 'Admin', 'Exported CSV report', kind);
    Store.save(db);
    toast('CSV downloaded.','success');
  },
  exportPDF(){
    const db = Store.db();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18); doc.setFont('helvetica','bold');
    doc.text('Calm Compass — Overall Report', 14, 20);
    doc.setFontSize(11); doc.setFont('helvetica','normal');
    doc.text(`Generated: ${todayISO()}`, 14, 28);
    doc.text(`Total students: ${db.students.length}`, 14, 40);
    doc.text(`Total teachers: ${db.teachers.length}`, 14, 47);
    doc.text(`Total assessments: ${db.assessments.length}`, 14, 54);
    doc.text(`Departments: ${db.departments.length}`, 14, 61);
    const c = {Low:0,Moderate:0,High:0,'Very High':0};
    db.assessments.forEach(a=>c[a.category]++);
    doc.setFont('helvetica','bold'); doc.text('Stress distribution:', 14, 73);
    doc.setFont('helvetica','normal');
    let y = 80;
    Object.entries(c).forEach(([k,v])=>{ doc.text(`${k}: ${v}`, 18, y); y+=7; });
    doc.save(`overall-report-${todayISO()}.pdf`);
    logAudit(db, 'admin', 'Admin', 'Exported PDF summary report');
    Store.save(db);
    toast('PDF downloaded.','success');
  },
  renderBackup(){
    const db = Store.db();
    const sizeKB = Math.round((JSON.stringify(db).length / 1024) * 10) / 10;
    document.getElementById('a-backup').innerHTML = `
      <h4 class="font-display mb-3">Backup &amp; restore</h4>
      <p class="text-muted small mb-4" style="max-width:640px;">
        All data (students, teachers, assessments, departments, questions, and recommendations) lives in this browser's
        local storage — there's no external server. Export a backup regularly and whenever you move to a new browser
        or device, so nothing is ever lost.
      </p>
      <div class="row g-3">
        <div class="col-md-6">
          <div class="card-cc">
            <h6 class="fw-bold"><i class="fa-solid fa-box-archive me-1"></i>Export full backup</h6>
            <p class="small text-muted">Current database size: <span class="font-mono">${sizeKB} KB</span> · last saved ${db.lastSavedAt ? new Date(db.lastSavedAt).toLocaleString() : '—'}.</p>
            <button class="btn-cc-primary btn-sm" onclick="AdminUI.exportBackup()"><i class="fa-solid fa-download me-1"></i>Download backup (.json)</button>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card-cc">
            <h6 class="fw-bold"><i class="fa-solid fa-rotate-left me-1"></i>Restore from backup</h6>
            <p class="small text-muted">This replaces all current data in this browser with the contents of the backup file.</p>
            <input type="file" accept="application/json" class="form-control form-control-cc mb-2" id="restoreFileInput">
            <button class="btn-cc-outline btn-sm" onclick="AdminUI.importBackup()"><i class="fa-solid fa-upload me-1"></i>Restore</button>
          </div>
        </div>
      </div>
    `;
  },
  exportBackup(){
    const json = Store.exportJSON();
    const blob = new Blob([json], {type:'application/json'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `calm-compass-backup-${todayISO()}.json`;
    link.click();
    const db = Store.db();
    logAudit(db, 'admin', 'Admin', 'Exported full database backup');
    Store.save(db);
    toast('Backup downloaded.','success');
  },
  importBackup(){
    const input = document.getElementById('restoreFileInput');
    const file = input.files[0];
    if(!file){ toast('Choose a backup file first.','warning'); return; }
    if(!confirm('This will replace all current data in this browser. Continue?')) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try{
        Store.importJSON(ev.target.result);
        const db2 = Store.db();
        logAudit(db2, 'admin', 'Admin', 'Restored database from backup file', file.name);
        Store.save(db2);
        toast('Backup restored.','success');
        this.renderBackup();
        NavUI.render();
      }catch(err){
        toast(err.message || 'Could not restore that file.', 'danger');
      }
    };
    reader.readAsText(file);
  },
  renderAuditLog(){
    const db = Store.db();
    const entries = (db.auditLog || []).slice().reverse();
    const rows = entries.map(e => {
      const sensitive = /viewed student detail|deletion|restored database|deleted/i.test(e.action);
      return `<tr class="${sensitive?'audit-row-sensitive':''}">
        <td class="small font-mono">${new Date(e.at).toLocaleString()}</td>
        <td class="small text-capitalize">${escapeHtml(e.actorRole)}</td>
        <td class="small">${escapeHtml(e.actorLabel)}</td>
        <td class="small">${escapeHtml(e.action)}</td>
        <td class="small text-muted">${escapeHtml(e.detail || '')}</td>
      </tr>`;
    }).join('') || `<tr><td colspan="5" class="text-center text-muted py-3">No sensitive access has been logged yet.</td></tr>`;
    document.getElementById('a-audit').innerHTML = `
      <h4 class="font-display mb-1">Audit log</h4>
      <p class="text-muted small mb-4" style="max-width:640px;">A record of sign-ins and sensitive staff actions — viewing an individual student's detail, exporting reports, and restoring a backup. Rows highlighted in amber touch individual student data or are destructive. Kept locally; the most recent 500 entries.</p>
      <div class="table-responsive table-cc">
        <table class="table table-sm mb-0"><thead><tr><th>When</th><th>Role</th><th>Who</th><th>Action</th><th>Detail</th></tr></thead><tbody>${rows}</tbody></table>
      </div>
    `;
  },
  renderSelfTests(){
    const results = runSelfTests();
    const passCount = results.filter(r=>r.pass).length;
    const rows = results.map(r=>`
      <tr>
        <td>${r.pass ? '<span class="chip chip-low">PASS</span>' : '<span class="chip chip-vhigh">FAIL</span>'}</td>
        <td class="small fw-bold">${r.name}</td>
        <td class="small text-muted">${r.detail}</td>
      </tr>`).join('');
    document.getElementById('a-tests').innerHTML = `
      <h4 class="font-display mb-1">System self-tests</h4>
      <p class="text-muted small mb-3" style="max-width:640px;">
        Lightweight in-browser checks for scoring, role guards, and password-hash round-tripping — this is a static
        single-file app with no build/CI pipeline, so tests run live in the browser instead of a separate test runner.
        <span class="font-mono">${passCount}/${results.length} passing</span>.
      </p>
      <div class="table-responsive table-cc mb-3">
        <table class="table table-sm mb-0"><thead><tr><th>Result</th><th>Test</th><th>Detail</th></tr></thead><tbody>${rows}</tbody></table>
      </div>
      <button class="btn-cc-outline btn-sm" onclick="AdminUI.renderSelfTests()"><i class="fa-solid fa-rotate me-1" aria-hidden="true"></i>Re-run tests</button>
    `;
  }
};

/* =========================================================
   INIT
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  Store.db(); // seed if needed
  fillDeptSelect('regDept');
  NavUI.render();

  ['loginPw','regPw','regPw2','forgotNewPw','forgotNewPw2'].forEach(addPwToggle);

  const emailLink = document.getElementById('contactEmailLink');
  if(emailLink){ emailLink.href = 'mailto:' + CONFIG.supportEmail; emailLink.textContent = CONFIG.supportEmail; }
  ['aboutEmailLink','privacyEmailLink'].forEach(id=>{
    const el = document.getElementById(id);
    if(el){ el.href = 'mailto:' + CONFIG.supportEmail; el.textContent = CONFIG.supportEmail; }
  });
  const instSpan = document.getElementById('instNameSpan1');
  if(instSpan) instSpan.textContent = CONFIG.institutionName;

  const s = Store.session();
  if(s && s.role){ Router.go(s.role); }
  else { Router.go('landing'); }
});