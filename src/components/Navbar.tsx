import { Link, useLocation, useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { logout as logoutApi } from "@/lib/api";

type NavbarProps = {
  role?: "brand" | "creator";
};

const navItems = {
  brand: [
    { name: "Dashboard", to: "/brand/dashboard" },
    { name: "Create Campaign", to: "/brand/create" },
    { name: "Logout", to: "/" }
  ],
  creator: [
    { name: "Dashboard", to: "/creator/dashboard" },
    { name: "Logout", to: "/" }
  ],
  none: [
    { name: "Login", to: "/login" },
    { name: "Register", to: "/register" }
  ]
};

export const Navbar = ({ role }: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const items = role ? navItems[role] : navItems.none;

  const handleLogout = async () => {
    await logoutApi();
    navigate("/");
  };

  return (
    <nav className="w-full bg-white border-b shadow-sm px-4 py-3 flex items-center justify-between">
      <Link to="#" className="flex items-center text-xl font-bold text-black">
        <img src="/play-symbol.svg" alt="Clipper Icon" className="h-6 w-6 mr-2" />
        Mipoe
      </Link>
      <div className="flex items-center gap-6">
        {items.map(item => {
          if (item.name === 'Logout') {
            return (
              <button
                key={item.name}
                onClick={handleLogout}
                className="text-gray-700 hover:text-blue-600 transition"
              >
                {item.name}
              </button>
            )
          }
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`${
                location.pathname === item.to
                  ? "text-blue-700 font-semibold"
                  : "text-gray-700"
              } hover:text-blue-600 transition`}
            >
              {item.name}
            </Link>
          )
        })}
        {/* Creator specific profile icon */}
        {role === "creator" && (
          <Link to="/creator/profile" className="text-gray-700 hover:text-blue-600 transition ml-2">
            <User className="w-5 h-5" />
          </Link>
        )}
      </div>
    </nav>
  );
};
