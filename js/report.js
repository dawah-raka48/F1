let d,list,area;
function ratingClass(v){const s=String(v||'').toLowerCase();if(s.includes('excellent'))return'r-excellent';if(s.includes('very good'))return'r-very';if(s==='good')return'r-good';if(s.includes('needs'))return'r-needs';return'r-empty'}
function build(a){
 const subjects=['Reading','Grammar','Dictation','Phonics','Writing','Homework','Classwork','Commitment'];
 const body=a.rows.map((r,i)=>'<tr><td class="c-no">'+(i+1)+'</td><td class="c-name">'+esc(r.name)+'</td>'+r.marks.map(x=>'<td class="c-mark '+(x===true?'mark-yes':x===false?'mark-no':'mark-empty')+'">'+(x===true?'✓':x===false?'✗':'—')+'</td>').join('')+'<td class="c-average '+ratingClass(r.average)+'"><span>'+esc(r.average||'—')+'</span></td><td class="c-notes">'+esc(r.notes||'')+'</td></tr>').join('');
 const averages=subjects.map((_,j)=>{const n=a.rows.reduce((s,r)=>s+(r.marks[j]===true?1:0),0);return Math.round(n/a.rows.length*100)+'%'}).map(x=>'<td>'+x+'</td>').join('');
 return '<div class="pdf-sheet" id="sheet">'+
 '<div class="school-head official-his-head"><img class="official-his-image" src="assets/his-header.png?v=1" alt="Halley International School"></div>'+
 '<div class="report-title">Weekly Student Assessment <strong>– '+esc(a.className)+'</strong></div>'+
 '<div class="info-grid"><div><label>WEEK</label><b>'+esc(a.week||'—')+'</b></div><div><label>FROM</label><b>'+esc(a.from||'—')+'</b></div><div><label>TO</label><b>'+esc(a.to||'—')+'</b></div><div><label>TEACHER NAME</label><b>'+esc(a.teacher||'—')+'</b></div></div>'+
 '<div class="scale-box"><strong>RATING SCALE</strong><span><b>5</b> = Excellent</span><span><b>4</b> = Very Good</span><span><b>3</b> = Good</span><span><b>2</b> = Fair</span><span><b>1</b> = Needs Improvement</span></div>'+
 '<table class="pdf-table"><colgroup><col class="w-no"><col class="w-name">'+subjects.map(()=>'<col class="w-sub">').join('')+'<col class="w-average"><col class="w-notes"></colgroup><thead><tr><th>No.</th><th>Student Name</th>'+subjects.map(s=>'<th>'+s+'</th>').join('')+'<th>Average</th><th>Notes</th></tr></thead><tbody>'+body+'</tbody><tfoot><tr><td colspan="2">Class Average</td>'+averages+'<td></td><td></td></tr></tfoot></table>'+
 '<div class="report-bottom"><div><strong>Teacher Signature</strong><span></span></div><div><strong>Halley International School – HIS</strong><small>Weekly Student Assessment</small></div><div><strong>Date</strong><span></span></div></div>'+
 '</div>';
}
function showPdf(a){
 if(!a)return;
 area.innerHTML='<div class="preview-overlay"><div class="preview-toolbar"><div><strong>Report Preview</strong><span>'+esc(a.className)+' · Week '+esc(a.week||'')+'</span></div><div class="preview-tools"><button class="btn ghost" onclick="closePreview()"><i class="fa-solid fa-xmark"></i> Close</button><button class="btn primary" onclick="downloadPdf(getData().assessments.find(x=>x.id=='+a.id+'))"><i class="fa-solid fa-file-pdf"></i> Download PDF</button></div></div><div class="preview-viewport"><div class="preview-stage">'+build(a)+'</div></div></div>';
 area.style.position='fixed';area.style.left='0';area.style.top='0';area.style.width='100%';area.style.height='100%';area.style.zIndex='9999';area.style.display='block';area.style.background='#17212b';
 const sheet=area.querySelector('.pdf-sheet'),stage=area.querySelector('.preview-stage'),viewport=area.querySelector('.preview-viewport');
 const fit=()=>{const available=Math.max(280,viewport.clientWidth-24);const scale=Math.min(1,available/1122);sheet.style.transform='scale('+scale+')';sheet.style.transformOrigin='top left';stage.style.width=(1122*scale)+'px';stage.style.height=(794*scale)+'px';stage.style.margin='0 auto'};
 requestAnimationFrame(fit);window.addEventListener('resize',fit,{once:false});window.scrollTo(0,0);
}
function closePreview(){area.innerHTML='';area.style.cssText='position:absolute;left:-30000px;top:0;width:1122px;background:#fff;display:none'}
async function deleteAssessment(id){
  const a=getData().assessments.find(x=>String(x.id)===String(id));
  if(!a)return;
  if(!confirm('Delete this assessment? This will also delete all marks for this assessment.'))return;
  const buttons=[...document.querySelectorAll('[data-delete-assessment="'+id+'"]')];
  buttons.forEach(b=>setButtonBusy(b,'Deleting...'));
  try{
    await deleteRemoteAssessment(id);
    APP_DATA.assessments=APP_DATA.assessments.filter(x=>String(x.id)!==String(id));
    d=APP_DATA;
    renderReports();
    toast('Deleted successfully');
  }catch(error){
    console.error(error);
    buttons.forEach(restoreButton);
    toast('Could not delete assessment','error');
  }
}
function renderReports(){
  list.innerHTML=d.assessments.length?d.assessments.slice().reverse().map(a=>'<div class="report-item"><div><strong>'+esc(a.className)+' — Week '+esc(a.week)+'</strong><small>'+esc(a.teacher)+' · '+esc(a.from||'')+'</small></div><div><button class="btn ghost" onclick="showPdf(getData().assessments.find(x=>x.id=='+a.id+'))"><i class="fa-solid fa-eye"></i> Preview</button> <button class="btn primary" onclick="downloadPdf(getData().assessments.find(x=>x.id=='+a.id+'))"><i class="fa-solid fa-file-pdf"></i> PDF</button> <button class="btn danger" data-delete-assessment="'+a.id+'" onclick="deleteAssessment('+a.id+')"><i class="fa-solid fa-trash"></i> Delete</button></div></div>').join(''):'<div class="empty-state"><div><i class="fa-solid fa-file-circle-plus"></i></div><h3>No saved assessments yet</h3><p>Complete an assessment first, then return here to export it.</p></div>';
}
const pdfCache=new Map();

