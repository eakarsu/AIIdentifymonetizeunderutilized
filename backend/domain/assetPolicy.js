const STAGES = Object.freeze(['inventoried','baselined','candidate','review','approved','executed','measured','closed']);
function calculateUtilization({ available_hours, used_hours, annual_cost }) {
  const available = Number(available_hours), used = Number(used_hours), cost = Number(annual_cost);
  if (![available,used,cost].every(Number.isFinite) || available <= 0 || used < 0 || used > available || cost < 0) throw new Error('invalid utilization baseline');
  const utilization = used / available;
  return { utilization: Math.round(utilization*10000)/10000, idle_hours: available-used, idle_cost: Math.round(cost*(1-utilization)*100)/100 };
}
function validateOpportunity({asset_ref,rights_version,constraints,valuation,opportunity_type}) {
  if(!asset_ref||!rights_version) throw new Error('asset identity and effective rights are required');
  if(!['reuse','lease','sale'].includes(opportunity_type)) throw new Error('unsupported opportunity type');
  if(!Array.isArray(constraints)) throw new Error('constraints must be an array');
  const amount=Number(valuation?.amount); if(!Number.isFinite(amount)||amount<0||!valuation?.currency||!valuation?.method||!valuation?.as_of) throw new Error('versioned valuation evidence required');
  if(Number.isNaN(new Date(valuation.as_of).valueOf())) throw new Error('valuation as_of is invalid');
  return {asset_ref,rights_version,opportunity_type,constraints,valuation:{...valuation,amount}};
}
function calculateOutcome({baseline_cost,realized_cost,proceeds=0}) { const values=[baseline_cost,realized_cost,proceeds].map(Number); if(!values.every(Number.isFinite)||values.some(v=>v<0)) throw new Error('invalid outcome amounts'); return {realized_savings:Math.round((values[0]-values[1]+values[2])*100)/100, measured:true}; }
function validateTransition(from,to,context={}) {
  const allowed={inventoried:['baselined'],baselined:['candidate'],candidate:['review'],review:['candidate','approved'],approved:['executed'],executed:['measured'],measured:['closed'],closed:[]};
  if(!allowed[from]?.includes(to)) throw new Error('invalid asset transition');
  if(['approved','executed','closed'].includes(to)&&!['admin','asset_owner','disposal_authority'].includes(context.role)) throw new Error('asset authority required');
  if(to==='approved'&&context.createdBy===context.actorId) throw new Error('owner approval must be independent');
  if(['review','approved'].includes(to)&&(!context.rightsVersion||!context.valuationEvidence)) throw new Error('rights and valuation evidence required');
  if(to==='executed'&&!context.executionReference) throw new Error('execution reference required');
  return true;
}
module.exports={STAGES,calculateUtilization,validateOpportunity,calculateOutcome,validateTransition};
