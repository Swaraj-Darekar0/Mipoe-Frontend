
import { Navbar } from "@/components/Navbar";
import React from "react";

const CreatorLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    <Navbar role="creator" />
    <main className="flex-1 w-full max-w-3xl mx-auto py-10">{children}</main>
  </div>
);
export default CreatorLayout;
