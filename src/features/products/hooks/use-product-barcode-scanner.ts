import { useEffect, useRef } from "react";

const isEditableElement = (target: EventTarget | null) =>
  target instanceof HTMLInputElement ||
  target instanceof HTMLTextAreaElement ||
  target instanceof HTMLSelectElement ||
  (target instanceof HTMLElement && target.isContentEditable);

interface UseProductBarcodeScannerOptions {
  enabled: boolean;
  onScan: (barcode: string) => void;
}

/**
 * Keeps the barcode field ready when the product form opens and also accepts
 * scanner bursts while no editable field is selected. USB scanners behave as
 * keyboards, so the focused barcode input covers the normal registration flow.
 */
export const useProductBarcodeScanner = ({ enabled, onScan }: UseProductBarcodeScannerOptions) => {
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const bufferRef = useRef("");
  const firstKeyAtRef = useRef(0);
  const lastKeyAtRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const focusTimer = window.setTimeout(() => barcodeInputRef.current?.focus(), 100);
    return () => window.clearTimeout(focusTimer);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const reset = () => {
      bufferRef.current = "";
      firstKeyAtRef.current = 0;
      lastKeyAtRef.current = 0;
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || isEditableElement(event.target)) return;

      const now = Date.now();
      if (event.key === "Enter") {
        const elapsed = now - firstKeyAtRef.current;
        const barcode = bufferRef.current;
        if (barcode.length >= 3 && elapsed <= 700) {
          event.preventDefault();
          onScan(barcode);
          barcodeInputRef.current?.focus();
        }
        reset();
        return;
      }
      if (event.key.length !== 1) return;
      if (lastKeyAtRef.current && now - lastKeyAtRef.current > 120) reset();
      if (!firstKeyAtRef.current) firstKeyAtRef.current = now;
      bufferRef.current += event.key;
      lastKeyAtRef.current = now;
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [enabled, onScan]);

  return barcodeInputRef;
};
