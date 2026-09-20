const API_URL='https://script.google.com/macros/s/AKfycbwbqGTNeSgPxBweqmDLXQK4kfccbLxXXHAs9a5Shn6im5x-BTcnp6iE8wTT3Jqdg6-WSA/exec';

function apiGet(action='getData'){
  return new Promise((resolve,reject)=>{
    const callback='hisApiCallback_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const script=document.createElement('script');
    const cleanup=()=>{delete window[callback];script.remove()};
    const timer=setTimeout(()=>{cleanup();reject(new Error('Google Sheets request timed out'))},15000);
    window[callback]=(data)=>{
      clearTimeout(timer);cleanup();
      if(!data||data.success===false){reject(new Error(data?.error||'Google Sheets API error'));return}
      resolve(data);
    };
    script.onerror=()=>{clearTimeout(timer);cleanup();reject(new Error('Could not connect to Google Apps Script'))};
    script.src=API_URL+'?action='+encodeURIComponent(action)+'&callback='+encodeURIComponent(callback)+'&_='+Date.now();
    document.head.appendChild(script);
  });
}

async function apiPost(action,payload={}){
  const body=new URLSearchParams();
  body.set('action',action);
  body.set('payload',JSON.stringify(payload));
  const request=fetch(API_URL,{
    method:'POST',
    mode:'no-cors',
    headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
    body:body.toString()
  });
  await Promise.race([
    request.catch(()=>null),
    new Promise(resolve=>setTimeout(resolve,2500))
  ]);
  return {success:true};
}

function canonicalData(d){
  return {
    classes:(d.classes||[]).map(c=>({
      id:String(c.id||''),
      name:String(c.name||''),
      students:(c.students||[]).map(String)
    })),
    assessments:(d.assessments||[]).map(a=>({
      id:String(a.id||''),
      classId:String(a.classId||''),
      className:String(a.className||''),
      week:String(a.week||''),
      from:String(a.from||''),
      to:String(a.to||''),
      teacher:String(a.teacher||''),
      rows:(a.rows||[]).map(r=>({
        name:String(r.name||''),
        marks:Array.isArray(r.marks)?r.marks.map(x=>x===true?true:x===false?false:null):[],
        average:String(r.average||''),
        notes:String(r.notes||'')
      }))
    }))
  };
}
function dataMatches(target,remote){
  try{return JSON.stringify(canonicalData(target))===JSON.stringify(canonicalData(remote))}
  catch(e){return false}
}

async function saveRemoteData(data){
  await apiPost('saveData',{data});
  const wanted=JSON.parse(JSON.stringify(data));
  const started=Date.now();
  while(Date.now()-started<12000){
    try{
      const remote=await loadRemoteData();
      if(dataMatches(wanted,remote)) return {success:true,confirmed:true};
    }catch(e){}
    await new Promise(resolve=>setTimeout(resolve,700));
  }
  throw new Error('Google Sheets save confirmation timed out');
}

async function loadRemoteData(){
  const result=await apiGet('getData');
  return {classes:result.classes||[],assessments:result.assessments||[]};
}


async function deleteRemoteAssessment(id){
  const body=new URLSearchParams();
  body.set('action','deleteAssessment');
  body.set('payload',JSON.stringify({assessmentId:String(id)}));
  const request=fetch(API_URL,{
    method:'POST',
    mode:'no-cors',
    headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
    body:body.toString()
  });
  await Promise.race([
    request.catch(()=>null),
    new Promise(resolve=>setTimeout(resolve,2500))
  ]);
  const started=Date.now();
  while(Date.now()-started<12000){
    try{
      const remote=await loadRemoteData();
      if(!remote.assessments.some(a=>String(a.id)===String(id))){
        return {success:true,confirmed:true};
      }
    }catch(e){}
    await new Promise(resolve=>setTimeout(resolve,700));
  }
  throw new Error('Delete confirmation timed out');
}
