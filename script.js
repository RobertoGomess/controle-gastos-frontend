const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const STORAGE_KEY = 'gastos_ctrl_v2';
const CSV_HEADER = 'id,descricao,categoria,valor,data_vencimento,status';

let expenses = [];
let statusFilter = 'all';
let pendingImportData = null;
let toastTimer = null;
let noticeTimer = null;
let panelOpen = false;
let googleApiLoaded = false;
let googleUserSignedIn = false;

const GOOGLE_CREDENTIALS_KEY = 'google_drive_credentials';
let GOOGLE_CONFIG = {};

function loadSavedGoogleConfig() {
  try {
    const raw = localStorage.getItem(GOOGLE_CREDENTIALS_KEY);
    if (!raw) return;
    const stored = JSON.parse(raw);
    if (stored.clientId) GOOGLE_CONFIG.clientId = stored.clientId;
    if (stored.apiKey) GOOGLE_CONFIG.apiKey = stored.apiKey;
  } catch (e) {
    console.warn('Não foi possível carregar credenciais salvas do Google:', e);
  }
}

function saveGoogleCredentials(clientId, apiKey) {
  localStorage.setItem(GOOGLE_CREDENTIALS_KEY, JSON.stringify({ clientId, apiKey }));
}

function populateGoogleCredentialFields() {
  const clientIdInput = document.getElementById('google-client-id');
  const apiKeyInput = document.getElementById('google-api-key');
  if (!clientIdInput || !apiKeyInput) return;
  clientIdInput.value = GOOGLE_CONFIG.clientId === 'YOUR_CLIENT_ID.apps.googleusercontent.com' ? '' : GOOGLE_CONFIG.clientId;
  apiKeyInput.value = GOOGLE_CONFIG.apiKey === 'YOUR_API_KEY' ? '' : GOOGLE_CONFIG.apiKey;
}

function applyGoogleCredentials() {
  const clientId = document.getElementById('google-client-id').value.trim();
  const apiKey = document.getElementById('google-api-key').value.trim();
  if (!clientId || !apiKey) {
    showToast('Preencha clientId e apiKey do Google');
    return;
  }
  GOOGLE_CONFIG.clientId = clientId;
  GOOGLE_CONFIG.apiKey = apiKey;
  saveGoogleCredentials(clientId, apiKey);
  initGoogleAPI();
  showToast('Credenciais do Google aplicadas');
}

const now = new Date();
let selYear = now.getFullYear();
let selMonth = now.getMonth();

// ── Panel toggle ──────────────────────────────────────────
function togglePanel() {
  panelOpen = !panelOpen;
  document.getElementById('panel-toggle').classList.toggle('open', panelOpen);
  document.getElementById('panel-body').classList.toggle('open', panelOpen);
  if (panelOpen) setTimeout(() => document.getElementById('f-desc').focus(), 320);
}

// ── CSV ───────────────────────────────────────────────────
function toCSV(list) {
  return CSV_HEADER + '\n' + list.map(e => [
    e.id,
    '"' + String(e.desc||'').replace(/"/g,'""') + '"',
    '"' + String(e.cat||'').replace(/"/g,'""') + '"',
    parseFloat(e.val).toFixed(2),
    e.date, e.status
  ].join(',')).join('\n');
}

function fromCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l=>l.trim());
  if (!lines.length) return null;
  const start = lines[0].toLowerCase().replace(/\s/g,'').startsWith('id,') ? 1 : 0;
  const parsed = [];
  for (const line of lines.slice(start)) {
    const fields=[], len=line.length; let cur='', inQ=false;
    for (let i=0;i<len;i++) {
      const ch=line[i];
      if (ch==='"'&&!inQ) inQ=true;
      else if (ch==='"'&&inQ&&line[i+1]==='"') { cur+='"'; i++; }
      else if (ch==='"'&&inQ) inQ=false;
      else if (ch===','&&!inQ) { fields.push(cur); cur=''; }
      else cur+=ch;
    }
    fields.push(cur);
    if (fields.length<5) continue;
    const [idR,desc,cat,valR,date,status]=fields;
    const val=parseFloat(valR);
    if (!desc||!date||isNaN(val)) continue;
    parsed.push({id:parseInt(idR)||Date.now()+Math.random(), desc:desc.trim(), cat:(cat||'Outros').trim(), val, date:date.trim(), status:(status||'pending').trim()});
  }
  return parsed.length ? parsed : null;
}

