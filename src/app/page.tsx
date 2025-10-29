// app/page.tsx
import Hero from "./components/landing/Hero";
import Features from "./components/landing/Features";
import StatsStrip from "./components/landing/StatsStrip";
import LatestNews from "./components/landing/LatestNews";
import CtaBand from "./components/landing/CtaBands";
import Footer from "./components/landing/Footer";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center w-full bg-[#0b0f1a] text-white">
      {/* Hero Section */}
      <section className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-1 md:py-2">
        <Hero />
      </section>

      {/* Stats Strip */}
      <section className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-1">
        <StatsStrip />
      </section>

      {/* Features Grid */}
      <section className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-16">
        <Features />
      </section>

      {/* Latest News */}
      <section className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-16 ">
        <LatestNews />
      </section>

      {/* Call-to-Action Band */}
      <section className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-16">
        <CtaBand />
      </section>
      <section className="w-full px-4 sm:px-6 md:px-8 lg:px-10 pt-16">
        <Footer />
      </section>
    </main>
  );
}
