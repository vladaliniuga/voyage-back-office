import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // adjust path to your firebase config

function useFetchDoc(collectionName, docId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!collectionName || !docId) return;

    let isMounted = true; // prevent state updates after unmount

    async function fetchDoc() {
      setLoading(true);
      try {
        const ref = doc(db, collectionName, docId);
        const snap = await getDoc(ref);

        if (isMounted) {
          if (snap.exists()) {
            setData({ id: snap.id, ...snap.data() });
          } else {
            setError(new Error('Document not found'));
          }
        }
      } catch (err) {
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDoc();

    return () => {
      isMounted = false;
    };
  }, [collectionName, docId]);

  return { data, loading, error };
}

export default useFetchDoc;