function exportCSV() {
  const blob = new Blob(['\uFEFF'+toCSV(expenses)], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='gastos.csv'; a.click();
  URL.revokeObjectURL(url);
  showToast('gastos.csv baixado com '+expenses.length+' registro(s)');
}

// ── Storage ───────────────────────────────────────────────
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses)); }
function load() {
  try { const s=localStorage.getItem(STORAGE_KEY); if(s){expenses=JSON.parse(s);return;} } catch(e){}
  seedData();
}
function seedData() {
  const fmt=d=>d.toISOString().split('T')[0];
  const add=(b,n)=>{const d=new Date(b);d.setDate(d.getDate()+n);return fmt(d);};
  const mk=(y,m,d)=>fmt(new Date(y,m,d));
  const pm=selMonth-1<0?11:selMonth-1, pmY=selMonth-1<0?selYear-1:selYear;
  const nm=selMonth+1>11?0:selMonth+1, nmY=selMonth+1>11?selYear+1:selYear;
  expenses=[
    {id:1,desc:'Aluguel',cat:'Moradia',val:1200,date:add(now,3),status:'pending'},
    {id:2,desc:'Cartão Nubank',cat:'Outros',val:450.80,date:add(now,1),status:'pending'},
    {id:3,desc:'Academia',cat:'Saúde',val:89.90,date:add(now,-2),status:'pending'},
    {id:4,desc:'Internet',cat:'Moradia',val:120,date:add(now,10),status:'paid'},
    {id:5,desc:'Supermercado',cat:'Alimentação',val:380,date:add(now,-5),status:'paid'},
    {id:6,desc:'Aluguel',cat:'Moradia',val:1200,date:mk(pmY,pm,5),status:'paid'},
    {id:7,desc:'Internet',cat:'Moradia',val:120,date:mk(pmY,pm,10),status:'paid'},
    {id:8,desc:'Plano de saúde',cat:'Saúde',val:320,date:mk(nmY,nm,15),status:'pending'},
  ];
  save();
}

// ── Import modal ──────────────────────────────────────────
function openImportModal() {
  pendingImportData=null;
  document.getElementById('import-preview').className='import-preview';
  document.getElementById('import-preview').innerHTML='';
  document.getElementById('import-confirm').style.display='none';
  document.getElementById('import-feedback').className='modal-feedback';
  document.getElementById('drop-zone').querySelector('strong').textContent='Clique para selecionar';
  document.getElementById('drop-zone').querySelector('p').textContent='ou arraste o .csv aqui';
  document.getElementById('csv-file-input').value='';
  document.getElementById('import-modal').classList.add('open');
}
function closeImportModal() { document.getElementById('import-modal').classList.remove('open'); }

function handleCSVFile(file) {
  if (!file||!file.name.toLowerCase().endsWith('.csv')) { showModalFeedback('import-feedback','Selecione um arquivo .csv válido.','err'); return; }
  const reader=new FileReader();
  reader.onload=e=>{
    const parsed=fromCSV(e.target.result);
    if (!parsed) { showModalFeedback('import-feedback','Arquivo inválido. Use um CSV exportado por este app.','err'); return; }
    pendingImportData=parsed;
    const prev=document.getElementById('import-preview');
    prev.className='import-preview show';
    prev.innerHTML='<strong>'+parsed.length+' gasto(s) encontrado(s):</strong><br>'+
      parsed.slice(0,5).map(e=>'• '+e.desc+' — R$ '+parseFloat(e.val).toFixed(2)+' — '+e.date).join('<br>')+
      (parsed.length>5?'<br><em>...e mais '+(parsed.length-5)+'</em>':'');
    document.getElementById('import-confirm').style.display='inline-flex';
    document.getElementById('drop-zone').querySelector('strong').textContent=file.name;
    document.getElementById('drop-zone').querySelector('p').textContent='Clique para trocar o arquivo';
  };
  reader.readAsText(file,'UTF-8');
}
function confirmImport() {
  if (!pendingImportData) return;
  expenses=pendingImportData; save(); closeImportModal(); buildYearSelect(); render();
  showToast(expenses.length+' gasto(s) importado(s) com sucesso');
}

