"use client";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { LogOut, User, ChevronDown } from "lucide-react";

export default function ProfileDropdown() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!session?.user) return null;

  const { name, email, image } = session.user;
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : email?.[0]?.toUpperCase() || "U";

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
      >
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-9 w-9 rounded-full object-cover border-2 border-zinc-700 hover:border-indigo-500 transition-colors"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white border-2 border-zinc-700 hover:border-indigo-500 transition-colors">
            {initials}
          </div>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User Info Section */}
          <div className="px-4 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              {image ? (
                <img
                  src={image}
                  alt={name}
                  className="h-11 w-11 rounded-full object-cover border-2 border-zinc-700"
                />
              ) : (
                <div className="h-11 w-11 rounded-full bg-indigo-600 flex items-center justify-center text-base font-bold text-white border-2 border-zinc-700 shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-100 truncate">
                  {name || "User"}
                </p>
                <p className="text-xs text-zinc-400 truncate">{email}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-zinc-800/80 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
