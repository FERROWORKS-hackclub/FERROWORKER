(() => {
  'use strict';
  const endpoint='https://goldeneye.ferroworks.org/api/public/';
  const startedAt=Date.now();
  const survey=document.getElementById('fw-survey-form');
  const newsletter=document.getElementById('fw-newsletter-form');
  if(!survey||!newsletter)return;
  let step=0,surveyBusy=false,newsletterBusy=false;
  let surveyRequestId=crypto.randomUUID(),newsletterRequestId=crypto.randomUUID();
  const options={
    drive:['Direct drive','AMS-style material system','Both','Not sure'],
    priority:['3D printer','Laser','CNC'],
    filament:['PLA','PETG','ABS / ASA','TPU','Nylon','Carbon-fibre composite','Not sure','Other'],
    wood:['Plywood','MDF','Pine','Hardwood','Balsa','None','Not sure','Other'],
    tradeoffs:['Speed','Price','Quality'],wouldBuy:['Yes','Maybe','No']
  };
  function addChoices(target,name,values,multiple){
    const container=document.getElementById(target);
    values.forEach((value,index)=>{const label=document.createElement('label');label.className='fw-choice';const input=document.createElement('input');input.type=multiple?'checkbox':'radio';input.name=name;input.value=String(value);if(!multiple)input.required=true;const text=document.createElement('span');text.textContent=name==='price'?'$'+Number(value).toLocaleString('en-AU'):value;label.append(input,text);container.append(label);});
  }
  addChoices('fw-price-options','price',[2250,2500,2750,3000,3250],false);
  addChoices('fw-drive-options','drive',options.drive,false);
  addChoices('fw-priority-options','priority',options.priority,false);
  addChoices('fw-tradeoff-options','tradeoffs',options.tradeoffs,true);
  addChoices('fw-filament-options','filament',options.filament,true);
  addChoices('fw-wood-options','wood',options.wood,true);
  addChoices('fw-buy-options','wouldBuy',options.wouldBuy,false);
  function updateChoices(){
    const tradeoffs=[...survey.querySelectorAll('input[name="tradeoffs"]')],count=tradeoffs.filter(x=>x.checked).length;
    tradeoffs.forEach(x=>x.disabled=count===2&&!x.checked);
    document.getElementById('fw-tradeoff-count').textContent=count+' of 2 selected';
    ['filament','wood'].forEach(key=>{const other=!!survey.querySelector('input[name="'+key+'"][value="Other"]:checked');const label=document.getElementById('fw-'+key+'-other-label');label.hidden=!other;label.querySelector('input').required=other;});
  }
  survey.addEventListener('change',event=>{
    if(event.target.name==='wood'&&event.target.checked){const none=survey.querySelector('input[name="wood"][value="None"]');if(event.target.value==='None')survey.querySelectorAll('input[name="wood"]').forEach(x=>{if(x!==none)x.checked=false;});else none.checked=false;}
    updateChoices();
  });
  document.getElementById('fw-survey-shipping').addEventListener('input',event=>{document.getElementById('fw-shipping-output').textContent=event.target.value+' days';});
  function showStep(next,focus=true){
    step=next;survey.querySelectorAll('[data-survey-step]').forEach((section,index)=>{section.hidden=index!==step;});
    document.getElementById('fw-survey-step-label').textContent='0'+(step+1)+' / 03';
    document.getElementById('fw-survey-progress-fill').style.width=((step+1)/3*100)+'%';
    document.getElementById('fw-survey-back').hidden=step===0;
    document.getElementById('fw-survey-next').hidden=step===2;
    document.getElementById('fw-survey-submit').hidden=step!==2;
    document.getElementById('fw-survey-next-copy').hidden=step===2;
    document.getElementById('fw-survey-next-copy').textContent=step===0?'Up next: your machine':'Up next: materials';
    document.getElementById('fw-survey-message').textContent='';
    if(focus){const first=survey.querySelector('[data-survey-step="'+step+'"] input,[data-survey-step="'+step+'"] select');if(first)first.focus({preventScroll:true});document.querySelector('.fw-survey-card').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}
  }
  function stepValid(index){
    const section=survey.querySelector('[data-survey-step="'+index+'"]');
    for(const input of section.querySelectorAll('input,textarea,select'))if(!input.disabled&&!input.checkValidity()){showStep(index,false);input.reportValidity();return false;}
    const f=new FormData(survey);
    let message='';
    if(index===1&&f.getAll('tradeoffs').length!==2)message='Please choose exactly two of speed, price and quality.';
    if(index===2&&!f.getAll('filament').length)message='Please choose at least one filament option.';
    if(index===2&&!f.getAll('wood').length)message='Please choose at least one wood option, or None.';
    if(message){showStep(index,false);const node=document.getElementById('fw-survey-message');node.textContent=message;node.focus();return false;}
    return true;
  }
  document.getElementById('fw-survey-next').addEventListener('click',()=>{if(stepValid(step))showStep(Math.min(2,step+1));});
  document.getElementById('fw-survey-back').addEventListener('click',()=>showStep(Math.max(0,step-1)));
  function browserId(){try{const saved=localStorage.getItem('ferroworks.research.browser');if(saved&&/^[0-9a-f-]{36}$/i.test(saved))return saved;const id=crypto.randomUUID();localStorage.setItem('ferroworks.research.browser',id);return id;}catch{return crypto.randomUUID();}}
  function base(form,requestId){const f=new FormData(form);return {name:String(f.get('name')||'').trim(),email:String(f.get('email')||'').trim(),website:String(f.get('website')||''),browserId:browserId(),requestId,startedAt,privacyConsent:true,newsletterConsent:f.get('newsletterConsent')==='on',metadata:{timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'',language:navigator.language||'',screen:window.screen.width+'×'+window.screen.height}};}
  async function send(path,payload){
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),25000);
    try{const response=await fetch(endpoint+path,{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});const data=await response.json();if(!response.ok)throw Error(data.error||'Please check your answers and try again.');return data;}
    catch(error){if(error.name==='AbortError')throw Error('The connection took too long. Your answers are still here; please try again.');if(error instanceof TypeError)throw Error('We couldn’t connect. Check your internet connection and try again.');throw error;}
    finally{clearTimeout(timeout);}
  }
  survey.addEventListener('submit',async event=>{
    event.preventDefault();if(surveyBusy)return;for(let i=0;i<3;i++)if(!stepValid(i))return;
    const f=new FormData(survey),payload=base(survey,surveyRequestId);payload.answers={price:Number(f.get('price')),shippingDays:Number(f.get('shippingDays')),drive:String(f.get('drive')),make:String(f.get('make')||'').trim(),priority:String(f.get('priority')),filament:f.getAll('filament'),filamentOther:String(f.get('filamentOther')||'').trim(),wood:f.getAll('wood'),woodOther:String(f.get('woodOther')||'').trim(),tradeoffs:f.getAll('tradeoffs'),continent:String(f.get('continent')),wouldBuy:String(f.get('wouldBuy'))};
    surveyBusy=true;const button=document.getElementById('fw-survey-submit'),message=document.getElementById('fw-survey-message');button.disabled=true;button.textContent='Saving your answers…';message.textContent='';
    try{const data=await send('research',payload);survey.hidden=true;const complete=document.getElementById('fw-survey-complete');document.getElementById('fw-survey-complete-message').textContent=data.message;complete.hidden=false;complete.focus();document.getElementById('fw-survey-progress-fill').style.width='100%';}
    catch(error){message.textContent=error.message;message.focus();button.disabled=false;button.textContent='Share my answers ↗';surveyBusy=false;}
  });
  newsletter.addEventListener('submit',async event=>{
    event.preventDefault();if(newsletterBusy)return;newsletterBusy=true;const button=newsletter.querySelector('button'),message=document.getElementById('fw-newsletter-message');button.disabled=true;button.textContent='Joining…';message.textContent='';
    try{const data=await send('newsletter',base(newsletter,newsletterRequestId));message.textContent=data.message;button.textContent='Check your inbox ✓';message.focus();}
    catch(error){message.textContent=error.message;message.focus();button.disabled=false;button.textContent='Join the mailing list ↗';newsletterBusy=false;}
  });
  showStep(0,false);updateChoices();
})();