document.getElementById('csv-file-input').addEventListener('change',function(){if(this.files[0])handleCSVFile(this.files[0]);});
const dz=document.getElementById('drop-zone');
dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('drag');});
dz.addEventListener('dragleave',()=>dz.classList.remove('drag'));
dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('drag');handleCSVFile(e.dataTransfer.files[0]);});

// ── Notifications ─────────────────────────────────────────
function showToast(msg) {
  const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),3500);
}
function showNotice(msg,ms=5000) {
  document.getElementById('csv-notice-text').textContent=msg;
  document.getElementById('csv-notice').classList.add('show');
  clearTimeout(noticeTimer); noticeTimer=setTimeout(()=>document.getElementById('csv-notice').classList.remove('show'),ms);
}
function showModalFeedback(id,msg,type) { const el=document.getElementById(id); el.className='modal-feedback '+type; el.textContent=msg; }

// ── Helpers ───────────────────────────────────────────────
function todayStr() { return new Date().toISOString().split('T')[0]; }
function daysUntil(ds) { return Math.round((new Date(ds+'T00:00:00')-new Date(todayStr()+'T00:00:00'))/86400000); }
function statusInfo(exp) {
  if (exp.status==='paid') return {key:'paid',label:'Pago'};
  return daysUntil(exp.date)<0 ? {key:'overdue',label:'Vencido'} : {key:'pending',label:'Aguardando'};
}
function fmtDate(ds) { const[y,m,d]=ds.split('-'); return d+'/'+m+'/'+y; }
function fmtVal(v) { return 'R$ '+parseFloat(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }

// ── Theme ────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  setTheme(saved);
}
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');
  if (theme === 'dark') {
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  } else {
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  }
}
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  setTheme(current === 'light' ? 'dark' : 'light');
}

// ── Year select ───────────────────────────────────────────
function buildYearSelect() {
  const set=new Set(expenses.map(e=>parseInt(e.date.split('-')[0]))); set.add(new Date().getFullYear());
  document.getElementById('sel-year').innerHTML=[...set].sort().map(y=>'<option value="'+y+'"'+(y===selYear?' selected':'')+'>'+y+'</option>').join('');
}
function onYearChange(){selYear=parseInt(document.getElementById('sel-year').value);render();}
function navPeriod(dir) {
  const ms=document.getElementById('sel-month');
  if (ms.value==='all'){selYear+=dir;}
  else{let m=parseInt(ms.value)+dir;if(m>11){m=0;selYear++;}else if(m<0){m=11;selYear--;}selMonth=m;ms.value=m;}
  buildYearSelect();document.getElementById('sel-year').value=selYear;render();
}
function goToday(){
  selYear=new Date().getFullYear();selMonth=new Date().getMonth();
  buildYearSelect();
  document.getElementById('sel-year').value=selYear;
  document.getElementById('sel-month').value=selMonth;
  render();
}

// ── Filter + render ───────────────────────────────────────
function getFiltered(){
  const mv=document.getElementById('sel-month').value;
  let list=expenses.filter(e=>{const[y,m]=e.date.split('-').map(Number);return y===selYear&&(mv==='all'||m-1===parseInt(mv));});
  if(statusFilter==='pending') list=list.filter(e=>statusInfo(e).key==='pending');
  else if(statusFilter==='paid') list=list.filter(e=>statusInfo(e).key==='paid');
  else if(statusFilter==='overdue') list=list.filter(e=>statusInfo(e).key==='overdue');
  return list.sort((a,b)=>a.date.localeCompare(b.date));
}

function render(){
  selYear=parseInt(document.getElementById('sel-year').value||selYear);
  buildYearSelect();renderSummary();renderAlerts();renderList();
}

