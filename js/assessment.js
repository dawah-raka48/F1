const subjects=['Reading','Grammar','Dictation','Phonics','Writing','Homework','Classwork','Commitment'];
let data=getData(),params=new URLSearchParams(location.search),classId=params.get('class')||'1A';
let current=data.classes.find(c=>c.id===classId)||data.classes[0];
const table=document.querySelector('#assessmentTable tbody'),select=document.getElementById('classSelect');

if(!current){
  data.classes=[{id:'1A',name:'Class 1A',students:['Fayrouz','Zeina','Dana','Mehar','Mena','Malak','Karma','Hafsa','Halima','Hala Mohammed','Hala Jalal','Cady','Celia','Zenib','Rella']}];
  saveData(data);current=data.classes[0];
}
if(current.id==='1A' && current.students.length===0 && data.assessments.length===0){
  current.students=['Fayrouz','Zeina','Dana','Mehar','Mena','Malak','Karma','Hafsa','Halima','Hala Mohammed','Hala Jalal','Cady','Celia','Zenib','Rella'];
  saveData(data);
}

select.innerHTML=data.classes.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join('');
select.value=current.id;

function rating(score){
 if(score>=.875)return'Excellent';
 if(score>=.70)return'Very Good';
 if(score>=.50)return'Good';
 return'Needs Improvement'
}
function render(){
 current=data.classes.find(c=>c.id===select.value)||data.classes[0];
 document.getElementById('classTitle').textContent=current.name;
 if(!current.students.length){
   table.innerHTML='<tr><td colspan="12" class="empty-table"><div><i class="fa-solid fa-user-plus"></i><strong>No students in this class</strong><span>Add students using the Students button above.</span></div></td></tr>';
 }else{
   table.innerHTML=current.students.map((name,i)=>'<tr data-student="'+esc(name)+'"><td>'+(i+1)+'</td><td class="name">'+esc(name)+'</td>'+subjects.map((_,j)=>'<td><button class="mark" data-state="blank" data-i="'+j+'">—</button></td>').join('')+'<td class="average">—</td><td><input class="notes" placeholder="Notes"></td></tr>').join('');
   table.querySelectorAll('.mark').forEach(b=>b.onclick=()=>{
     const states=['blank','yes','no'],next=states[(states.indexOf(b.dataset.state)+1)%3];
     b.dataset.state=next;b.className='mark '+(next==='yes'?'yes':next==='no'?'no':'');b.textContent=next==='yes'?'✓':next==='no'?'✗':'—';updateRow(b.closest('tr'))
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
select.onchange=()=>{history.replaceState(null,'','?class='+encodeURIComponent(select.value));data=getData();render()};
document.getElementById('saveBtn').onclick=()=>{
 if(!current.students.length){toast('Add students before saving the assessment','error');return}
 const assessment={id:Date.now(),classId:current.id,className:current.name,week:document.getElementById('week').value,from:document.getElementById('from').value,to:document.getElementById('to').value,teacher:document.getElementById('teacher').value,rows:[...table.querySelectorAll('tr[data-student]')].map(tr=>({name:tr.dataset.student,marks:[...tr.querySelectorAll('.mark')].map(x=>x.dataset.state==='yes'?true:x.dataset.state==='no'?false:null),average:tr.querySelector('.average').textContent,notes:tr.querySelector('.notes').value}))};
 data=getData();data.assessments=data.assessments.filter(x=>!(x.classId===assessment.classId&&x.week===assessment.week));data.assessments.push(assessment);saveData(data);toast('Assessment saved successfully');setTimeout(()=>location.href='report.html',500)
};
render();