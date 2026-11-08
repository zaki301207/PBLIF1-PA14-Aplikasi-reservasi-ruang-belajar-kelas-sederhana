const KEY='reservasi_ruang_v1';
const iso=d=>d.toISOString().slice(0,10);
const NOW=new Date(),D=n=>iso(new Date(NOW.getTime()+n*864e5));
let db={
 rooms:[{id:1,nama:'Ruang 101',lokasi:'Gedung A Lt. 1',kapasitas:30,aktif:true},{id:2,nama:'Ruang 102',lokasi:'Gedung A Lt. 1',kapasitas:25,aktif:true},{id:3,nama:'Ruang 103',lokasi:'Gedung A Lt. 2',kapasitas:40,aktif:false}],
 users:[{nim:'admin',nama:'Admin',kelas:'-',role:'Admin/Petugas',pass:'admin123'},{nim:'3312601028',nama:'Mahasiswa',kelas:'IF 1A',role:'Ketua/Anggota',pass:'mhs123'}],
 res:[{id:1,ruang:1,nim:'3312601028',tanggal:D(1),mulai:'08:00',selesai:'10:00',perlu:'Diskusi',status:'Pending'},{id:2,ruang:2,nim:'3312601028',tanggal:D(1),mulai:'10:00',selesai:'12:00',perlu:'Belajar',status:'Pending'},{id:3,ruang:1,nim:'3312601028',tanggal:D(2),mulai:'13:00',selesai:'15:00',perlu:'Rapat',status:'Disetujui'}],
 nid:{r:4,x:4}
};
try{const s=localStorage.getItem(KEY);if(s)db=JSON.parse(s)}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){}};
let me=null,page='dashboard',tab='ruang',q='',edit=null,pre=null,lapRows=[];
let dash={tgl:D(0),mulai:'08:00',selesai:'10:00'};
let lap={a:D(-30),b:D(30),r:''};

const $=id=>document.getElementById(id);
const val=id=>$(id).value.trim();
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sb=x=>`<span class="bd ${x=='Disetujui'?'ok':x=='Ditolak'?'bad':'wait'}">${x}</span>`;
const isAdmin=()=>me.role=='Admin/Petugas';
const rn=id=>(db.rooms.find(r=>r.id==id)||{nama:'-'}).nama;
const un=nim=>(db.users.find(u=>u.nim==nim)||{nama:nim}).nama;
const tm=s=>{const p=s.split(':');return p[0]*60+ +p[1]};
const hrs=r=>(tm(r.selesai)-tm(r.mulai))/60;
const fmt=d=>d.split('-').reverse().join('/');
const busy=(rid,tg,m,s,ign)=>db.res.some(r=>r.id!=ign&&r.ruang==rid&&r.tanggal==tg&&r.status!='Ditolak'&&r.mulai<s&&m<r.selesai);
function toast(m,ok=true){const e=document.createElement('div');e.className='t '+(ok?'ok':'bad');e.textContent=(ok?'Berhasil: ':'Gagal: ')+m;$('toast').appendChild(e);setTimeout(()=>e.remove(),3500)}

/* ---------- Login ---------- */
function loginView(){return `<form class="login" onsubmit="return doLogin()">
<div class="box logo">LOGO / NAMA APLIKASI</div>
<label for="nim">NIM</label><input id="nim" placeholder="Masukkan NIM" autocomplete="username" required>
<label for="pw">Password</label><input id="pw" type="password" placeholder="Masukkan password" autocomplete="current-password" required>
<button class="box" style="width:100%;margin-top:18px">Masuk</button>
<div class="hint">Belum punya akun? Hubungi Admin/Petugas</div>
<div class="hint">Akun contoh. Admin: admin / admin123. Anggota: 3312601028 / mhs123</div></form>`}
function doLogin(){const u=db.users.find(x=>x.nim==val('nim')&&x.pass==$('pw').value);
 if(!u){toast('NIM atau password salah',false);return false}
 me=u;page='dashboard';q='';render();toast('Selamat datang, '+u.nama);return false}
