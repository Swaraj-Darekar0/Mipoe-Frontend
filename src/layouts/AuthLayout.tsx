
import { Navbar } from "@/components/Navbar";
import React from "react";

const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    <Navbar />
    <main className="flex-1 flex flex-col items-center justify-center">
      {children}
    </main>
  </div>
);
export default AuthLayout;
