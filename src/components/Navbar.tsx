import { Link, useLocation } from "react-router-dom";
import { User } from "lucide-react";

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
  const items = role ? navItems[role] : navItems.none;

  return (
    <nav className="w-full bg-white border-b shadow-sm px-4 py-3 flex items-center justify-between">
      <Link to="#" className="flex items-center text-xl font-bold text-black">
        <img src="/play-symbol.svg" alt="Clipper Icon" className="h-6 w-6 mr-2" />
        Mipoe
      </Link>
      <div className="flex gap-6">
        {items.map(item => (
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
        ))}
        {/* Creator specific profile icon */}
        {role === "creator" && (
          <Link to="/creator/profile" className="text-gray-700 hover:text-blue-600 transition">
            <User className="w-5 h-5" />
          </Link>
        )}
      </div>
    </nav>
  );
};
