"use client";

import { useFormStatus } from "react-dom";

export default function ConfirmSubmit({
  children,
  message,
  className,
  pendingText = "Vänta…",
}: {
  children: React.ReactNode;
  message?: string;
  className?: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (message && !confirm(message)) e.preventDefault();
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}
