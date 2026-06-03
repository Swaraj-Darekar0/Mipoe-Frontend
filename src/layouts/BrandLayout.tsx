
import { Navbar } from "@/components/Navbar";
import React from "react";

const BrandLayout = ({ children, fullWidth = false }: { children: React.ReactNode; fullWidth?: boolean }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    <Navbar role="brand" />
    <main className={`flex-1 w-full ${fullWidth ? "px-6 md:px-8 py-6" : "max-w-5xl mx-auto py-10"}`}>{children}</main>
  </div>
);
export default BrandLayout;
