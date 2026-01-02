import React from 'react';

interface RoleSwitcherProps {
  role: 'brand' | 'creator';
  setRole: (role: 'brand' | 'creator') => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ role, setRole }) => {
  return (
    <div className="bg-[#2A2A2A] p-1 rounded-full flex mb-8">
      <button
        onClick={() => setRole("brand")}
        className={`w-1/2 py-2.5 rounded-full text-sm font-semibold transition-colors ${
          role === "brand" ? "bg-[#FF5C00] text-white" : "text-[#989898]"
        }`}
      >
        Sign up as Brand
      </button>
      <button
        onClick={() => setRole("creator")}
        className={`w-1/2 py-2.5 rounded-full text-sm font-semibold transition-colors ${
          role === "creator" ? "bg-[#FF5C00] text-white" : "text-[#989898]"
        }`}
      >
        Sign up as Creator
      </button>
    </div>
  );
};
