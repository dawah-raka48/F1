const API_URL='https://script.google.com/macros/s/AKfycbwbqGTNeSgPxBweqmDLXQK4kfccbLxXXHAs9a5Shn6im5x-BTcnp6iE8wTT3Jqdg6-WSA/exec';

async function apiGet(action='getData'){
  const response=await fetch(API_URL+'?action='+encodeURIComponent(action),{cache:'no-store'});
  if(!response.ok) throw new Error('API request failed: '+response.status);
  const data=await response.json();
  if(data.success===false) throw new Error(data.error||'API Error');
  return data;
}

async function apiPost(action,payload={}){
  const response=await fetch(API_URL,{
    method:'POST',
    headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({action,...payload})
  });
  if(!response.ok) throw new Error('API request failed: '+response.status);
  const data=await response.json();
  if(data.success===false) throw new Error(data.error||'API Error');
  return data;
}

async function loadRemoteData(){
  const result=await apiGet('getData');
  return {classes:result.classes||[],assessments:result.assessments||[]};
}

async function saveRemoteData(data){
  return apiPost('saveData',{data});
}
