src\app\timeseries\ReactView.tsx (424:39) @ map

  422 |               </div>
  423 |               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
> 424 |                 {summaryCard.metrics?.map((m, i) => (
      |                                       ^
  425 |                   <div key={i} style={{ padding: 12, background: 'var(--grey-50)', borderRadius: 8 }}>
  426 |                     <div style={{ fontSize: 11, color: 'var(--grey-500)', marginBottom: 4 }}>{m.label}</div>
  427 |                     <div style={{ fontSize: 18, fontWeight: 700 }}>{m.value}</div>