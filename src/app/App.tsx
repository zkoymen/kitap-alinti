import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/AppShell";

export function App() {
  return (
    <>
      <AppShell>
        <Outlet />
      </AppShell>
      <Toaster richColors closeButton position="top-center" />
    </>
  );
}