function logout(){me=null;render()}
function go(k){page=k;tab='ruang';edit=null;q='';render()}
function setTab(t){tab=t;edit=null;render()}

/* ---------- Views ---------- */
const views={
dashboard(){
 const cards=db.rooms.map(r=>{
  const st=!r.aktif?'Nonaktif':busy(r.id,dash.tgl,dash.mulai,dash.selesai)?'Terpakai':'Tersedia';
  const cl=st=='Tersedia'?'':st=='Terpakai'?' bad':' off';
  const b=st=='Tersedia'?`<button class="box btn ok" onclick="reserve(${r.id})">Reservasi</button>`:`<button class="box btn dis" disabled>${st=='Terpakai'?'Sudah Terpakai':'Tidak Aktif'}</button>`;
  return `<div class="card${cl}" data-s="${esc((r.nama+' '+r.lokasi+' '+st).toLowerCase())}"><div class="photo">Foto ruang</div><b>${esc(r.nama)}</b><p>Lokasi : ${esc(r.lokasi)}</p><p>Kapasitas : ${r.kapasitas} orang</p><p>Status : <span class="bd ${st=='Tersedia'?'ok':st=='Terpakai'?'bad':'off'}">${st}</span></p>${b}</div>`}).join('');
 return `<h1>Dashboard</h1><div class="row">
<input type="date" id="dt" value="${dash.tgl}" aria-label="Tanggal"><input type="time" id="dm" value="${dash.mulai}" aria-label="Jam mulai"><input type="time" id="ds" value="${dash.selesai}" aria-label="Jam selesai">
<button class="box" onclick="cek()">Cek</button></div>
<p class="note">Status ruang untuk ${fmt(dash.tgl)}, pukul ${dash.mulai} sampai ${dash.selesai}.</p><div class="cards">${cards}</div>`},

master(){
 const tabs=`<div class="tabs"><button class="box ${tab=='ruang'?'on':''}" onclick="setTab('ruang')">Ruang</button><button class="box ${tab=='pengguna'?'on':''}" onclick="setTab('pengguna')">Pengguna</button></div>`;
 if(tab=='ruang'){
  const e=db.rooms.find(r=>r.id==edit)||{nama:'',lokasi:'',kapasitas:'',aktif:true};
  return `<h1>Data Master</h1>${tabs}<div class="tw"><table><tr><th>No</th><th>Nama Ruang</th><th>Lokasi</th><th>Kapasitas</th><th>Status</th><th>Aksi</th></tr>
${db.rooms.map((r,i)=>`<tr data-s="${esc((r.nama+' '+r.lokasi).toLowerCase())}"><td>${i+1}</td><td>${esc(r.nama)}</td><td>${esc(r.lokasi)}</td><td>${r.kapasitas}</td><td><span class="bd ${r.aktif?'ok':'off'}">${r.aktif?'Aktif':'Nonaktif'}</span></td><td><button class="box sm edit" onclick="edit=${r.id};render()">Ubah</button><button class="box sm danger" onclick="delRuang(${r.id})">Hapus</button></td></tr>`).join('')}</table></div>
<div class="form"><b>Form ${edit?'ubah':'tambah'} ruang</b><div class="fg">
<div><label for="rn">Nama ruang</label><input id="rn" value="${esc(e.nama)}" placeholder="Contoh: Ruang 101"></div>
<div><label for="rl">Lokasi</label><input id="rl" value="${esc(e.lokasi)}" placeholder="Contoh: Gedung A Lt. 1"></div>
<div><label for="rk">Kapasitas</label><input id="rk" type="number" min="1" value="${e.kapasitas}" placeholder="Contoh: 30"></div>
<div><label for="ra">Status</label><select id="ra"><option value="1" ${e.aktif?'selected':''}>Aktif</option><option value="0" ${e.aktif?'':'selected'}>Nonaktif</option></select></div></div>
<button class="box" onclick="saveRuang()">Simpan</button> <button class="box gray" onclick="edit=null;render()">Batal</button></div>`}
 return `<h1>Data Master</h1>${tabs}<div class="tw"><table><tr><th>No</th><th>NIM / Username</th><th>Nama</th><th>Kelas</th><th>Peran</th><th>Aksi</th></tr>
${db.users.map((u,i)=>`<tr data-s="${esc((u.nim+' '+u.nama+' '+u.kelas).toLowerCase())}"><td>${i+1}</td><td>${esc(u.nim)}</td><td>${esc(u.nama)}</td><td>${esc(u.kelas)}</td><td>${u.role}</td><td>${u.nim==me.nim?'-':`<button class="box sm danger" onclick="delUser('${esc(u.nim)}')">Hapus</button>`}</td></tr>`).join('')}</table></div>
<div class="form"><b>Form tambah pengguna</b><div class="fg">
<div><label for="un">NIM</label><input id="un" placeholder="Contoh: 3312601028"></div>
<div><label for="um">Nama</label><input id="um" placeholder="Nama lengkap"></div>
<div><label for="uk">Kelas</label><input id="uk" placeholder="Contoh: IF 1A"></div>
<div><label for="up">Password awal</label><input id="up" type="password" placeholder="Minimal 6 karakter"></div></div>
<button class="box" onclick="saveUser()">Simpan</button></div>`},

transaksi(){
 const ad=isAdmin(),p=pre||{};pre=null;
 const list=db.res.filter(r=>ad||r.nim==me.nim).sort((a,b)=>(a.tanggal+a.mulai).localeCompare(b.tanggal+b.mulai));
 const rows=list.map((r,i)=>{
  let a='';
  if(ad&&r.status=='Pending')a+=`<button class="box sm ok" onclick="setStatus(${r.id},'Disetujui')">Setuju</button><button class="box sm danger" onclick="setStatus(${r.id},'Ditolak')">Tolak</button>`;
  if(ad)a+=`<button class="box sm danger" onclick="delRes(${r.id})">Hapus</button>`;
  else if(r.status=='Pending')a+=`<button class="box sm danger" onclick="delRes(${r.id})">Batalkan</button>`;
  return `<tr data-s="${esc((rn(r.ruang)+' '+un(r.nim)+' '+r.perlu+' '+r.status).toLowerCase())}"><td>${i+1}</td><td>${esc(rn(r.ruang))}</td><td>${fmt(r.tanggal)}</td><td>${r.mulai}-${r.selesai}</td>${ad?`<td>${esc(un(r.nim))}</td>`:''}<td>${esc(r.perlu)}</td><td>${sb(r.status)}</td><td>${a||'-'}</td></tr>`}).join('');
 return `<h1>Transaksi</h1><div class="form" style="margin:0 0 18px"><b>Form reservasi</b><div class="fg">
<div><label for="fr">Ruang</label><select id="fr">${db.rooms.filter(r=>r.aktif).map(r=>`<option value="${r.id}" ${p.ruang==r.id?'selected':''}>${esc(r.nama)}</option>`).join('')}</select></div>
<div><label for="ft">Tanggal</label><input type="date" id="ft" min="${D(0)}" value="${p.tanggal||D(0)}"></div>
<div><label for="fm">Jam mulai</label><input type="time" id="fm" value="${p.mulai||'08:00'}"></div>
<div><label for="fs">Jam selesai</label><input type="time" id="fs" value="${p.selesai||'10:00'}"></div></div>
<div class="fg"><div style="flex:3"><label for="fk">Keperluan</label><input id="fk" maxlength="100" placeholder="Contoh: Diskusi kelompok"></div></div>
<button class="box" onclick="ajukan()">Ajukan</button> <button class="box gray" onclick="render()">Batal</button></div>
<b>Daftar reservasi</b><div class="tw"><table><tr><th>No</th><th>Ruang</th><th>Tanggal</th><th>Jam</th>${ad?'<th>Pemohon</th>':''}<th>Keperluan</th><th>Status</th><th>Aksi</th></tr>${rows||`<tr><td colspan="${ad?8:7}">Belum ada reservasi. Isi form di atas untuk mengajukan.</td></tr>`}</table></div>
<p class="note">${ad?'Tombol Setuju dan Tolak hanya tampil untuk Admin/Petugas.':'Anda hanya melihat reservasi milik Anda. Reservasi berstatus Pending masih bisa dibatalkan.'}</p>`},

laporan(){
 lapRows=db.rooms.filter(r=>!lap.r||r.id==lap.r).map(r=>{
  const x=db.res.filter(v=>v.ruang==r.id&&v.tanggal>=lap.a&&v.tanggal<=lap.b),ok=x.filter(v=>v.status=='Disetujui');
  return{n:r.nama,j:x.length,s:ok.length,t:x.filter(v=>v.status=='Ditolak').length,h:Number(ok.reduce((a,v)=>a+hrs(v),0).toFixed(1))}});
 const tot=k=>Number(lapRows.reduce((a,r)=>a+r[k],0).toFixed(1));
 return `<h1>Laporan</h1><div class="row noprint">
<input type="date" id="la" value="${lap.a}" aria-label="Tanggal awal"><input type="date" id="lb" value="${lap.b}" aria-label="Tanggal akhir">
<select id="lr" aria-label="Ruang"><option value="">Semua ruang</option>${db.rooms.map(r=>`<option value="${r.id}" ${lap.r==r.id?'selected':''}>${esc(r.nama)}</option>`).join('')}</select>
<button class="box" onclick="applyLap()">Tampilkan</button><button class="box teal" onclick="window.print()">Cetak</button><button class="box teal" onclick="exportCsv()">Ekspor</button></div>
<p class="note">Rekap pemakaian ruang periode ${fmt(lap.a)} sampai ${fmt(lap.b)}. Total jam dihitung dari reservasi yang disetujui.</p>
<div class="tw"><table><tr><th>No</th><th>Nama Ruang</th><th>Jumlah Reservasi</th><th>Disetujui</th><th>Ditolak</th><th>Total Jam</th></tr>
${lapRows.map((r,i)=>`<tr data-s="${esc(r.n.toLowerCase())}"><td>${i+1}</td><td>${esc(r.n)}</td><td>${r.j}</td><td>${r.s}</td><td>${r.t}</td><td>${r.h}</td></tr>`).join('')}
<tfoot><tr><td colspan="2">Total</td><td>${tot('j')}</td><td>${tot('s')}</td><td>${tot('t')}</td><td>${tot('h')}</td></tr></tfoot></table></div>`}
};

