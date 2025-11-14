import Button from '@/components/ui/Button';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { RiMenu2Line } from 'react-icons/ri';

export default function Header({ onMenu, user }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur print:hidden">
      <div className="mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            size="square"
            variant="outline"
            onClick={onMenu}
            aria-label="Open menu"
            className="lg:hidden"
          >
            <RiMenu2Line />
          </Button>
          {user && (
            <>
              <div className="text-sm text-slate-700">
                {user.email || 'Not signed in'}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => signOut(auth)} size="sm" variant="ghost">
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
