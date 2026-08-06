"use client"

import { MenuKey } from "@/types";
import axios from "axios";
import {
  ChevronLeft,
  LayoutDashboard,
  Menu,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const Sidebar = () => {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeMenu, setActiveMenu] = useState<MenuKey>("dashboard");

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
      router.push("/");
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  const menuItems: { key: MenuKey; label: string; icon: any; link: string }[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, link: "/admin" },
    { key: "karyawan", label: "Karyawan", icon: Users, link: "/admin/karyawan" },
  ];
  return (
    <aside
      className={`flex flex-col bg-primary text-white transition-all duration-300 ${sidebarOpen ? "w-64" : "w-16"}`}
    >
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <div className="bg-white p-2 rounded-lg shrink-0">
          <div className="w-8 h-8 font-bold text-center leading-8 rounded text-primary border-2 border-accent">
            BP
          </div>
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <h2 className="font-bold text-lg leading-tight truncate">
              Admin Panel
            </h2>
            <p className="text-xs opacity-80 text-accent truncate">
              CV. Bisnis Pro Komputama
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                setActiveMenu(item.key);
                router.push(item.link);
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? "bg-white text-primary"
                  : "text-white/90 hover:bg-white/10"
              }`}
              title={item.label}
            >
              <Icon size={20} className="shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        <button
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-white/90 hover:bg-white/10 transition-colors text-sm"
        >
          <Menu size={20} className="shrink-0" />
          {sidebarOpen && <span>Ciutkan</span>}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-white/90 hover:bg-white/10 transition-colors text-sm"
        >
          <ChevronLeft size={20} className="shrink-0" />
          {sidebarOpen && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
};
