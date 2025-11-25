import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreatorDashboard from "./pages/creator/Dashboard";
import SubmitClip from "./pages/creator/SubmitClip";
import BrandDashboard from "./pages/brand/Dashboard";
import CreateCampaign from "./pages/brand/CreateCampaign";
import CampaignAnalytics from "./pages/brand/CampaignAnalytics";
import CampaignView from "./pages/creator/CampaignView";
import CreatorProfile from "./pages/creator/Profile";
import CompleteProfile from "./pages/creator/CompleteProfile";
import AdminPage from "./pages/admin/Admin";
import AdminLogin from "./pages/AdminLogin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/AdminLogin" element={<AdminLogin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
