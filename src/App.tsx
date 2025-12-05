import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";

// Lazy load all page components for code-splitting
const Index = React.lazy(() => import("./pages/Index"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const Login = React.lazy(() => import("./pages/Login"));
const Register = React.lazy(() => import("./pages/Register"));
const CreatorDashboard = React.lazy(() => import("./pages/creator/Dashboard"));
const SubmitClip = React.lazy(() => import("./pages/creator/SubmitClip"));
const BrandDashboard = React.lazy(() => import("./pages/brand/Dashboard"));
const CreateCampaign = React.lazy(() => import("./pages/brand/CreateCampaign"));
const CampaignAnalytics = React.lazy(() => import("./pages/brand/CampaignAnalytics"));
const CampaignView = React.lazy(() => import("./pages/creator/CampaignView"));
const CreatorProfile = React.lazy(() => import("./pages/creator/Profile"));
const CompleteProfile = React.lazy(() => import("./pages/creator/CompleteProfile"));
const AdminPage = React.lazy(() => import("./pages/admin/Admin"));
const AdminLogin = React.lazy(() => import("./pages/AdminLogin"));
const Wallet = React.lazy(() => import("./pages/creator/Wallet"));
const Withdrawals = React.lazy(() => import("./pages/creator/Withdrawals"));
const BrandTransactions = React.lazy(() => import("./pages/brand/Transactions"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen w-screen bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/creator/dashboard" element={<CreatorDashboard />} />
            <Route path="/creator/submit/:campaignId" element={<SubmitClip />} />
            <Route path="/brand/dashboard" element={<BrandDashboard />} />
            <Route path="/brand/dashboard/:campaignId" element={<CampaignAnalytics />} />
            <Route path="/brand/create" element={<CreateCampaign />} />
            <Route path="/creator/dashboard/:campaign_id" element={<CampaignView />} />
            <Route path="/creator/profile" element={<CreatorProfile />} />
            <Route path="/creator/complete-profile" element={<CompleteProfile />} />
            <Route path="/creator/wallet" element={<Wallet />} />
            <Route path="/creator/withdrawals" element={<Withdrawals />} />
            <Route path="/brand/transactions" element={<BrandTransactions />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/AdminLogin" element={<AdminLogin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
