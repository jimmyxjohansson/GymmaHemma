import LoginForm from "./LoginForm";

export default function LoginPage() {
  const needsCode = Boolean(process.env.SIGNUP_CODE?.trim());
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <img src="/icons/icon-192.png" alt="" className="mx-auto mb-4 h-20 w-20 rounded-2xl" />
        <h1 className="h-display text-4xl">Gymma Hemma</h1>
        <p className="mt-1 text-muted">Planera och logga passen i hemmagymmet</p>
      </div>
      <LoginForm needsCode={needsCode} />
    </main>
  );
}
