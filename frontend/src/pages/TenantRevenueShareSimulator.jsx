import React, { useEffect, useState } from 'react';

export default function TenantRevenueShareSimulator() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/tenant-revenue-share-simulator').then((r) => r.json()).then(setData).catch(() => {});
  }, []);
  return (
    <div>
      <h1>Tenant Revenue Share Simulator</h1>
      <p>Models how monetized underutilized assets split revenue among tenants, reinvestment, and owner net.</p>
      {data?.assets?.map((a) => <section key={`${a.building}-${a.asset}`} className="card"><h2>{a.building}</h2><p>{a.asset}: tenant ${a.tenant_distribution}, reinvest {a.reinvestment_pool}, owner {a.owner_net}</p></section>)}
    </div>
  );
}