function renderSummary(){
  const mv=document.getElementById('sel-month').value;
  const base=expenses.filter(e=>{const[y,m]=e.date.split('-').map(Number);return y===selYear&&(mv==='all'||m-1===parseInt(mv));});
  const total=base.reduce((s,e)=>s+parseFloat(e.val),0);
  const paid=base.filter(e=>e.status==='paid').reduce((s,e)=>s+parseFloat(e.val),0);
  const pending=base.filter(e=>statusInfo(e).key==='pending').reduce((s,e)=>s+parseFloat(e.val),0);
  const period=mv==='all'?String(selYear):MONTHS[parseInt(mv)]+' '+selYear;
  document.getElementById('summary').innerHTML=`
    <div class="card card-total">
      <div class="card-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="14" height="10" rx="2"/><path d="M1 7h14"/><circle cx="4.5" cy="10.5" r="1"/></svg></div>
      <div class="card-label">Total do período</div>
      <div class="card-value">${fmtVal(total)}</div>
      <div class="card-period">${period}</div>
    </div>
    <div class="card card-pending">
      <div class="card-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--amber)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1"/></svg></div>
      <div class="card-label">Pendente</div>
      <div class="card-value">${fmtVal(pending)}</div>
      <div class="card-period">${base.filter(e=>statusInfo(e).key==='pending').length} gasto(s)</div>
    </div>
    <div class="card card-paid">
      <div class="card-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--green)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M5.5 8l2 2 3-3"/></svg></div>
      <div class="card-label">Pago</div>
      <div class="card-value">${fmtVal(paid)}</div>
      <div class="card-period">${base.filter(e=>e.status==='paid').length} gasto(s)</div>
    </div>`;
}

function renderAlerts(){
  const alerts=expenses.filter(e=>statusInfo(e).key!=='paid'&&daysUntil(e.date)<=3);
  const box=document.getElementById('alert-banner');
  if(!alerts.length){box.classList.remove('show');return;}
  box.classList.add('show');
  document.getElementById('alert-items').innerHTML=alerts.map(e=>{
    const d=daysUntil(e.date);
    const msg=d<0?'Venceu há '+Math.abs(d)+' dia(s)':d===0?'<strong>Vence hoje</strong>':d===1?'Vence amanhã':'Vence em '+d+' dias';
    return '<span>• <strong>'+e.desc+'</strong> — '+fmtVal(e.val)+' — '+msg+'</span>';
  }).join('<br>');
}

function rowHTML(exp){
  const si=statusInfo(exp),d=daysUntil(exp.date);
  let dc='item-date';if(si.key==='overdue')dc+=' overdue';else if(si.key==='pending'&&d<=3)dc+=' soon';
  return '<div class="list-row">'+
    '<div><div class="item-name">'+exp.desc+'</div><span class="item-cat">'+exp.cat+'</span></div>'+
    '<div class="'+dc+'">'+fmtDate(exp.date)+'</div>'+
    '<div class="item-val">'+fmtVal(exp.val)+'</div>'+
    '<div><button class="status-badge '+si.key+'" onclick="toggleStatus('+exp.id+')">'+si.label+'</button></div>'+
    '<div><button class="del-btn" onclick="delExpense('+exp.id+')" title="Remover">'+
      '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 4h10M6 4V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V4M5 4l.5 9h5L11 4"/></svg>'+
    '</button></div>'+
  '</div>';
}

function renderList(){
  const mv=document.getElementById('sel-month').value;
  const el=document.getElementById('expense-list');
  const visible=getFiltered();
  if(!visible.length){
    el.innerHTML='<div class="empty-state">'+
      '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 14h6"/></svg>'+
      '<strong>Nenhum gasto aqui</strong><p>Tente outro período ou filtro</p></div>';
    return;
  }
  if(mv==='all'){
    const byM={};
    visible.forEach(e=>{const m=parseInt(e.date.split('-')[1])-1;if(!byM[m])byM[m]=[];byM[m].push(e);});
    el.innerHTML=Object.keys(byM).sort((a,b)=>a-b).map(m=>{
      const items=byM[m];
      const total=items.reduce((s,e)=>s+parseFloat(e.val),0);
      const paidCount=items.filter(e=>e.status==='paid').length;
      return '<div class="month-divider">'+
        '<span class="month-name">'+MONTHS[m]+'</span>'+
        '<div class="month-meta">'+
          '<span>'+items.length+' gasto(s)</span>'+
          '<span class="m-total">'+fmtVal(total)+'</span>'+
          '<span style="color:var(--green)">'+paidCount+' pago(s)</span>'+
        '</div></div>'+items.map(rowHTML).join('');
    }).join('');
  } else {
    el.innerHTML=visible.map(rowHTML).join('');
  }
}

