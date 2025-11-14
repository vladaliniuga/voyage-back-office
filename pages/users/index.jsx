import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  deleteDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { db } from '@/lib/firebase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import DeleteConfirmModal from '@/features/_shared/DeleteConfirmModal';

/** Keep in sync with your app routes */
const PERMISSION_OPTIONS = [
  '/website/photo-gallery',
  '/menu',
  '/menu/items',
  '/users/*', // allows viewing any /users/:uid page
];

function UsersIndex() {
  const router = useRouter();
  const auth = getAuth();

  const [rows, setRows] = useState([]);

  const [openNew, setOpenNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    displayName: '',
    permissions: [],
  });

  // delete modal state (Firestore doc only; not Auth)
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* Live users list */
  useEffect(() => {
    const qy = query(collection(db, 'users'));
    return onSnapshot(qy, (snap) => {
      setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const columns = useMemo(
    () => [
      {
        key: 'displayName',
        title: 'Name',
        render: (_, r) => r.displayName || '—',
      },
      { key: 'email', title: 'Email' },
      {
        key: 'permissions',
        title: 'Permissions',
        render: (_, r) => {
          const p = Array.isArray(r.permissions) ? r.permissions : [];
          if (p.includes('*'))
            return <span className="text-green-700">All routes</span>;
          if (!p.length) return <span className="text-slate-400">None</span>;
          const shown = p.slice(0, 3);
          const extra = p.length - shown.length;
          return (
            <span className="text-xs text-slate-700">
              {shown.join(', ')}
              {extra > 0 && ` +${extra} more`}
            </span>
          );
        },
      },
      {
        key: 'updatedAt',
        title: 'Updated',
        render: (_, r) => {
          const ts = r.updatedAt?.toDate
            ? r.updatedAt.toDate()
            : r.updatedAt
            ? new Date(r.updatedAt)
            : null;
          return ts ? ts.toLocaleString() : '—';
        },
      },
      {
        key: 'actions',
        title: '',
        render: (_, r) => (
          <div className="flex gap-2">
            <Link href={`/users/${r.id}`}>
              <Button size="sm" variant="ghost">
                Edit
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              color="danger"
              onClick={() => setToDelete(r)}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  function onOpenNew() {
    setForm({ email: '', password: '', displayName: '', permissions: [] });
    setOpenNew(true);
  }

  async function createUser() {
    try {
      setCreating(true);
      const { email, password, displayName } = form;
      if (!email || !password)
        throw new Error('Email and password are required');

      // 1) Create Firebase Auth user
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password.trim()
      );
      const uid = cred.user.uid;

      // 2) Create Firestore user doc with UID as id
      const perms = form.permissions.includes('*')
        ? ['*']
        : Array.from(new Set((form.permissions || []).map(String)));

      await setDoc(doc(db, 'users', uid), {
        email: email.trim(),
        displayName: (displayName || '').trim(),
        permissions: perms,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setOpenNew(false);
      setCreating(false);
      router.push(`/users/${uid}`);
    } catch (e) {
      console.error(e);
      alert(e?.message || 'Failed to create user');
      setCreating(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      setDeleting(true);
      await deleteDoc(doc(db, 'users', toDelete.id)); // Firestore doc only
      setDeleting(false);
      setToDelete(null);
    } catch (e) {
      setDeleting(false);
      alert(e?.message || 'Delete failed');
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">Users</h1>
        <Button onClick={onOpenNew}>New user</Button>
      </div>

      <Table columns={columns} rows={rows} empty="No users." />

      {/* Create user modal */}
      <Modal
        open={openNew}
        onClose={() => setOpenNew(false)}
        title="New user"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpenNew(false)}>
              Cancel
            </Button>
            <Button onClick={createUser} disabled={creating}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="user@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            placeholder="Min. 6 characters"
            required
          />
          <Input
            label="Display name"
            value={form.displayName}
            onChange={(e) =>
              setForm((f) => ({ ...f, displayName: e.target.value }))
            }
            placeholder="Jane Doe"
          />

          {/* Permissions */}
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm font-medium mb-2">Permissions</div>
              {/* Grant all routes */}
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.permissions.includes('*')}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      permissions: e.target.checked ? ['*'] : [],
                    }))
                  }
                />
                <span className="">Grant all routes (*)</span>
              </label>
            </div>

            {/* Individual routes (hidden when *) */}
            {!form.permissions.includes('*') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {PERMISSION_OPTIONS.map((p) => {
                  const checked = form.permissions.includes(p);
                  return (
                    <label
                      key={p}
                      className="inline-flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setForm((f) => {
                            const set = new Set(f.permissions || []);
                            if (e.target.checked) set.add(p);
                            else set.delete(p);
                            return { ...f, permissions: Array.from(set) };
                          });
                        }}
                      />
                      <span className="font-mono text-xs">{p}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete confirm (Firestore doc only) */}
      <DeleteConfirmModal
        open={!!toDelete}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
        confirming={deleting}
        title="Delete user?"
        message={`This will permanently delete “${
          toDelete?.email || toDelete?.id || 'this user'
        }” from Firestore.`}
        confirmLabel="Delete"
      />
    </>
  );
}

// Opt-in: use DashboardLayout for this page
UsersIndex.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

// Optional: mark this page as protected
UsersIndex.auth = true;

export default UsersIndex;
