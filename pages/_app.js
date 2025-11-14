// pages/_app.jsx
import '@/styles/globals.css';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { requireAuth } from '@/lib/authGuard';

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // Per-page layout (falls back to no layout)
  const getLayout = Component.getLayout ?? ((page) => page);

  // Optional: only guard pages that ask for it
  useEffect(() => {
    if (Component.auth) requireAuth();
  }, [Component]);

  // Example: still allow /login to be public if you prefer
  if (router.pathname === '/login') {
    return <Component {...pageProps} />;
  }

  return getLayout(<Component {...pageProps} />);
}
