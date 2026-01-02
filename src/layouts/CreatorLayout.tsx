
import Sidebar from "@/components/creator/Sidebar";
import React from "react";

const CreatorLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col md:flex-row overflow-x-hidden">
    <Sidebar />
    <div className="flex-1 w-full md:ml-64">
      <main className="w-full px-4 sm:px-6 md:px-10 py-6 md:py-8">
        <div className="mx-auto w-full max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  </div>
);
export default CreatorLayout;
