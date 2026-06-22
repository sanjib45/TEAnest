const stats = [
  { label: 'Daily Harvest', value: '1,240 kg', change: '+12%', up: true, icon: 'grass' },
  { label: 'Batches Today', value: '24 Units', change: '+3', up: true, icon: 'inventory_2' },
  { label: 'Quality Index', value: 'A+ Grade', change: 'Excellent', up: true, icon: 'star' },
  { label: 'Revenue (MTD)', value: '₹4.8L', change: '+8%', up: true, icon: 'payments' },
];

const recentBatches = [
  { id: '#MN-2401', type: 'Green Oolong', weight: '85.4 kg', section: 'North Valley - G3', stars: 5, status: 'Ready for Harvest', time: 'Just now' },
  { id: '#MN-2399', type: 'Black Orthodox', weight: '112.0 kg', section: 'Ridgecrest - A1', stars: 4, status: 'Processing', time: '2 hours ago' },
  { id: '#MN-2398', type: 'First Flush White', weight: '42.5 kg', section: 'Morning Mist - B2', stars: 4, status: 'Ready for Harvest', time: '5 hours ago' },
  { id: '#MN-2395', type: 'CTC Blend', weight: '200.0 kg', section: 'Highland - C1', stars: 3, status: 'Dispatched', time: '1 day ago' },
];

const statusStyle = {
  'Ready for Harvest': 'bg-secondary-container/30 text-on-secondary-container',
  'Processing': 'bg-surface-variant text-on-surface-variant',
  'Dispatched': 'bg-primary-container/20 text-on-primary-container',
};

export default function DashboardPage() {
  return (
    <div>
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline text-3xl font-semibold text-primary">Dashboard</h1>
          <p className="text-on-surface-variant mt-1">Welcome back — Highland Estate overview</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="glass-card p-4 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-on-surface-variant text-sm font-semibold">{s.label}</p>
              <span className="material-symbols-outlined text-xl text-primary/60">{s.icon}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-headline text-2xl font-semibold text-primary">{s.value}</span>
              <span className="text-secondary text-xs font-bold flex items-center">
                <span className="material-symbols-outlined text-xs">arrow_upward</span>
                {s.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Batches Table */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-xl shadow-primary/5">
        <div className="p-4 border-b border-outline-variant/20 flex flex-col sm:flex-row gap-3 justify-between sm:items-center bg-surface-container-low/50">
          <h3 className="font-headline text-xl font-semibold text-primary">Recent Production Batches</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input
                className="pl-9 pr-4 py-2 bg-surface-container rounded-full border-none focus:ring-2 focus:ring-primary/20 text-sm w-full sm:w-52 outline-none"
                placeholder="Search batch..."
                type="text"
              />
            </div>
            <button className="p-2 rounded-full hover:bg-surface-variant/50 transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant">filter_list</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-surface border-y border-outline-variant/20">
                {['Sl. No.', 'Batch ID', 'Type', 'Weight', 'Source Section', 'Quality', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-on-surface-variant font-bold text-sm whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBatches.map((b, i) => (
                <tr key={b.id} className="odd:bg-white even:bg-surface-container-lowest/50 border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors text-on-surface">
                  <td className="px-4 py-4 text-on-surface-variant font-medium">{i + 1}</td>
                  <td className="px-4 py-4">
                    <div className="font-bold text-primary">{b.id}</div>
                    <div className="text-xs text-on-surface-variant">{b.time}</div>
                  </td>
                  <td className="px-4 py-4 text-on-surface-variant whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      {b.type}
                    </div>
                  </td>
                  <td className="px-4 py-4 font-medium text-on-surface-variant">{b.weight}</td>
                  <td className="px-4 py-4 text-on-surface-variant">{b.section}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center text-secondary">
                      {[...Array(5)].map((_, j) => (
                        <span key={j} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: `'FILL' ${j < b.stars ? 1 : 0}` }}>star</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${statusStyle[b.status] || 'bg-surface-variant text-on-surface-variant'}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-surface-container-lowest/30 flex items-center justify-between">
          <p className="text-xs text-on-surface-variant">Showing 1–4 of 124 batches</p>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg border border-outline-variant/30 hover:bg-surface-variant/20">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="p-2 rounded-lg border border-outline-variant/30 hover:bg-surface-variant/20">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
