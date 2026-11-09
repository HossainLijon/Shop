const K='dokan_db_v1';
const now=()=>new Date().toISOString();
const tk=n=>'Tk '+(+n).toLocaleString('en-US',{maximumFractionDigits:2});
const tm=d=>new Date(d).toLocaleString();
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function fresh(){return{users:[{id:1,name:'Owner',username:'admin',password:'admin123',role:'admin'}],day:{start:now(),opening:0,entries:[]},history:[],nid:2,eid:1}}
function load(){try{const d=JSON.parse(localStorage.getItem(K));if(d&&d.users)return d}catch(e){}return fresh()}
function save(){try{localStorage.setItem(K,JSON.stringify(db))}catch(e){}}
let db=load(),me=null,tab='today',view=null,err='',armed=false;
const L={sale:'Sale (bikri)',purchase:'Purchase (mal kena)',return:'Return (ferot)'};

function tot(es){let s=0,p=0,r=0;es.forEach(e=>{if(e.type=='sale')s+=e.amt;else if(e.type=='purchase')p+=e.amt;else r+=e.amt});return{s,p,r,net:s-p-r}}
function stats(t,open){const items=[['Sales',t.s],['Purchases',t.p],['Returns',t.r]];let h='';if(open!==undefined)h+=`<div class="st"><span>Opening cash</span><b>${tk(open)}</b></div>`;
 items.forEach(i=>h+=`<div class="st"><span>${i[0]}</span><b>${tk(i[1])}</b></div>`);
 if(open!==undefined)h+=`<div class="st"><span>Cash now / closing</span><b>${tk(open+t.net)}</b></div>`;return `<div class="stats">${h}</div>`}
function etable(es,del){if(!es.length)return '<p style="color:var(--mu)">No entries yet.</p>';
 return `<div class="ov"><table><tr><th>Time</th><th>Type</th><th>Amount</th><th>Note</th><th>By</th>${del?'<th></th>':''}</tr>`+
 es.slice().reverse().map(e=>`<tr><td>${tm(e.time)}</td><td class="${e.type}">${L[e.type].split(' ')[0]}</td><td>${tk(e.amt)}</td><td>${esc(e.note||'')}</td><td>${esc(e.by)}</td>${del?`<td><button class="sec sm" onclick="delE(${e.id})">Delete</button></td>`:''}</tr>`).join('')+'</table></div>'}
function byEmp(es){const m={};es.forEach(e=>{(m[e.by]=m[e.by]||[]).push(e)});const k=Object.keys(m);if(!k.length)return '';
 return `<h3>Employee wise</h3><div class="ov"><table><tr><th>Employee</th><th>Sales</th><th>Purchases</th><th>Returns</th></tr>`+k.map(n=>{const t=tot(m[n]);return `<tr><td>${esc(n)}</td><td>${tk(t.s)}</td><td>${tk(t.p)}</td><td>${tk(t.r)}</td></tr>`}).join('')+'</table></div>'}
function stmt(d){const t=tot(d.entries);return `<div class="card"><h2>Day Statement</h2><p style="color:var(--mu)">${tm(d.start)} &rarr; ${d.end?tm(d.end):'running'}</p>${stats(t,d.opening)}${byEmp(d.entries)}<h3 style="margin-top:14px">All transactions</h3>${etable(d.entries,false)}</div>`}

function entryForm(){return `<div class="card noprint"><h2>New entry</h2><div class="row">
<div><label>Type</label><select id="et"><option value="sale">${L.sale}</option><option value="purchase">${L.purchase}</option><option value="return">${L.return}</option></select></div>
<div><label>Amount (Tk)</label><input id="ea" type="number" min="0" step="any" placeholder="0"></div>
<div><label>Note / item</label><input id="en" placeholder="optional"></div>
<div><button onclick="addE()">Save</button></div></div>${err?`<p class="err">${err}</p>`:''}</div>`}
function addE(){const a=parseFloat($('#ea').value);if(!(a>0)){err='Enter a valid amount.';draw();return}err='';
 db.day.entries.push({id:db.eid++,time:now(),type:$('#et').value,amt:a,note:$('#en').value.trim(),by:me.name});save();draw()}
function delE(id){db.day.entries=db.day.entries.filter(e=>e.id!=id);save();draw()}
const $=s=>document.querySelector(s);

function login(){$('#app').innerHTML=`<div class="card login"><h1>Dokan Hisab</h1><p style="color:var(--mu)">Please log in</p>
<input id="u" placeholder="Username" autocomplete="username"><input id="p" type="password" placeholder="Password" autocomplete="current-password" onkeydown="if(event.key=='Enter')doLogin()">
<button onclick="doLogin()" style="width:100%">Login</button>${err?`<p class="err">${err}</p>`:''}<p style="color:var(--mu);font-size:12px;margin-top:12px">First time: admin / admin123 (change it after login)</p></div>`}
function doLogin(){const u=db.users.find(x=>x.username==$('#u').value.trim()&&x.password==$('#p').value);if(!u){err='Wrong username or password.';login();return}err='';me=u;tab='today';draw()}
function logout(){me=null;err='';login()}

