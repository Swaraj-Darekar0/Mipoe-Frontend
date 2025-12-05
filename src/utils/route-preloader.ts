// This utility function is designed to be called after a user successfully logs in.
// It triggers the browser to start downloading the code for the main authenticated routes
// in the background. By the time the user clicks a link to navigate, the code for
// that page will likely already be downloaded, making the application feel faster.

export const preloadPostLoginRoutes = () => {
  // We don't need to do anything with the imported modules; the act of importing
  // is what triggers the browser to fetch the code-split chunks.
  
  // Preload main dashboard components
  import("../pages/brand/Dashboard");
  import("../pages/creator/Dashboard");

  // Preload components for brands
  import("../pages/brand/CreateCampaign");
  import("../pages/brand/CampaignAnalytics");
  import("../pages/brand/Transactions");

  // Preload components for creators
  import("../pages/creator/CampaignView");
  import("../pages/creator/SubmitClip");
  import("../pages/creator/Profile");
  import("../pages/creator/CompleteProfile");
  import("../pages/creator/Wallet");
  import("../pages/creator/Withdrawals");
  
  // Preload admin components if needed, could be a separate function
  import("../pages/admin/Admin");
};
