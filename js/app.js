const defaultStudents=['Fayrouz','Zeina','Dana','Mehar','Mena','Malak','Karma','Hafsa','Halima','Hala Mohammed','Hala Jalal','Cady','Celia','Zenib','Rella'];
const defaultData={classes:[{id:'1A',name:'Class 1A',students:[...defaultStudents]}],assessments:[]};

let APP_DATA={classes:[],assessments:[]};
let APP_READY=false;

function normalizeData(d){
  const data=d&&typeof d==='object'?d:{};
  return {
    classes:Array.isArray(data.classes)?data.classes.map(c=>({
      id:String(c.id||''),
      name:String(c.name||c.id||'Class'),
      students:Array.isArray(c.students)?c.students.filter(Boolean):[]
    })):[],
    assessments:Array.isArray(data.assessments)?data.assessments:[]
  };
}

async function initAppData(){
  try{
    let remote=normalizeData(await loadRemoteData());
    if(!remote.classes.length){
      remote=structuredClone(defaultData);
      await saveRemoteData(remote);
    }
    APP_DATA=remote;
    APP_READY=true;
    renderDashboard();
    return APP_DATA;
  }catch(error){
    console.error('Google Sheets connection failed:',error);
    APP_DATA={classes:[],assessments:[]};
    renderDashboard();
    throw error;
  }
}

window.hisReady=initAppData();

