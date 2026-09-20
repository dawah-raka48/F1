const API_URL='https://script.google.com/macros/s/AKfycbwbqGTNeSgPxBweqmDLXQK4kfccbLxXXHAs9a5Shn6im5x-BTcnp6iE8wTT3Jqdg6-WSA/exec';

function apiGet(action='getData'){
  return new Promise((resolve,reject)=>{
    const callback='hisApiCallback_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const script=document.createElement('script');
    const cleanup=()=>{
      delete window[callback];
      script.remove();
    };
    const timer=setTimeout(()=>{
      cleanup();
      reject(new Error('Google Sheets request timed out'));
    },15000);
    window[callback]=(data)=>{
      clearTimeout(timer);
      cleanup();
      if(!data || data.success===false){
        reject(new Error(data?.error||'Google Sheets API error'));
        return;
      }
      resolve(data);
    };
    script.onerror=()=>{
      clearTimeout(timer);
      cleanup();
      reject(new Error('Could not connect to Google Apps Script'));
    };
    script.src=API_URL+'?action='+encodeURIComponent(action)+'&callback='+encodeURIComponent(callback)+'&_='+Date.now();
    document.head.appendChild(script);
  });
}

async function apiPost(action,payload={}){
  const body=new URLSearchParams();
  body.set('action',action);
  body.set('payload',JSON.stringify(payload));
  const response=await fetch(API_URL,{
    method:'POST',
    mode:'no-cors',
    headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
    body:body.toString()
  });
  return {success:true};
}

async function loadRemoteData(){
  const result=await apiGet('getData');
  return {classes:result.classes||[],assessments:result.assessments||[]};
}

async function saveRemoteData(data){
  return apiPost('saveData',{data});
}
