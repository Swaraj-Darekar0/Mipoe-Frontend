import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { syncGoogleUser, setAuthTokens } from "@/lib/api"; // <--- 1. Import setAuthTokens
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
        
        // --- NEW TOKEN SWAP LOGIC STARTS HERE ---

        // 5. Temporarily save Supabase Token
        // We do this so 'syncGoogleUser' (which uses apiFetch) has a token to send to the backend.
        console.log("AuthCallback: Setting temporary Supabase tokens...");
        setAuthTokens(
          refreshedSession.access_token,
          refreshedSession.refresh_token,
          user.id
        );

        // 6. Call backend to Sync AND Swap Tokens
        // This sends the Supabase token -> Flask verifies it -> Flask returns NEW Flask tokens
        console.log("AuthCallback: Calling backend to sync & swap tokens...");
        const response = await syncGoogleUser();
        console.log("AuthCallback: Backend response received (Token Swap successful).");

        // 7. OVERWRITE with the new Flask Tokens
        // This is the critical step. We discard the Supabase token and save the Flask token.
        // Future API calls will now be authenticated against your Flask backend.
        console.log("AuthCallback: Overwriting with Flask tokens...");
        setAuthTokens(
          response.access_token,
          response.refresh_token,
          response.user_id
        );

        toast.success("Successfully signed in with Google!");
        
        // 8. Redirect based on the role returned from the BACKEND
        // We trust the backend's response for the final role.
        if (response.role === "brand") {
          navigate("/brand/dashboard");
        } else if (response.profile_completed) {
            navigate("/creator/dashboard");
        } else {
          navigate("/creator/complete-profile");
        }

        
        // --- NEW TOKEN SWAP LOGIC ENDS HERE ---
      } catch (error: any) {
        console.error("Auth Callback Error:", error);
        toast.error(error.message || "An error occurred during sign-in.");
        
        // Clear tokens using the helper function or manually if needed
        sessionStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        sessionStorage.removeItem("user_id");
        
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