// app/page.tsx
import Hero from "./components/landing/Hero";
import Features from "./components/landing/Features";
import StatsStrip from "./components/landing/StatsStrip";
import LatestNews from "./components/landing/LatestNews";
import CtaBand from "./components/landing/CtaBand";

export default async function HomePage() {
  // If you later want SSR news, fetch here and pass as props to LatestNews
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8 py-10 space-y-14">
      <Hero />
      <StatsStrip />
      <Features />
      <LatestNews />
      <CtaBand />
    </div>
  );
}
