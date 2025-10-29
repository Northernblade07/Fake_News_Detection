// app/provider.tsx
"use client";
import { SessionProvider } from "next-auth/react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <ToastContainer position="top-right" theme="dark" newestOnTop closeOnClick pauseOnHover />
    </SessionProvider>
  );
}
