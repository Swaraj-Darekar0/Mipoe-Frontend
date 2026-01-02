import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { syncGoogleUser } from "@/lib/api"; // Import the new function
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const processAuth = async () => {
      // 1. Get the role from the URL query params
      const queryParams = new URLSearchParams(location.search);
      const roleFromQuery = queryParams.get("role") || "creator";
      console.log("AuthCallback: Role from query params:", roleFromQuery);

      // 2. Process the Supabase Auth Callback
      const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
      console.log("AuthCallback: Initial Supabase session:", initialSession);
      if (sessionError) console.error("AuthCallback: Supabase session error:", sessionError);

      if (!initialSession) {
        toast.error("Authentication failed. Please try again.");
        navigate("/login");
        return;
      }

      try {
        // 3. Update user metadata with the role
        console.log("AuthCallback: Updating user metadata with role:", roleFromQuery);
        const { data: updatedUserData, error: updateError } = await supabase.auth.updateUser({
          data: { role: roleFromQuery },
        });
        if (updateError) throw updateError;
        console.log("AuthCallback: User metadata update successful:", updatedUserData);

        // 4. CRITICAL: Refresh the session to get a new JWT with the updated metadata
        console.log("AuthCallback: Refreshing session to get new token...");
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) throw refreshError;
        if (!refreshedSession) throw new Error("Failed to refresh session after updating user role.");
        console.log("AuthCallback: Session refreshed successfully.");

        const user = refreshedSession.user;
        const role = user.user_metadata.role;
        console.log("AuthCallback: Final role from refreshed token:", role);
        
        if (!role) {
            throw new Error("Role could not be confirmed after login.");
        }

        // 5. Store refreshed session info in LocalStorage
        localStorage.setItem("token", refreshedSession.access_token);
        localStorage.setItem("role", role);
        localStorage.setItem("user_id", user.id);
        console.log("AuthCallback: Stored refreshed token, role, user_id in localStorage.");

        // 6. Sync user with your public tables (brand/creator)
        console.log("AuthCallback: Calling backend to sync Google user...");
        const syncResult = await syncGoogleUser();
        console.log("AuthCallback: Google Sync Result:", syncResult);

        // 7. Redirect based on role
        const redirectTo = role === "brand" ? "/brand/dashboard" : "/creator/dashboard";
        console.log("AuthCallback: Redirecting to:", redirectTo);
        navigate(redirectTo);
        
      } catch (error: any) {
        console.error("Auth Callback Error:", error);
        toast.error(error.message || "An error occurred during sign-in.");
        // Clear broken session data and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user_id");
        navigate("/login");
      }
    };

    processAuth();
  }, [navigate, location]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF5C00]" />
        <p className="text-[#989898]">Finalizing your sign-in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
