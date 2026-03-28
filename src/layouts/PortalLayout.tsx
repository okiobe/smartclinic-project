import { Outlet } from "react-router-dom";
import Sidebar from "../components/nav/Sidebar";
import Topbar from "../components/nav/Topbar";

export default function PortalLayout() {
  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#0f172a]">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-h-screen">
          <Topbar />
          <main className="px-6 py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
