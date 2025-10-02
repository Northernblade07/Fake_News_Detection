import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileForm from "../components/profile/ProfileForm";
import SecurityPanel from "../components/profile/SecurityPanel";
import NotificationsPanel from "../components/profile/NotificationsPanel";
import ActivityStats from "../components/profile/ActivityStats";
import RecentHistory, { Detection } from "../components/profile/RecentHistory";
import DangerZone from "../components/profile/DangerZone";
import { auth } from "../../../auth";
import { connectToDatabase } from "../lib/db";
import User from "@/app/model/user";
import NewsDetection from "@/app/model/News";
import { Geist, Geist_Mono } from "next/font/google";
import { ObjectId } from "mongoose";
import { signOut } from "next-auth/react";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

type UserProfile = {
  _id: string;
  name: string;
  role: string;
  avatar?: string;
  coverPhoto?: string;
  phone?: string;
  preferences?: {
    emailAlerts?: boolean;
    language?: string;
  };
  providers?: {
    google?: boolean;
    github?: boolean;
  };
};

export default async function ProfilePage() {
  await connectToDatabase();
  const session = await auth();
  if (!session?.user?.id) return <div>Loading...</div>; // replace with loader animation if needed

  // SSR: fetch only the data needed for read-only display
  const user = (await User.findById(session.user.id)
    .select("-password -otp -resetToken")
    .lean()) as UserProfile | null;

  if (!user) return <div>Loading...</div>;

  // Detection stats
  const totalDetections = await NewsDetection.countDocuments({ user: session.user.id });
  const fakeCount = await NewsDetection.countDocuments({ user: session.user.id, "result.label": "fake" });
  const realCount = await NewsDetection.countDocuments({ user: session.user.id, "result.label": "real" });

  // Fetch recent detections
  const recentDetectionsRaw = await NewsDetection.find({ user: session.user.id })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("title textContent result createdAt")
    .lean();

  // Convert raw detections to type-safe Detection[]
  // Type-safe mapping of recent detections
const recentDetectionsTyped: Detection[] = (recentDetectionsRaw as unknown as Array<{
  _id: ObjectId;
  title?: string;
  textContent?: string;
  result?: { label: "fake" | "real" | "unknown"; probability: number };
  createdAt?: Date;
}>).map(d => ({
  _id: String(d._id),
  title: d.title,
  textContent: d.textContent,
  result: d.result ?? { label: "unknown", probability: 0 },
  createdAt: d.createdAt?.toISOString() ?? new Date().toISOString(),
}));


  // Determine social provider link status
  const providers = {
    google: !!user?.providers?.google,
    github: !!user?.providers?.github,
  };

  const preferences = user?.preferences || {};

   const handleUpdate = async (data: { name: string; phone?: string }) => {
    await fetch("/api/profile/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    // Optionally, you can refresh the page or show a toast
  };

  return (
    <main className={`${geistSans.variable} ${geistMono.variable} min-h-dvh text-slate-100 bg-gradient-to-r from-sky-400 via-sky-500 to-amber-400`}>
      <div className="mx-auto max-w-2xl p-6 rounded-2xl shadow-xl bg-[#0b0f1a]/80 backdrop-blur">
        {/* SSR data */}
        <ProfileHeader
          user={{
            avatar: user?.avatar,
            coverPhoto: user?.coverPhoto,
            name: user?.name,
            role: user?.role,
          }}
        />
        <ActivityStats stats={{ totalDetections, fakeCount, realCount }} />
        <RecentHistory detections={recentDetectionsTyped} />

        {/* API-driven components */}
        <ProfileForm user={user} onUpdate={handleUpdate}/>
        <SecurityPanel providers={providers} />
        <NotificationsPanel
  userId={session.user.id}
  initialPreferences={preferences}
  locales={["en", "hi", "bn", "mr", "te", "ta", "gu", "ur", "kn", "or", "pa", "ml"]}
/>

<DangerZone
  onDelete={async () => {
    try {
      await fetch("/api/profile/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session?.user?.id }),
      });
      // Log out after deletion
      await signOut({ redirect: true, callbackUrl: "/" });
    } catch (err) {
      console.error("Delete failed", err);
    }
  }}
  onDownload={async () => {
    try {
      const res = await fetch("/api/profile/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session?.user?.id }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `account-data-${session?.user?.id}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
    }
  }}
  onLogout={async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
  }}
/>

      </div>
    </main>
  );
}
