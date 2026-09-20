const API_URL='https://script.google.com/macros/s/AKfycbxme-qx5jCzov2aL1ez3kf-0_hUx_DughdvyDN0sE-kYfwejFyelkZG4xihOpHg_2zIGA/exec';

async function apiGet(action='getData'){
  const response=await fetch(API_URL+'?action='+encodeURIComponent(action));
  if(!response.ok) throw new Error('API request failed');
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
  if(!response.ok) throw new Error('API request failed');
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
