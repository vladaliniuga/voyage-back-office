// /features/reservations/index/Filters.jsx
import { useEffect, useMemo, useState } from 'react';

function simplify(s) {
  return String(s || '').toLowerCase();
}

export default function Filters({ rows, onChange }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(''); // example extra filter

  // Compute filtered list based on raw rows + filter state
  const filtered = useMemo(() => {
    const q = simplify(search);
    return (rows || [])
      .filter((r) => r.status !== 'oos') // base filter
      .filter((r) => {
        // search by name/email/confirmation
        if (!q) return true;
        const name = simplify(r.renterName);
        const email = simplify(r.renterEmail);
        const conf = simplify(r.confirmation);
        return name.includes(q) || email.includes(q) || conf.includes(q);
      })
      .filter((r) => {
        if (!status) return true;
        return r.status === status;
      });
  }, [rows, search, status]);

  // Whenever filtered changes, notify parent
  useEffect(() => {
    onChange(filtered);
  }, [filtered, onChange]);

  return (
    <div className="mb-4 flex flex-wrap gap-2 items-end">
      <div className="w-full md:w-64">
        <label className="block text-xs text-slate-600 mb-1">Search</label>
        <input
          type="text"
          className="border border-gray-300 rounded-md px-2 h-8 text-sm bg-white w-full"
          placeholder="Name, email, confirmation #"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs text-slate-600 mb-1">Status</label>
        <select
          className="border border-gray-300 rounded-md px-2 h-8 text-sm bg-white"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All</option>
          <option value="reserved">Reserved</option>
          <option value="checked_out">Checked out</option>
          <option value="checked_in">Checked in</option>
          {/* add more matching your status IDs */}
        </select>
      </div>

      {/* Add more filters here (vehicleClass, lead, assignedVehicle, etc.) */}
    </div>
  );
}
