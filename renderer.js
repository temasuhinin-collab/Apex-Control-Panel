const $ = (id) => document.getElementById(id);
const STORE_KEY = "apex-control-panel-v1";
const defaults = {
  dpi: 800, sens: 1.5, ads: 1.0, fov: "100", rawInput: "on",
  notes: "", checks: {}, profiles: [
    {id:"balanced",name:"Сбалансированный",desc:"Универсальный стартовый профиль.",dpi:800,sens:1.5,ads:1.0,fov:"100",color:"#ff6549"},
    {id:"low",name:"Низкая чувствительность",desc:"Более плавные движения и широкий контроль.",dpi:800,sens:1.0,ads:1.0,fov:"110",color:"#6d9eff"},
    {id:"high",name:"Высокая чувствительность",desc:"Быстрые развороты на небольшом движении.",dpi:800,sens:2.5,ads:1.0,fov:"104",color:"#c58bff"}
  ], activeProfile:"balanced"
};
let state = loadState();
function loadState(){
  try { const saved = JSON.parse(localStorage.getItem(STORE_KEY)); if(saved) return {...structuredClone(defaults),...saved}; } catch(e) {}
  return structuredClone(defaults);
}
function persist(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); updateOverview(); }
function toast(msg){ const t=$("toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(toast.timer); toast.timer=setTimeout(()=>t.classList.remove("show"),2200); }
function showPage(name){
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===`page-${name}`));
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===name));
  const titles={overview:"Панель управления",sensitivity:"Чувствительность",profiles:"Игровые профили",performance:"Производительность"};
  $("page-title").textContent=titles[name]||titles.overview;
}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.go)));
function bindRange(id,out,format=(v)=>v){$(id).addEventListener("input",()=>{$(out).textContent=format($(id).value);updateEdpi();});}
bindRange("dpi","dpi-out",v=>String(v));bindRange("sens","sens-out",v=>Number(v).toFixed(1));bindRange("ads","ads-out",v=>Number(v).toFixed(1));
function updateEdpi(){ $("edpi").textContent=Math.round(Number($("dpi").value)*Number($("sens").value)).toLocaleString("ru-RU"); }
function readSettings(){return {dpi:Number($("dpi").value),sens:Number($("sens").value),ads:Number($("ads").value),fov:$("fov").value,rawInput:$("raw-input").value};}
function applySettings(s){$("dpi").value=s.dpi;$("sens").value=s.sens;$("ads").value=s.ads;$("fov").value=s.fov||"100";$("raw-input").value=s.rawInput||"on";$("dpi-out").textContent=s.dpi;$("sens-out").textContent=Number(s.sens).toFixed(1);$("ads-out").textContent=Number(s.ads).toFixed(1);updateEdpi();}
function updateOverview(){ $("stat-sens").textContent=Number(state.sens).toFixed(1);$("stat-dpi").textContent=state.dpi;$("stat-profile").textContent=(state.profiles.find(p=>p.id===state.activeProfile)||{}).name||"Пользовательский"; }
$("save-sens").addEventListener("click",()=>{Object.assign(state,readSettings());persist();toast("Параметры сохранены");});
$("defaults-sens").addEventListener("click",()=>{applySettings(defaults);Object.assign(state,{dpi:defaults.dpi,sens:defaults.sens,ads:defaults.ads,fov:defaults.fov,rawInput:defaults.rawInput});persist();toast("Значения по умолчанию восстановлены");});
$("reset-all").addEventListener("click",()=>{if(confirm("Сбросить все настройки, профили, заметки и чек-лист?")){state=structuredClone(defaults);persist();applySettings(state);$("notes").value="";renderProfiles();renderChecks();toast("Настройки сброшены");}});
function renderProfiles(){
  const list=$("profile-list");list.innerHTML="";
  state.profiles.forEach(p=>{
    const card=document.createElement("article");card.className="profile-card"+(p.id===state.activeProfile?" selected":"");card.style.setProperty("--card-color",p.color||"#ff6549");
    const badge=p.id===state.activeProfile?"АКТИВНЫЙ":"ПРОФИЛЬ";
    card.innerHTML=`<div class="profile-badge">${badge}</div><h3></h3><p></p><div class="profile-values"><div><span>DPI</span><strong>${p.dpi}</strong></div><div><span>SENS</span><strong>${Number(p.sens).toFixed(1)}</strong></div><div><span>ADS</span><strong>${Number(p.ads).toFixed(1)}</strong></div></div><div class="profile-actions"><button class="apply">Применить</button><button class="edit">Изменить</button>${["balanced","low","high"].includes(p.id)?"":'<button class="delete" title="Удалить">×</button>'}</div>`;
    card.querySelector("h3").textContent=p.name;card.querySelector("p").textContent=p.desc||"Пользовательский профиль.";
    card.querySelector(".apply").addEventListener("click",()=>{Object.assign(state,p);state.activeProfile=p.id;applySettings(p);persist();renderProfiles();toast("Профиль применён в панели");});
    card.querySelector(".edit").addEventListener("click",()=>editProfile(p.id));
    const del=card.querySelector(".delete");if(del)del.addEventListener("click",()=>{if(confirm(`Удалить профиль «${p.name}»?`)){state.profiles=state.profiles.filter(x=>x.id!==p.id);if(state.activeProfile===p.id)state.activeProfile="balanced";persist();renderProfiles();toast("Профиль удалён");}});
    list.appendChild(card);
  });
  $("profile-count").textContent=state.profiles.length;
}
function editProfile(id){
  const p=state.profiles.find(x=>x.id===id);if(!p)return;
  const name=prompt("Название профиля:",p.name);if(name===null)return;if(!name.trim()){toast("Название не может быть пустым");return;}
  const desc=prompt("Краткое описание:",p.desc||"");if(desc===null)return;
  p.name=name.trim().slice(0,45);p.desc=desc.trim().slice(0,130);
  if(p.id===state.activeProfile){p.dpi=state.dpi;p.sens=state.sens;p.ads=state.ads;p.fov=state.fov;p.rawInput=state.rawInput;}
  persist();renderProfiles();toast("Профиль обновлён");
}
$("new-profile").addEventListener("click",()=>{
  if(state.profiles.length>=12){toast("Можно хранить до 12 профилей");return;}
  const name=prompt("Название нового профиля:","Мой профиль");if(name===null)return;if(!name.trim()){toast("Введите название профиля");return;}
  const s=readSettings();const p={id:"custom-"+Date.now(),name:name.trim().slice(0,45),desc:"Пользовательский профиль.",...s,color:["#ff6549","#6d9eff","#c58bff","#65d6a3","#ffc36d"][state.profiles.length%5]};
  state.profiles.push(p);state.activeProfile=p.id;Object.assign(state,s);persist();renderProfiles();toast("Новый профиль создан");
});
function renderChecks(){
  document.querySelectorAll("[data-check]").forEach(c=>c.checked=!!state.checks[c.dataset.check]);
  const n=Object.values(state.checks).filter(Boolean).length;const pct=Math.round(n/5*100);
  $("check-progress").style.width=pct+"%";$("check-caption").textContent=`${n} из 5 выполнено`;$("check-percent").textContent=pct+"%";
}
document.querySelectorAll("[data-check]").forEach(c=>c.addEventListener("change",()=>{state.checks[c.dataset.check]=c.checked;persist();renderChecks();}));
$("save-notes").addEventListener("click",()=>{state.notes=$("notes").value;persist();$("notes-status").textContent="Заметки сохранены";toast("Заметки сохранены");});
function init(){applySettings(state);$("notes").value=state.notes||"";renderProfiles();renderChecks();updateOverview();}
init();