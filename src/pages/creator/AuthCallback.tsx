import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Immediately forward to /login so the user experiences the unified video & loader animation
    const searchParams = new URLSearchParams(location.search);
    if (!searchParams.has("oauth_callback")) {
      searchParams.set("oauth_callback", "true");
    }
    const newSearch = searchParams.toString();
    navigate(`/login?${newSearch}${location.hash}`, { replace: true });
  }, [navigate, location]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-white">
      <div className="w-8 h-8 border-2 border-[#FF5C00] border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default AuthCallback;