export async function handler(event, context) {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
  const disease = (event.queryStringParameters?.disease || '').toLowerCase().trim();
  if(!disease){ return { statusCode:400, headers, body: JSON.stringify({error:'Missing disease'}) }; }
  try{
    const url = `https://api.fda.gov/drug/label.json?search=indications_and_usage:${encodeURIComponent(disease)}&limit=10`;
    const res = await fetch(url, { timeout: 8000 });
    if(!res.ok) throw new Error('openfda error');
    const j = await res.json();
    const names = new Set();
    for(const item of j.results || []){
      const openfda = item.openfda || {};
      (openfda.brand_name || []).forEach(n=>names.add(n));
      (openfda.generic_name || []).forEach(n=>names.add(n));
    }
    return { statusCode:200, headers, body: JSON.stringify({ medicines: Array.from(names).slice(0,10) }) };
  }catch(e){
    return { statusCode:200, headers, body: JSON.stringify({ medicines: [] }) };
  }
}