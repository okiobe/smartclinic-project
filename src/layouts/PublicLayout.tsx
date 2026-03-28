import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#0f172a]">
      <Outlet />
    </div>
  );
}
