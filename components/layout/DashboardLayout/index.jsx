import { useState, useEffect } from 'react';
import Header from './Header';
import SideNav from '../SideNav';
import Breadcrumbs from './Breadcrumbs';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import useFetchDoc from '@/lib/useFetchDoc';

export default function DashboardLayout({ children }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      }
    });

    return () => unsubscribe();
  }, []);

  const { data } = useFetchDoc('users', user?.uid);

  return (
    // Use dynamic viewport on mobile; prevent page-level scroll
    <div className="h-dvh lg:h-screen overflow-hidden lg:grid lg:grid-cols-[18rem_1fr] bg-gray-50">
      {/* Sidebar (fixed on mobile, sticky on desktop) */}
      <SideNav open={open} onClose={() => setOpen(false)} currentUser={data} />

      {/* Main column gets a real height on mobile so its child can scroll */}
      <div className="flex h-dvh lg:h-screen min-h-0 flex-col overflow-hidden">
        <Header onMenu={() => setOpen(true)} user={user} />

        {/* Only this area scrolls */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <main className="mx-auto w-full max-w-7xl px-4 py-6 min-h-full">
            <Breadcrumbs />
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