function getData(){return APP_DATA}
async function saveData(d){
  APP_DATA=normalizeData(d);
  renderDashboard();
  try{
    await saveRemoteData(APP_DATA);
    return APP_DATA;
  }catch(error){
    console.error('Google Sheets save failed:',error);
    toast('Could not save to Google Sheets','error');
    throw error;
  }
}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function toast(message,type='success'){const t=document.createElement('div');t.className='toast '+type;t.innerHTML='<i class="fa-solid '+(type==='success'?'fa-circle-check':'fa-circle-exclamation')+'"></i>'+esc(message);document.body.appendChild(t);requestAnimationFrame(()=>t.classList.add('show'));setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),250)},2600)}
function renderDashboard(){
 const d=getData(),el=document.getElementById('classes');if(!el)return;
 document.getElementById('classCount').textContent=d.classes.length;
 document.getElementById('studentCount').textContent=d.classes.reduce((n,c)=>n+c.students.length,0);
 document.getElementById('reportCount').textContent=d.assessments.length;
 el.innerHTML=d.classes.map(c=>`<article class="class-card"><div class="class-card-top"><div class="class-avatar"><i class="fa-solid fa-users"></i></div><button class="more-btn" onclick='openClassMenu(event,${JSON.stringify(c.id)})'><i class="fa-solid fa-ellipsis"></i></button></div><div class="class-code">${esc(c.id)}</div><h3>${esc(c.name)}</h3><p><i class="fa-solid fa-user"></i> ${c.students.length} students</p><div class="card-actions"><a class="btn primary flex" href="assessment.html?class=${encodeURIComponent(c.id)}"><i class="fa-solid fa-pen-to-square"></i> Assess</a><button class="btn soft flex" onclick='openStudentModal(${JSON.stringify(c.id)})'><i class="fa-solid fa-user-plus"></i> Students</button></div></article>`).join('');
}
function closeModal(){document.getElementById('modalRoot').innerHTML=''}
function modal(html){document.getElementById('modalRoot').innerHTML='<div class="modal-backdrop" onclick="if(event.target===this)closeModal()"><div class="modal-card">'+html+'</div></div>'}
function openClassModal(editId=''){
 const d=getData(),c=d.classes.find(x=>x.id===editId);
 modal(`<div class="modal-head"><div><span class="section-kicker">CLASS MANAGEMENT</span><h2>${c?'Edit Class':'Add New Class'}</h2></div><button class="close-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div><form id="classForm"><label>Class Code<input id="mClassId" required maxlength="12" value="${esc(c?.id||'')}" placeholder="e.g. 1A"></label><label>Class Name<input id="mClassName" required value="${esc(c?.name||'')}" placeholder="e.g. Class 1A"></label><div class="modal-actions"><button type="button" class="btn soft" onclick="closeModal()">Cancel</button><button class="btn primary" type="submit"><i class="fa-solid fa-check"></i> Save Class</button></div></form>`);
 document.getElementById('classForm').onsubmit=e=>saveClass(e,editId);setTimeout(()=>document.getElementById('mClassId')?.focus(),50);
}
async function saveClass(e,editId){e.preventDefault();const d=getData(),id=document.getElementById('mClassId').value.trim(),name=document.getElementById('mClassName').value.trim();if(!id||!name)return;if(d.classes.some(c=>c.id.toLowerCase()===id.toLowerCase()&&c.id!==editId)){toast('Class code already exists','error');return}if(editId){const c=d.classes.find(x=>x.id===editId);c.id=id;c.name=name}else d.classes.push({id,name,students:[]});await saveData(d);closeModal();toast(editId?'Class updated successfully':'Class created successfully')}
function openClassMenu(e,id){e.stopPropagation();const c=getData().classes.find(x=>x.id===id);if(!c)return;modal(`<div class="modal-head"><div><span class="section-kicker">CLASS OPTIONS</span><h2>${esc(c.name)}</h2></div><button class="close-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div><div class="menu-actions"><button onclick='openClassModal(${JSON.stringify(id)})' class="menu-action"><i class="fa-solid fa-pen"></i><span>Edit Class<small>Rename or change the code</small></span></button><button onclick='openStudentModal(${JSON.stringify(id)})' class="menu-action"><i class="fa-solid fa-user-gear"></i><span>Manage Students<small>Add, edit or remove students</small></span></button><button onclick='deleteClass(${JSON.stringify(id)})' class="menu-action danger"><i class="fa-solid fa-trash"></i><span>Delete Class<small>This cannot be undone</small></span></button></div>`)}
async function deleteClass(id){const d=getData(),c=d.classes.find(x=>x.id===id);if(!c)return;if(!confirm('Delete '+c.name+' and its student list?'))return;d.classes=d.classes.filter(x=>x.id!==id);if(!d.classes.length)d.classes=[{id:'1A',name:'Class 1A',students:[...defaultStudents]}];await saveData(d);closeModal();toast('Class deleted')}
function openStudentModal(classId){const c=getData().classes.find(x=>x.id===classId);if(!c)return;modal(`<div class="modal-head"><div><span class="section-kicker">STUDENT MANAGEMENT</span><h2>${esc(c.name)}</h2><p>${c.students.length} students</p></div><button class="close-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div><div class="student-add"><input id="studentInput" placeholder="Enter student name"><button class="btn primary" id="addStudentBtn"><i class="fa-solid fa-plus"></i> Add Student</button></div><div id="studentList" class="student-list">${studentRows(c)}</div><div class="modal-actions"><button class="btn soft" onclick="closeModal()">Done</button><a class="btn primary" href="assessment.html?class=${encodeURIComponent(classId)}"><i class="fa-solid fa-pen-to-square"></i> Start Assessment</a></div>`);document.getElementById('addStudentBtn').onclick=()=>addStudent(classId);document.getElementById('studentInput').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();addStudent(classId)}};setTimeout(()=>document.getElementById('studentInput')?.focus(),50)}
function studentRows(c){return c.students.length?c.students.map((s,i)=>`<div class="student-row"><span class="student-number">${String(i+1).padStart(2,'0')}</span><input value="${esc(s)}" onchange='renameStudent(${JSON.stringify(c.id)},${i},this.value)'><button class="mini-btn danger" title="Delete student" onclick='deleteStudent(${JSON.stringify(c.id)},${i})'><i class="fa-solid fa-trash"></i></button></div>`).join(''):'<div class="empty-students"><i class="fa-solid fa-user-plus"></i><p>No students in this class.</p></div>'}
function refreshStudentModal(classId){const c=getData().classes.find(x=>x.id===classId);if(!c)return;document.getElementById('studentList').innerHTML=studentRows(c);const count=document.querySelector('.modal-head p');if(count)count.textContent=c.students.length+' students';document.getElementById('studentInput')?.focus()}
async function addStudent(classId){const input=document.getElementById('studentInput'),name=input?.value.trim(),d=getData(),c=d.classes.find(x=>x.id===classId);if(!c||!name)return;if(c.students.some(s=>s.toLowerCase()===name.toLowerCase())){toast('Student already exists','error');return}c.students.push(name);await saveData(d);refreshStudentModal(classId);toast('Student added successfully')}
async function renameStudent(classId,i,name){const d=getData(),c=d.classes.find(x=>x.id===classId);if(!c)return;name=name.trim();if(!name)return;if(c.students.some((s,n)=>n!==i&&s.toLowerCase()===name.toLowerCase())){toast('Student already exists','error');return}c.students[i]=name;await saveData(d);toast('Student name updated')}
async function deleteStudent(classId,i){const d=getData(),c=d.classes.find(x=>x.id===classId);if(!c)return;if(!confirm('Delete '+c.students[i]+' from '+c.name+'?'))return;c.students.splice(i,1);await saveData(d);refreshStudentModal(classId);toast('Student removed')}
document.addEventListener('DOMContentLoaded',()=>{if(window.hisReady)window.hisReady.catch(()=>toast('Google Sheets connection failed','error'))});
