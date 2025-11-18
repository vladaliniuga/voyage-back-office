// /reservations/index.jsx
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Filters from '@/features/reservations/index/Filters';

const TZ_OFFSET_MINUTES = -10 * 60; // Pacific/Honolulu
const pad2 = (n) => String(n).padStart(2, '0');
const toYMD = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const nowInTZ = (offsetMinutes) => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + offsetMinutes * 60000);
};
const TODAY_HST = () => toYMD(nowInTZ(TZ_OFFSET_MINUTES));
const fmtMDY = (ymd = '') => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return ymd || '';
  const [, y, mo, d] = m;
  return `${mo}/${d}/${y}`;
};
const docList = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

function ReservationsIndex() {
  const router = useRouter();

  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);

  const [startDate, setStartDate] = useState(TODAY_HST());
  const [endDate, setEndDate] = useState(TODAY_HST());

  // Firestore subscription
  useEffect(() => {
    if (!startDate || !endDate) return;

    const clauses = [
      where('startDate', '>=', startDate),
      where('startDate', '<=', endDate),
      orderBy('startDate'),
    ];

    const qy = query(collection(db, 'vehicleEvents'), ...clauses);

    return onSnapshot(qy, (snap) => {
      const data = docList(snap);
      setRows(data);
      // default filtered = all (Filters can then refine it)
      setFilteredRows(data.filter((row) => row.status !== 'oos'));
    });
  }, [startDate, endDate]);

  const columns = useMemo(
    () => [
      {
        key: 'confirmation',
        title: 'Confirmation',
        render: (_, r) => r.confirmation || '—',
      },
      {
        key: 'renterName',
        title: 'Renter',
        render: (_, r) => (
          <div>
            <div className="font-medium">{r.renterName || '—'}</div>
            {r.renterEmail && (
              <div className="text-xs text-slate-600">{r.renterEmail}</div>
            )}
          </div>
        ),
      },
      {
        key: 'start',
        title: 'Pick-up',
        render: (_, r) => (
          <div>
            <div className="font-medium">
              {fmtMDY(r.startDate)} {r.startTime || ''}
            </div>
            {r.pickUpLocation && (
              <div className="text-xs text-slate-600">{r.pickUpLocation}</div>
            )}
          </div>
        ),
      },
      {
        key: 'end',
        title: 'Return',
        render: (_, r) => (
          <div>
            <div className="font-medium">
              {fmtMDY(r.endDate)} {r.endTime || ''}
            </div>
            {r.returnLocation && (
              <div className="text-xs text-slate-600">{r.returnLocation}</div>
            )}
          </div>
        ),
      },
      {
        key: 'vehicleClass',
        title: 'Vehicle Class',
        render: (_, r) => r.vehicleClass || '—',
      },
      {
        key: 'status',
        title: 'Status',
        render: (_, r) => r.status || '—',
      },
      {
        key: 'actions',
        title: '',
        render: (_, r) => (
          <div className="flex gap-2 justify-end">
            <Link href={`/reservations/${r.id}`}>
              <Button size="sm" variant="ghost">
                View
              </Button>
            </Link>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-lg font-bold">Reservations</h1>
          <p className="text-xs text-slate-600">
            Showing <strong>{filteredRows.length}</strong> reservations with
            start dates between <strong>{fmtMDY(startDate)}</strong> and{' '}
            <strong>{fmtMDY(endDate)}</strong>.
          </p>
        </div>

        {/* Date range controls */}
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-xs text-slate-600 mb-1">From</label>
            <input
              type="date"
              className="border border-gray-300 rounded-md px-2 h-8 text-sm bg-white"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">To</label>
            <input
              type="date"
              className="border border-gray-300 rounded-md px-2 h-8 text-sm bg-white"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const t = TODAY_HST();
              setStartDate(t);
              setEndDate(t);
            }}
          >
            Today
          </Button>
          <Button size="sm" onClick={() => router.push('/reservations/new')}>
            New reservation
          </Button>
        </div>
      </div>

      {/* Filters gets raw rows + callback to update filteredRows */}
      <Filters rows={rows} onChange={(next) => setFilteredRows(next)} />

      <Table columns={columns} rows={filteredRows} empty="No reservations." />
    </>
  );
}

ReservationsIndex.getLayout = (page) => (
  <DashboardLayout>{page}</DashboardLayout>
);
ReservationsIndex.auth = true;

export default ReservationsIndex;