/* ---------- Render ---------- */
function render(){
 const A=$('app');document.body.classList.toggle('lg',!me);
 if(!me){A.innerHTML=loginView();return}
 const ad=isAdmin();
 if(!ad&&(page=='master'||page=='laporan'))page='dashboard';
 const menu=[['dashboard','Dashboard'],ad&&['master','Data Master'],['transaksi','Transaksi'],ad&&['laporan','Laporan']].filter(Boolean);
 A.innerHTML=`<header class="top"><div class="box logo">LOGO / NAMA APLIKASI</div>
<input id="q" class="search" type="search" placeholder="Pencarian" value="${esc(q)}" aria-label="Pencarian">
<button class="box" onclick="logout()" title="Keluar dari aplikasi">${esc(me.nama)} (Keluar)</button></header>
<div class="wrap"><nav><b>MENU</b>${menu.map(m=>`<button class="box ${page==m[0]?'on':''}" onclick="go('${m[0]}')">${m[1]}</button>`).join('')}</nav><main>${views[page]()}</main></div>`;
 $('q').oninput=e=>{q=e.target.value;filt()};
 filt();
}
function filt(){const s=q.toLowerCase();document.querySelectorAll('[data-s]').forEach(e=>e.hidden=!e.dataset.s.includes(s))}

