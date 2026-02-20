import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 overflow-x-hidden pt-12 sm:pt-14 md:pt-16">
        <div className="pointer-events-none fixed inset-0 -z-10 opacity-40 [background:radial-gradient(circle_at_15%_15%,rgba(7,18,43,0.08),transparent_38%),radial-gradient(circle_at_85%_20%,rgba(254,193,16,0.10),transparent_35%),radial-gradient(circle_at_50%_85%,rgba(7,18,43,0.06),transparent_42%)]" />
        {children}
      </main>
      <Footer />
    </div>
  );
}

