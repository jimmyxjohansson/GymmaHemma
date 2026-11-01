import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-4 px-5 text-center">
      <h1 className="h-display text-4xl">Hittades inte</h1>
      <p className="text-muted">Sidan eller passet finns inte (längre).</p>
      <Link href="/" className="btn-primary">Till startsidan</Link>
    </main>
  );
}
