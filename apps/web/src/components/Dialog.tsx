import { useEffect, useId, useRef, type ReactNode } from "react";
export function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const opener = useRef(
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    const previous = opener.current;
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="dialog-heading">
        <div>
          <p className="eyebrow">Research record</p>
          <h2 id={titleId}>{title}</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className="dialog-body">{children}</div>
    </dialog>
  );
}
