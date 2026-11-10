import { useEffect, useRef } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import styles from "./styles.module.css";

const ConfirmDialog = ({ title, description, confirmLabel = "Delete", onCancel, onConfirm, fallbackFocusRef }) => {
    const cancelRef = useRef(null);
    const dialogRef = useRef(null);
    const onCancelRef = useRef(onCancel);
    onCancelRef.current = onCancel;
    useEffect(() => {
        const previousFocus = document.activeElement;
        cancelRef.current?.focus();
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onCancelRef.current();
                return;
            }
            if (event.key !== "Tab") return;
            const focusable = dialogRef.current?.querySelectorAll("button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])");
            const first = focusable?.[0];
            const last = focusable?.[focusable.length - 1];
            if (!first) {
                event.preventDefault();
                dialogRef.current?.focus();
            } else if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
            else fallbackFocusRef?.current?.focus();
        };
    }, [fallbackFocusRef]);
    return <div className={styles.overlay} onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
        <section className={styles.dialog} ref={dialogRef} tabIndex="-1" role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
            <span className={styles.icon}><FiAlertTriangle aria-hidden="true" /></span>
            <h2 id="confirm-title">{title}</h2>
            <p id="confirm-description">{description}</p>
            <div className={styles.actions}><button type="button" ref={cancelRef} onClick={onCancel}>Cancel</button><button type="button" className={styles.confirm} onClick={onConfirm}>{confirmLabel}</button></div>
        </section>
    </div>;
};

export default ConfirmDialog;