/* ---------- Aksi ---------- */
function cek(){const t=val('dt'),m=val('dm'),s=val('ds');
 if(!t||!m||!s||m>=s){toast('Isi tanggal dan jam dengan benar. Jam mulai harus sebelum jam selesai',false);return}
 dash={tgl:t,mulai:m,selesai:s};render();toast('Status ruang diperbarui')}
function reserve(id){pre={ruang:id,tanggal:dash.tgl,mulai:dash.mulai,selesai:dash.selesai};page='transaksi';q='';render()}

function saveRuang(){const n=val('rn'),l=val('rl'),k=+val('rk'),a=$('ra').value=='1';
 if(!n||!l||!(k>0)){toast('Lengkapi nama, lokasi, dan kapasitas ruang',false);return}
 if(db.rooms.some(r=>r.nama.toLowerCase()==n.toLowerCase()&&r.id!=edit)){toast('Nama ruang sudah dipakai',false);return}
 if(edit)Object.assign(db.rooms.find(r=>r.id==edit),{nama:n,lokasi:l,kapasitas:k,aktif:a});
 else db.rooms.push({id:db.nid.r++,nama:n,lokasi:l,kapasitas:k,aktif:a});
 edit=null;save();render();toast('Data ruang disimpan')}
function delRuang(id){
 if(db.res.some(r=>r.ruang==id)){toast('Ruang masih dipakai pada data reservasi',false);return}
 if(!confirm('Hapus ruang ini?'))return;
 db.rooms=db.rooms.filter(r=>r.id!=id);save();render();toast('Data ruang dihapus')}
