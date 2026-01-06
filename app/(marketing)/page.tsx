export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-24">
      
      {/* HERO */}
      <section className="max-w-4xl">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
              49GIG
            </h1>
            <p className="text-xl text-muted-foreground sm:text-2xl">
              High-Trust Freelance Marketplace
            </p>
          </div>

          <p className="text-lg text-muted-foreground max-w-2xl">
            Building a curated freelance marketplace inspired by Andela
          </p>

          <div className="flex flex-wrap gap-2">
            {["Next.js 16", "Convex", "TypeScript", "Zustand"].map((t) => (
              <span key={t} className="rounded-full bg-muted px-3 py-1 text-sm">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* STATUS CARD */}
      <section className="mt-24 max-w-3xl">
        <div className="rounded-lg border bg-card p-8">
          <h2 className="text-2xl font-semibold mb-6">
            Implementation Status
          </h2>

          <div className="space-y-3">
            {/* status rows */}
          </div>
        </div>
      </section>

    </div>
  );
}
