const subjects=['Reading','Grammar','Dictation','Phonics','Writing','Homework','Classwork','Commitment'];
let data,current,params,classId,editingAssessment=null;
const table=document.querySelector('#assessmentTable tbody'),select=document.getElementById('classSelect');

function rating(score){
 if(score>=.875)return'Excellent';
 if(score>=.70)return'Very Good';
 if(score>=.50)return'Good';
 return'Needs Improvement'
}
function render(){
 current=data.classes.find(c=>c.id===select.value)||data.classes[0];
 if(!current)return;
 document.getElementById('classTitle').textContent=current.name;
 const existingByName=new Map((editingAssessment?.rows||[]).map(r=>[String(r.name),r]));

 if(!current.students.length){
   table.innerHTML='<tr><td colspan="12" class="empty-table"><div><i class="fa-solid fa-user-plus"></i><strong>No students in this class</strong><span>Add students using the Students button above.</span></div></td></tr>';
 }else{
   table.innerHTML=current.students.map((name,i)=>{
     const old=existingByName.get(String(name));
     return '<tr data-student="'+esc(name)+'"><td>'+(i+1)+'</td><td class="name">'+esc(name)+'</td>'+
       subjects.map((_,j)=>{
         const mark=Array.isArray(old?.marks)?old.marks[j]:null;
         const state=mark===true?'yes':mark===false?'no':'blank';
         return '<td><button class="mark '+(state==='yes'?'yes':state==='no'?'no':'')+'" data-state="'+state+'" data-i="'+j+'">'+(state==='yes'?'✓':state==='no'?'✗':'—')+'</button></td>';
       }).join('')+
       '<td class="average">—</td><td><input class="notes" placeholder="Notes" value="'+esc(old?.notes||'')+'"></td></tr>';
   }).join('');

   table.querySelectorAll('.mark').forEach(b=>b.onclick=()=>{
     const states=['blank','yes','no'];
     const next=states[(states.indexOf(b.dataset.state)+1)%3];
     b.dataset.state=next;
     b.className='mark '+(next==='yes'?'yes':next==='no'?'no':'');
     b.textContent=next==='yes'?'✓':next==='no'?'✗':'—';
     updateRow(b.closest('tr'));
   });
   table.querySelectorAll('tr').forEach(updateRow);
 }
 updateSummary();
}
function updateRow(tr){
 const marks=[...tr.querySelectorAll('.mark')],evaluated=marks.filter(x=>x.dataset.state!=='blank'),yes=marks.filter(x=>x.dataset.state==='yes').length;
 tr.querySelector('.average').textContent=evaluated.length?rating(yes/subjects.length):'—';
}
function updateSummary(){
 const rows=[...table.querySelectorAll('tr[data-student]')];
 document.getElementById('studentTotal').textContent=rows.length;
 let ex=0,vg=0,needs=0;
 rows.forEach(r=>{const v=r.querySelector('.average')?.textContent;if(v==='Excellent')ex++;else if(v==='Very Good')vg++;else if(v==='Needs Improvement')needs++});
 document.getElementById('excellentTotal').textContent=ex;
 document.getElementById('veryGoodTotal').textContent=vg;
 document.getElementById('needsTotal').textContent=needs;
}
async function initAssessment(){
 try{
   data=await window.hisReady;
   params=new URLSearchParams(location.search);
   const editId=params.get('edit');
   classId=params.get('class')||'1A';

   if(editId){
     editingAssessment=data.assessments.find(x=>String(x.id)===String(editId))||null;
     if(!editingAssessment){
       toast('Assessment not found','error');
       setTimeout(()=>location.href='report.html',700);
       return;
     }
     classId=editingAssessment.classId;
     document.getElementById('week').value=editingAssessment.week||'';
     document.getElementById('from').value=editingAssessment.from||'';
     document.getElementById('to').value=editingAssessment.to||'';
     document.getElementById('teacher').value=editingAssessment.teacher||'';
     const saveBtn=document.getElementById('saveBtn');
     saveBtn.innerHTML='<i class="fa-solid fa-floppy-disk"></i> Save Changes';
     document.querySelector('.section-kicker').textContent='EDIT WEEKLY ASSESSMENT';
     document.querySelector('.assessment-hero p').textContent='Update the assessment daily and save your changes. Previous marks are loaded automatically.';
   }

   current=data.classes.find(c=>c.id===classId)||data.classes[0];
   if(!current){toast('No classes found in Google Sheets','error');return}
   select.innerHTML=data.classes.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join('');
   select.value=current.id;
   render();
 }catch(error){console.error(error);toast('Could not load Google Sheets data','error')}
}
select.onchange=()=>{
 history.replaceState(null,'','?'+(editingAssessment?'edit='+encodeURIComponent(editingAssessment.id)+'&':'')+'class='+encodeURIComponent(select.value));
 data=getData();
 render();
};

document.getElementById('saveBtn').onclick=async()=>{
 const saveBtn=document.getElementById('saveBtn');
 if(saveBtn.disabled)return;
 if(!current||!current.students.length){toast('Add students before saving the assessment','error');return}
 setButtonBusy(saveBtn,editingAssessment?'Saving changes...':'Saving...');

 const assessment={
   id:editingAssessment?editingAssessment.id:Date.now(),
   classId:current.id,
   className:current.name,
   week:document.getElementById('week').value,
   from:document.getElementById('from').value,
   to:document.getElementById('to').value,
   teacher:document.getElementById('teacher').value,
   rows:[...table.querySelectorAll('tr[data-student]')].map(tr=>({
     name:tr.dataset.student,
     marks:[...tr.querySelectorAll('.mark')].map(x=>x.dataset.state==='yes'?true:x.dataset.state==='no'?false:null),
     average:tr.querySelector('.average').textContent,
     notes:tr.querySelector('.notes').value
   }))
 };

 data=getData();
 if(editingAssessment){
   const index=data.assessments.findIndex(x=>String(x.id)===String(editingAssessment.id));
   if(index<0){
     toast('Assessment no longer exists','error');
     restoreButton(saveBtn);
     return;
   }
   data.assessments[index]=assessment;
 }else{
   data.assessments.push(assessment);
 }

 try{
   await saveData(data);
   toast(editingAssessment?'Changes saved successfully':'Saved successfully');
   setTimeout(()=>location.href='report.html',700);
 }catch(error){
   restoreButton(saveBtn);
 }
};
initAssessment();
