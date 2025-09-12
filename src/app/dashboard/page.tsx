import { auth } from "@/../auth";
import DashboardHero from "@/app/components/DashboardHero";
import DetectionForm from "@/app/components/DetectionForm";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <DashboardHero />
      <section className="mt-8">
        <DetectionForm />
      </section>
    </div>
  );
}