async function buildPdfFile(a){
  if(!a)return null;
  const key=String(a.id);
  if(pdfCache.has(key))return pdfCache.get(key);

  showPdf(a);
  const source=document.getElementById('sheet');
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));

  if(typeof html2pdf!=='function') throw new Error('PDF library is not loaded');

  /*
   * The preview is scaled to fit the phone screen. Never capture that
   * scaled preview; clone the original A4 sheet at its real 1122x794 size.
   */
  const clone=source.cloneNode(true);
  clone.removeAttribute('id');
  clone.style.cssText=[
    'position:fixed',
    'left:-20000px',
    'top:0',
    'width:1122px',
    'height:794px',
    'min-height:794px',
    'max-height:794px',
    'transform:none!important',
    'transform-origin:top left',
    'margin:0!important',
    'box-sizing:border-box',
    'overflow:hidden',
    'background:#fff',
    'z-index:-1'
  ].join(';');
  document.body.appendChild(clone);

  try{
    const filename='HIS_'+a.className+'_Week_'+a.week+'.pdf';
    const options={
      margin:0,
      filename,
      image:{type:'jpeg',quality:1},
      html2canvas:{
        scale:3,
        useCORS:true,
        backgroundColor:'#fff',
        logging:false,
        letterRendering:true,
        width:1122,
        height:794,
        windowWidth:1122,
        windowHeight:794,
        scrollX:0,
        scrollY:0
      },
      pagebreak:{mode:'avoid-all'},
      jsPDF:{unit:'mm',format:'a4',orientation:'landscape',compress:true}
    };

    const blob=await html2pdf().set(options).from(clone).outputPdf('blob');
    if(!blob||blob.size<1000)throw new Error('Empty PDF file');

    const file=new File([blob],filename,{type:'application/pdf'});
    const result={file,blob,filename};
    pdfCache.set(key,result);
    return result;
  }finally{
    clone.remove();
  }
}
async function downloadPdf(a){
  if(!a)return;
  const button=[...document.querySelectorAll('.report-item .btn.primary')].find(b=>b.getAttribute('onclick')?.includes(String(a.id)));
  if(button)setButtonBusy(button,'Preparing...');

  try{
    const result=await buildPdfFile(a);
    if(!result)throw new Error('PDF was not created');

    if(navigator.share && (!navigator.canShare || navigator.canShare({files:[result.file]}))){
      try{
        await navigator.share({
          title:'HIS Assessment Report',
          text:a.className+' — Week '+a.week,
          files:[result.file]
        });
        toast('Ready to share');
        return;
      }catch(shareError){
        if(shareError?.name==='AbortError')return;
      }
    }

    const url=URL.createObjectURL(result.blob);
    const link=document.createElement('a');
    link.href=url;
    link.download=result.filename;
    link.target='_blank';
    link.rel='noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),10000);
    toast('PDF downloaded successfully');
  }catch(error){
    console.error('PDF export error:',error);
    toast('Could not create PDF','error');
  }finally{
    if(button)restoreButton(button);
    area.style.position='absolute';
  }
}
async function initReports(){
 try{
   d=await window.hisReady;
   list=document.getElementById('reports');area=document.getElementById('pdfArea');
   renderReports();
 }catch(error){console.error(error);document.getElementById('reports').innerHTML='<div class="empty-state"><h3>Google Sheets connection failed</h3><p>Please check the Apps Script deployment.</p></div>'}
}
initReports();