// ── CRUD ──────────────────────────────────────────────────
function addExpense(){
  const desc=document.getElementById('f-desc').value.trim();
  const val=parseFloat(document.getElementById('f-val').value);
  const date=document.getElementById('f-date').value;
  const cat=document.getElementById('f-cat').value;
  const status=document.getElementById('f-status').value;
  if(!desc||!val||!date){
    // Shake invalid fields
    ['f-desc','f-val','f-date'].forEach(id=>{
      const el=document.getElementById(id);
      if(!el.value){el.style.borderColor='var(--red)';el.style.boxShadow='0 0 0 3px rgba(220,38,38,.1)';
        setTimeout(()=>{el.style.borderColor='';el.style.boxShadow='';},2000);}
    });
    showToast('Preencha descrição, valor e data'); return;
  }
  expenses.push({id:Date.now(),desc,cat,val,date,status});
  const[y,m]=date.split('-').map(Number);
  selYear=y;document.getElementById('sel-month').value=m-1;
  buildYearSelect();document.getElementById('sel-year').value=selYear;
  save();render();clearForm();
  showNotice('Gasto adicionado. Exporte o CSV para salvar o arquivo.');
  showToast('Gasto adicionado');
}

function clearForm(){
  ['f-desc','f-val','f-date'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('f-status').value='pending';
}

function delExpense(id){
  if(!confirm('Remover este gasto?'))return;
  expenses=expenses.filter(e=>e.id!==id);save();render();
  showNotice('Gasto removido. Exporte o CSV para salvar.');
  showToast('Gasto removido');
}

function toggleStatus(id){
  const e=expenses.find(e=>e.id===id);if(!e)return;
  e.status=e.status==='paid'?'pending':'paid';save();render();
  showNotice('Status atualizado. Exporte o CSV para salvar.');
}

function setFilter(f,btn){
  statusFilter=f;
  document.querySelectorAll('.filter-pill').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');render();
}



// ── Close on backdrop ─────────────────────────────────────
['import-modal'].forEach(id=>{
  document.getElementById(id).addEventListener('click',function(e){if(e.target===this)this.classList.remove('open');});
});

// Fechar menu Google Drive ao clicar fora
document.addEventListener('click', e => {
  const menu = document.getElementById('google-drive-menu');
  const btn = document.getElementById('google-drive-btn');
  if (menu && btn && e.target !== menu && e.target !== btn && !btn.contains(e.target) && !menu.contains(e.target)) {
    menu.style.display = 'none';
  }
});

// ── Keyboard ──────────────────────────────────────────────
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){['import-modal'].forEach(id=>document.getElementById(id).classList.remove('open'));}
  if(e.key==='Enter'&&document.getElementById('panel-body').classList.contains('open')){
    if(document.activeElement!==document.getElementById('f-date'))addExpense();
  }
});

// ── Google Drive Integration ──────────────────────────────
function initGoogleAPI() {
  if (!GOOGLE_CONFIG.clientId || !GOOGLE_CONFIG.apiKey ||
      GOOGLE_CONFIG.clientId.includes('YOUR_CLIENT_ID') ||
      GOOGLE_CONFIG.apiKey.includes('YOUR_API_KEY')) {
    googleApiLoaded = false;
    return;
  }
  gapi.load('client:auth2', () => {
    gapi.auth2.init({
      client_id: GOOGLE_CONFIG.clientId,
      scope: GOOGLE_CONFIG.scopes,
      cookie_policy: 'single_host_origin'
    }).then(() => {
      return gapi.client.init({
        apiKey: GOOGLE_CONFIG.apiKey,
        discoveryDocs: GOOGLE_CONFIG.discoveryDocs
      });
    }).then(() => {
      googleApiLoaded = true;
      const auth2 = gapi.auth2.getAuthInstance();
      updateGoogleUIState(auth2.isSignedIn.get());
      auth2.isSignedIn.listen(updateGoogleUIState);
    }).catch(e => console.error('Erro ao inicializar Google API:', e));
  });
}

