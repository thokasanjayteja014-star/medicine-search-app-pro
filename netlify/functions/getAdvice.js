function categorize(disease){
  const d=(disease||'').toLowerCase(); const has=a=>a.some(k=>d.includes(k));
  if(has(['fever','flu','infection','covid','malaria','dengue','typhoid'])) return 'infection';
  if(has(['cold','asthma','copd','wheeze','sinus','allergy','rhinitis'])) return 'respiratory';
  if(has(['reflux','gerd','ulcer','gastr','vomit','diarr','constipation','hepat'])) return 'gastro';
  if(has(['diabetes','hypergly','hypogly','sugar'])) return 'endocrine';
  if(has(['bp','hypertension','heart','cardiac','stroke','cholesterol','angina'])) return 'cardio';
  if(has(['migraine','headache','seizure','epilep','parkinson','vertigo'])) return 'neuro';
  if(has(['arthritis','sprain','back pain','neck pain','sciatica','gout'])) return 'musculoskeletal';
  if(has(['uti','urinary','kidney','renal','stones'])) return 'renal';
  if(has(['eczema','psoriasis','acne','rash','dermat'])) return 'skin';
  if(has(['conjunctivitis','glaucoma','cataract'])) return 'eye';
  if(has(['ear','tonsillitis','pharyngitis','sinusitis'])) return 'ent';
  return 'general';
}
const LIB={
  general:{precautions:['Consult a clinician for diagnosis.','Seek urgent care for red-flag symptoms (breathing difficulty, chest pain, confusion).','Use medicines only as directed.','Rest, hydrate; avoid smoking/alcohol.'],food:['Balanced meals with fruits/vegetables.','Adequate fluids; ORS if dehydrated.','Limit ultra-processed foods and alcohol.']},
  infection:{precautions:['Hydrate and rest; monitor temperature.','Use antipyretics as advised; avoid aspirin in children/teens with viral illness.','Hygiene: hand-washing, mask if coughing, isolate when contagious.','Seek care for persistent high fever, stiff neck, rash, or breathing difficulty.'],food:['Fluids: water, broths, ORS.','Light, easy-to-digest foods.','Consider probiotic-rich yogurt with antibiotics unless contraindicated.']},
  respiratory:{precautions:['Avoid smoke, dust, triggers; use masks in pollution.','Use inhalers/sprays exactly as prescribed.','Urgent care for blue lips or severe breathlessness.'],food:['Warm fluids and soups.','If reflux triggers, avoid late meals and very spicy/fatty foods.']},
  gastro:{precautions:['For vomiting/diarrhea: prioritize oral rehydration.','Avoid NSAIDs on empty stomach; seek care for blood in stool or persistent vomiting.','For reflux/ulcer: avoid lying down within 2–3 hours of meals.'],food:['Small, frequent, bland meals during upset.','Avoid very spicy, fatty, acidic foods and excess caffeine.','Use ORS for diarrhea per local guidance.']},
  endocrine:{precautions:['Monitor blood glucose as advised.','Carry quick sugar for hypoglycemia symptoms.','Foot care daily; regular check-ups.'],food:['High-fiber whole foods; limit sugary drinks.','Distribute meals evenly across the day.']},
  cardio:{precautions:['Adhere to BP/heart meds; do not stop abruptly.','Monitor blood pressure if advised.','Emergency for chest pain or one-sided weakness.'],food:['DASH-style eating; more fruits/veg.','Reduce salt (<5 g/day); avoid trans fats and limit alcohol.']},
  neuro:{precautions:['For migraines: manage sleep and stress; keep trigger diary.','Avoid medication overuse.','Emergency for stroke signs (FAST).'],food:['Regular meals and hydration; avoid known personal triggers.']},
  musculoskeletal:{precautions:['Rest initially; gradual return to activity; mind ergonomics.','Use cold/heat therapy as advised.','Seek care for numbness/weakness.'],food:['Adequate protein and calcium/vitamin D.','Maintain healthy weight.']},
  renal:{precautions:['Hydration as advised; adjust if heart/kidney failure.','Avoid NSAIDs unless approved; check renal dosing.','Seek care for fever with flank pain or low urine output.'],food:['For stones: increase fluids; limit sodium; adequate calcium.','For CKD: follow clinician-guided limits (protein, sodium, potassium, phosphorus).']},
  skin:{precautions:['Avoid scratching; gentle skincare and moisturizers.','Use prescribed meds as directed.','Seek care for spreading infection or severe blistering.'],food:['Balanced diet; avoid personal triggers if documented.']},
  eye:{precautions:['Avoid contact lenses during infections; hand hygiene.','Urgent care for vision loss, severe pain, or trauma.'],food:['Leafy greens and fish as part of balanced diet.']},
  ent:{precautions:['For sore throat: rest voice, humid air, hydrate.','Avoid smoking; follow antibiotic guidance if prescribed.'],food:['Warm fluids and soft foods; avoid very spicy/acidic items.']}
};
async function fetchWikiSummary(term){
  try{
    const url=`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`;
    const res=await fetch(url,{headers:{'accept':'application/json'},timeout:7000});
    if(!res.ok) return null; const j=await res.json(); if(j.type&&j.type.includes('disambiguation')) return null;
    return { title:j.title, extract:j.extract, url:j.content_urls?.desktop?.page || j.content_urls?.mobile?.page };
  }catch(e){ return null; }
}
export async function handler(event,context){
  const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type'};
  const q=(event.queryStringParameters?.disease||'').trim(); if(!q) return {statusCode:400,headers,body:JSON.stringify({error:'Missing disease'})};
  const cat=categorize(q); const base=LIB[cat]||LIB.general; const wiki=await fetchWikiSummary(q);
  return { statusCode:200, headers, body: JSON.stringify({ disease:q, category:cat, source: wiki?{title:wiki.title,url:wiki.url}:null, summary: wiki?.extract||null, precautions: base.precautions, food: base.food }) };
}