import { useEffect, useState } from 'react';

/**
 * ImageThumb
 * - Square thumbnail that opens a full-screen overlay on click
 * - Props:
 *    - src: string (required for display)
 *    - alt: string
 *    - size: number (px) — thumbnail width; height uses aspect 1:1
 *    - rounded: Tailwind rounding class (default "rounded-lg")
 *    - className: extra classes for the thumb button
 *    - disabled: boolean — if true, no overlay click
 *    - objectFit: "cover" | "contain" — thumbnail fit (default "cover")
 */
export default function ImageThumb({
  src = '',
  alt = '',
  size = 40,
  rounded = 'rounded-lg',
  className = '',
  disabled = false,
  objectFit = 'cover',
}) {
  const [open, setOpen] = useState(false);

  function openModal() {
    if (!disabled && src) setOpen(true);
  }
  function closeModal() {
    setOpen(false);
  }

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && closeModal();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Body scroll lock while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!src) {
    // Render an empty square (caller can show a fallback '—' if they want)
    return (
      <div
        className={`overflow-hidden border border-gray-100 ${rounded} ${className}`}
        style={{ width: `${size}px`, aspectRatio: '1 / 1' }}
      />
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={`overflow-hidden border border-gray-100 ${rounded} focus:outline-none focus:ring-2 focus:ring-primary/50 ${className} cursor-pointer hover:opacity-75`}
        style={{ width: `${size}px`, aspectRatio: '1 / 1' }}
        aria-label={`Open ${alt || 'image'} preview`}
      >
        <img
          src={src}
          alt={alt || 'thumbnail'}
          className={`w-full h-full object-${objectFit}`}
          loading="lazy"
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="relative max-w-[95vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={src}
              alt={alt || 'full image'}
              className="block w-auto h-auto max-w-[95vw] max-h-[90vh] object-contain shadow-lg"
            />
          </div>
          <button
            onClick={closeModal}
            className="h-10 aspect-square absolute top-4 right-4 text-white bg-black/0 hover:bg-black/50 rounded-full text-xl"
            aria-label="Close image"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