function topbar(tabs){return `<div class="top noprint"><div><h1>Dokan Hisab</h1><span style="color:var(--mu)">${esc(me.name)} (${me.role})</span></div>
<div class="tabs">${tabs.map(t=>`<button class="${tab==t[0]?'on':''}" onclick="tab='${t[0]}';view=null;err='';draw()">${t[1]}</button>`).join('')}<button class="sec" onclick="logout()">Logout</button></div></div>`}

function draw(){if(!me)return login();me.role=='admin'?admin():emp()}

function emp(){const mine=db.day.entries.filter(e=>e.by==me.name);
 $('#app').innerHTML=topbar([['today','My entries']])+`<h2>Today: my totals</h2>${stats(tot(mine))}`+entryForm()+`<div class="card"><h2>My transactions today</h2>${etable(mine,false)}</div>`}

function admin(){let h=topbar([['today','Today'],['emps','Employees'],['hist','Statements']]);
 if(tab=='today'){const d=db.day,t=tot(d.entries),canOpen=!db.history.length&&!d.entries.length;
  h+=`<div class="card"><h3>Day started ${tm(d.start)}</h3>`+(canOpen?`<div class="row"><div><label>Starting cash in drawer (Tk)</label><input id="op" type="number" value="${d.opening}"></div><div><button onclick="setOp()">Set</button></div></div>`:'')+`</div>`+
  stats(t,d.opening)+entryForm()+`<div class="card">${byEmp(d.entries)}<h3 style="margin-top:14px">Transactions</h3>${etable(d.entries,true)}</div>
  <div class="card noprint"><h2>End of day</h2><p>Closing cash will be <b>${tk(d.opening+t.net)}</b> and it becomes tomorrow&rsquo;s opening cash.</p><button class="${armed?'dan':''}" onclick="closeDay()">${armed?'Click again to confirm close day':'Close day &amp; make statement'}</button></div>`}
 if(tab=='emps'){h+=`<div class="card"><h2>Add employee</h2><div class="row"><div><label>Name</label><input id="nn"></div><div><label>Username</label><input id="nu"></div><div><label>Password</label><input id="np"></div><div><button onclick="addU()">Add</button></div></div>${err?`<p class="err">${err}</p>`:''}</div>
  <div class="card"><h2>Staff</h2><div class="ov"><table><tr><th>Name</th><th>Username</th><th>Role</th><th></th></tr>${db.users.map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.username)}</td><td>${u.role}</td><td>${u.role=='admin'?'':`<button class="sec sm" onclick="delU(${u.id})">Remove</button>`}</td></tr>`).join('')}</table></div></div>
  <div class="card"><h2>Change my password</h2><div class="row"><div><input id="cp" placeholder="New password"></div><div><button onclick="chP()">Update</button></div></div></div>`}
 if(tab=='hist'){if(view!==null&&db.history[view]){h+=`<div class="noprint top"><button class="sec" onclick="view=null;draw()">&larr; Back</button><button onclick="window.print()">Print</button></div>`+stmt(db.history[view])}
  else h+=`<div class="card"><h2>Closed days</h2>`+(db.history.length?`<div class="ov"><table><tr><th>Start</th><th>End</th><th>Opening</th><th>Closing</th><th></th></tr>${db.history.map((d,i)=>`<tr><td>${tm(d.start)}</td><td>${tm(d.end)}</td><td>${tk(d.opening)}</td><td>${tk(d.closing)}</td><td><button class="sm" onclick="view=${i};draw()">View</button></td></tr>`).join('')}</table></div>`:'<p style="color:var(--mu)">No closed days yet.</p>')+'</div>'}
 $('#app').innerHTML=h}

function setOp(){db.day.opening=parseFloat($('#op').value)||0;save();draw()}
function closeDay(){if(!armed){armed=true;draw();setTimeout(()=>{armed=false},4000);return}armed=false;
 const d=db.day,c=d.opening+tot(d.entries).net;db.history.unshift({start:d.start,end:now(),opening:d.opening,closing:c,entries:d.entries});
 db.day={start:now(),opening:c,entries:[]};save();tab='hist';view=0;draw()}
function addU(){const n=$('#nn').value.trim(),u=$('#nu').value.trim(),p=$('#np').value;
 if(!n||!u||!p){err='Fill all fields.';draw();return}if(db.users.some(x=>x.username==u)){err='Username already used.';draw();return}
 db.users.push({id:db.nid++,name:n,username:u,password:p,role:'employee'});err='';save();draw()}
function delU(id){db.users=db.users.filter(u=>u.id!=id);save();draw()}
function chP(){const p=$('#cp').value;if(!p)return;me.password=p;save();draw()}
login();
