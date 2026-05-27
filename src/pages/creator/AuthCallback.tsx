import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { syncGoogleUser, setAuthTokens, clearAuthTokens } from "@/lib/api"; // <--- 1. Import setAuthTokens and clearAuthTokens
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
      
      if (sessionError) console.error("AuthCallback: Supabase session error:", sessionError);

      if (!initialSession) {
        // If no session, wait a moment or redirect (handling strict mode double-invocations)
        return;
      }

      try {
        // 3. Update user metadata with the role (Supabase side)
        console.log("AuthCallback: Updating user metadata with role:", roleFromQuery);
        const { error: updateError } = await supabase.auth.updateUser({
          data: { role: roleFromQuery },
        });
        if (updateError) throw updateError;

        // 4. CRITICAL: Refresh the session to get a new JWT with the updated metadata
        console.log("AuthCallback: Refreshing session...");
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) throw refreshError;
        if (!refreshedSession) throw new Error("Failed to refresh session.");

        const user = refreshedSession.user;
        
        // --- NEW COOKIE SWAP LOGIC STARTS HERE ---

        // 5. Call backend to Sync AND Swap Tokens
        // This sends the Supabase token -> FastAPI verifies it -> FastAPI returns metadata and sets HttpOnly Cookie
        console.log("AuthCallback: Calling backend to sync & swap tokens...");
        const response = await syncGoogleUser(refreshedSession.access_token);
        console.log("AuthCallback: Backend response received (Token Swap successful).");

        // 6. Save the user metadata (role and user_id)
        console.log("AuthCallback: Saving user session metadata...");
        setAuthTokens(
          response.user_id,
          response.role
        );

        toast.success("Successfully signed in with Google!");
        
        // 7. Redirect based on the role returned from the BACKEND
        // We trust the backend's response for the final role.
        if (response.role === "brand") {
          navigate("/brand/dashboard");
        } else if (response.profile_completed) {
            navigate("/creator/dashboard");
        } else {
          navigate("/creator/complete-profile");
        }

        // --- NEW COOKIE SWAP LOGIC ENDS HERE ---
      } catch (error: any) {
        console.error("Auth Callback Error:", error);
        toast.error(error.message || "An error occurred during sign-in.");
        
        clearAuthTokens();
        
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