function updateGoogleUIState(isSignedIn) {
  googleUserSignedIn = isSignedIn;
  const authBtn = document.getElementById('google-auth-btn');
  const driveBtn = document.getElementById('google-drive-btn');
  if (isSignedIn) {
    authBtn.style.display = 'none';
    driveBtn.style.display = 'inline-flex';
  } else {
    authBtn.style.display = 'inline-flex';
    driveBtn.style.display = 'none';
  }
}

function signInGoogle() {
  if (!googleApiLoaded) {
    showToast('Google API ainda está carregando...');
    return;
  }
  gapi.auth2.getAuthInstance().signIn();
}

function signOutGoogle() {
  gapi.auth2.getAuthInstance().signOut();
  toggleGoogleDriveMenu();
  showToast('Desconectado do Google Drive');
}

function toggleGoogleDriveMenu() {
  const menu = document.getElementById('google-drive-menu');
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

async function importFromGoogleDrive() {
  if (!googleUserSignedIn) {
    showToast('Faça login no Google Drive primeiro');
    return;
  }
  try {
    const response = await gapi.client.drive.files.list({
      q: `name='${GOOGLE_DRIVE_FILENAME}' and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name)',
      pageSize: 1
    });

    const files = response.result.files;
    if (files.length === 0) {
      showToast('Nenhum arquivo gastos.csv encontrado no Google Drive');
      return;
    }

    const fileId = files[0].id;
    const fileContent = await gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media'
    });

    const parsed = fromCSV(fileContent.body);
    if (!parsed) {
      showToast('Erro ao ler o arquivo do Google Drive');
      return;
    }

    expenses = parsed;
    save();
    buildYearSelect();
    render();
    toggleGoogleDriveMenu();
    showToast(expenses.length + ' gasto(s) importado(s) do Google Drive');
  } catch (error) {
    console.error('Erro ao importar do Google Drive:', error);
    showToast('Erro ao importar do Google Drive');
  }
}

async function exportToGoogleDrive() {
  if (!googleUserSignedIn) {
    showToast('Faça login no Google Drive primeiro');
    return;
  }
  try {
    const csvContent = toCSV(expenses);
    
    // Procurar arquivo existente
    const response = await gapi.client.drive.files.list({
      q: `name='${GOOGLE_DRIVE_FILENAME}' and trashed=false`,
      spaces: 'drive',
      fields: 'files(id)',
      pageSize: 1
    });

    const files = response.result.files;
    const boundary = '-------314159265358979323846';
    const delimiter = '\r\n--' + boundary + '\r\n';
    const closeDelim = '\r\n--' + boundary + '--';

    const metadata = {
      name: GOOGLE_DRIVE_FILENAME,
      mimeType: 'text/csv'
    };

    const body = delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: text/csv\r\n\r\n' +
      csvContent +
      closeDelim;

    if (files.length > 0) {
      // Atualizar arquivo existente
      await gapi.client.request({
        path: '/upload/drive/v3/files/' + files[0].id + '?uploadType=multipart',
        method: 'PATCH',
        headers: {
          'Content-Type': 'multipart/related; boundary="' + boundary + '"'
        },
        body: body
      });
    } else {
      // Criar novo arquivo
      await gapi.client.request({
        path: '/upload/drive/v3/files?uploadType=multipart',
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/related; boundary="' + boundary + '"'
        },
        body: body
      });
    }

    toggleGoogleDriveMenu();
    showToast('✓ Exportado com sucesso para o Google Drive');
  } catch (error) {
    console.error('Erro ao exportar para Google Drive:', error);
    showToast('Erro ao exportar para Google Drive');
  }
}

// ── Init ──────────────────────────────────────────────────
initTheme();
loadSavedGoogleConfig();
populateGoogleCredentialFields();
initGoogleAPI();
load();
buildYearSelect();
document.getElementById('sel-year').value=selYear;
document.getElementById('sel-month').value=selMonth;
render();
