
import { Navbar } from "@/components/Navbar";
import React from "react";

const BrandLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    <Navbar role="brand" />
    <main className="flex-1 w-full max-w-5xl mx-auto py-10">{children}</main>
  </div>
);
export default BrandLayout;
