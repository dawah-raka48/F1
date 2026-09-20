const d=getData(),list=document.getElementById('reports'),area=document.getElementById('pdfArea');

function ratingClass(v){
 const s=String(v||'').toLowerCase();
 if(s.includes('excellent')) return 'r-excellent';
 if(s.includes('very good')) return 'r-very';
 if(s.includes('good')) return 'r-good';
 if(s.includes('needs')) return 'r-needs';
 return 'r-empty';
}

function build(a){
 const subjects=['Reading','Grammar','Dictation','Phonics','Writing','Homework','Classwork','Commitment'];
 const body=a.rows.map((r,i)=>'<tr>'+
   '<td class="c-no">'+(i+1)+'</td>'+
   '<td class="c-name">'+esc(r.name)+'</td>'+
   r.marks.map(x=>'<td class="c-mark '+(x===true?'mark-yes':x===false?'mark-no':'mark-empty')+'">'+(x===true?'✓':x===false?'✗':'—')+'</td>').join('')+
   '<td class="c-average '+ratingClass(r.average)+'"><span>'+esc(r.average||'—')+'</span></td>'+
   '<td class="c-notes">'+esc(r.notes||'')+'</td>'+
 '</tr>').join('');

 const averages=subjects.map((_,j)=>{
   const n=a.rows.reduce((s,r)=>s+(r.marks[j]===true?1:0),0);
   return Math.round(n/a.rows.length*100)+'%';
 }).map(x=>'<td>'+x+'</td>').join('');

 return '<div class="pdf-sheet" id="sheet">'+
   '<div class="report-header">'+
     '<div class="school-brand"><div class="school-mark">HIS</div><div><div class="school-name">HALLEY INTERNATIONAL SCHOOL</div><div class="school-sub">HIS • Weekly Student Assessment</div></div></div>'+
     '<div class="report-badge">WEEKLY<br><strong>ASSESSMENT</strong></div>'+
   '</div>'+
   '<div class="report-title"><div>Weekly Student Assessment</div><strong>'+esc(a.className)+'</strong></div>'+
   '<div class="meta-grid">'+
     '<div class="meta-box"><span>WEEK</span><strong>'+esc(a.week||'—')+'</strong></div>'+
     '<div class="meta-box"><span>FROM</span><strong>'+esc(a.from||'—')+'</strong></div>'+
     '<div class="meta-box"><span>TO</span><strong>'+esc(a.to||'—')+'</strong></div>'+
     '<div class="meta-box teacher-box"><span>TEACHER NAME</span><strong>'+esc(a.teacher||'—')+'</strong></div>'+
   '</div>'+
   '<div class="scale-row"><span class="scale-label">RATING SCALE</span><span><b>5</b> Excellent</span><span><b>4</b> Very Good</span><span><b>3</b> Good</span><span><b>2</b> Fair</span><span><b>1</b> Needs Improvement</span></div>'+
   '<table class="pdf-table"><colgroup><col class="w-no"><col class="w-name">'+subjects.map(()=>'<col class="w-sub">').join('')+'<col class="w-average"><col class="w-notes"></colgroup>'+
   '<thead><tr><th>No.</th><th>Student Name</th>'+subjects.map(s=>'<th>'+s+'</th>').join('')+'<th>Average</th><th>Notes</th></tr></thead>'+
   '<tbody>'+body+'</tbody>'+
   '<tfoot><tr><td colspan="2"><b>CLASS AVERAGE</b></td>'+averages+'<td></td><td></td></tr></tfoot>'+
   '</table>'+
   '<div class="report-footer"><span>Halley International School – HIS</span><span>Weekly Student Assessment • '+esc(a.className)+'</span></div>'+
 '</div>';
}

function showPdf(a){area.innerHTML=build(a);area.style.position='static';window.scrollTo(0,0)}
list.innerHTML=d.assessments.length?d.assessments.slice().reverse().map(a=>'<div class="report-item"><div><strong>'+esc(a.className)+' — Week '+esc(a.week)+'</strong><small>'+esc(a.teacher)+' · '+esc(a.from||'')+'</small></div><div><button class="btn ghost" onclick="showPdf(getData().assessments.find(x=>x.id=='+a.id+'))">Preview</button> <button class="btn primary" onclick="downloadPdf(getData().assessments.find(x=>x.id=='+a.id+'))">PDF</button></div></div>').join(''):'<p class="hint">No saved assessments yet.</p>';

async function downloadPdf(a){
 showPdf(a);
 const el=document.getElementById('sheet');
 await html2pdf().set({
   margin:0,
   filename:'HIS_'+a.className+'_Week_'+a.week+'.pdf',
   image:{type:'jpeg',quality:.98},
   html2canvas:{scale:2,useCORS:true,backgroundColor:'#fff',logging:false},
   jsPDF:{unit:'mm',format:'a4',orientation:'landscape'}
 }).from(el).save();
 area.style.position='absolute';
}