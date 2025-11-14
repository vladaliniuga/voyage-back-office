import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DeleteConfirmModal from '@/features/_shared/DeleteConfirmModal';

/** Keep in sync with your app routes */
const PERMISSION_OPTIONS = [
  '/website/photo-gallery',
  '/menu',
  '/menu/items',
  '/users/*',
];

function UserEditor() {
  const router = useRouter();
  const uid = String(router.query.user || '');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [permissions, setPermissions] = useState([]);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!uid) return;
      setLoading(true);
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d = snap.data();
        setEmail(d.email || '');
        setDisplayName(d.displayName || '');
        setPermissions(Array.isArray(d.permissions) ? d.permissions : []);
      } else {
        // Not found — leave defaults so you can create on Save if desired
        setEmail('');
        setDisplayName('');
        setPermissions([]);
      }
      setLoading(false);
    }
    load();
  }, [uid]);

  const allowAll = permissions.includes('*');

  async function onSave() {
    try {
      setSaving(true);
      const perms = allowAll
        ? ['*']
        : Array.from(new Set((permissions || []).map(String)));

      await setDoc(
        doc(db, 'users', uid),
        {
          email: email.trim(),
          displayName: (displayName || '').trim(),
          permissions: perms,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(), // harmless if already exists (merge)
        },
        { merge: true }
      );
      alert('User updated');
    } catch (e) {
      alert(e?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    try {
      setDeleting(true);
      await deleteDoc(doc(db, 'users', uid)); // Firestore doc only
      setDeleting(false);
      setDeleteOpen(false);
      router.push('/users');
    } catch (e) {
      setDeleting(false);
      alert(e?.message || 'Failed to delete');
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div>Loading…</div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/users" className="text-primary underline">
            ← Back
          </Link>
          <h1 className="text-lg font-bold">User · {displayName}</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button
            variant="ghost"
            color="danger"
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow p-4 space-y-4">
        <Input
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
        />
        <Input
          label="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Jane Doe"
        />

        <div className="border border-gray-200 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Permissions</div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allowAll}
                onChange={(e) => setPermissions(e.target.checked ? ['*'] : [])}
              />
              <span>Grant all routes (*)</span>
            </label>
          </div>

          {!allowAll ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {PERMISSION_OPTIONS.map((p) => {
                const checked = permissions.includes(p);
                return (
                  <label
                    key={p}
                    className="inline-flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setPermissions((prev) => {
                          const set = new Set(prev);
                          if (e.target.checked) set.add(p);
                          else set.delete(p);
                          return Array.from(set);
                        });
                      }}
                    />
                    <span className="font-mono text-xs">{p}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-green-700">
              This user has access to all routes via <code>*</code>.
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmModal
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        confirming={deleting}
        title="Delete user?"
        message={`This will delete “${
          email || uid
        }” from Firestore (not Auth).`}
      />
    </>
  );
}

// Opt-in: use DashboardLayout for this page
UserEditor.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

// Optional: mark this page as protected
UserEditor.auth = true;

export default UserEditor;