function saveUser(){const n=val('un'),m=val('um'),k=val('uk'),p=$('up').value;
 if(!n||!m||!k||p.length<6){toast('Lengkapi NIM, nama, kelas, dan password minimal 6 karakter',false);return}
 if(db.users.some(u=>u.nim==n)){toast('NIM sudah terdaftar',false);return}
 db.users.push({nim:n,nama:m,kelas:k,role:'Ketua/Anggota',pass:p});save();render();toast('Pengguna ditambahkan')}
function delUser(nim){
 if(db.res.some(r=>r.nim==nim)){toast('Pengguna masih punya data reservasi',false);return}
 if(!confirm('Hapus pengguna ini?'))return;
 db.users=db.users.filter(u=>u.nim!=nim);save();render();toast('Pengguna dihapus')}

function ajukan(){const r=+val('fr'),t=val('ft'),m=val('fm'),s=val('fs'),k=val('fk');
 if(!r||!t||!m||!s||!k){toast('Lengkapi ruang, tanggal, jam, dan keperluan',false);return}
 if(t<D(0)){toast('Tanggal tidak boleh sebelum hari ini',false);return}
 if(m>=s){toast('Jam mulai harus sebelum jam selesai',false);return}
 if(busy(r,t,m,s)){toast('Jadwal bentrok dengan reservasi lain. Pilih jam atau ruang lain',false);return}
 db.res.push({id:db.nid.x++,ruang:r,nim:me.nim,tanggal:t,mulai:m,selesai:s,perlu:k,status:'Pending'});
 save();render();toast('Reservasi diajukan dengan status Pending')}
function setStatus(id,s){db.res.find(r=>r.id==id).status=s;save();render();toast('Reservasi '+s.toLowerCase())}
function delRes(id){if(!confirm('Hapus reservasi ini?'))return;db.res=db.res.filter(r=>r.id!=id);save();render();toast('Reservasi dihapus')}

function applyLap(){const a=val('la'),b=val('lb');
 if(!a||!b||a>b){toast('Periode tidak valid. Tanggal awal harus sebelum tanggal akhir',false);return}
 lap={a:a,b:b,r:$('lr').value};render()}
function exportCsv(){
 const l=['No,Nama Ruang,Jumlah Reservasi,Disetujui,Ditolak,Total Jam'].concat(lapRows.map((r,i)=>[i+1,'"'+r.n.replace(/"/g,'""')+'"',r.j,r.s,r.t,r.h].join(',')));
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([l.join('\n')],{type:'text/csv'}));
 a.download='rekap-pemakaian-ruang.csv';a.click();URL.revokeObjectURL(a.href);toast('Rekap diekspor ke CSV')}

render();
