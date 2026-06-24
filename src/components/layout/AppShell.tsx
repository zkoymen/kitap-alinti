import { BookOpen, LibraryBig, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/books", label: "Library", icon: LibraryBig },
  { to: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b bg-[#FFF8F5]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 md:px-8">
          <NavLink to="/books" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-base font-semibold leading-none">Reading Notes</p>
              <p className="mt-1 hidden text-xs uppercase tracking-[0.18em] text-muted-foreground sm:block">
                Private Library Notebook
              </p>
            </div>
          </NavLink>

          <nav className="hidden items-center gap-2 md:flex" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                      isActive && "bg-accent text-primary"
                    )
                  }
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-5xl px-5 py-8 md:px-8 md:py-10">
        <div
          className="pointer-events-none absolute inset-x-5 top-4 -z-10 h-64 rounded-[2rem] bg-white/30 opacity-70 [background-image:linear-gradient(rgba(212,83,126,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(212,83,126,0.08)_1px,transparent_1px)] [background-size:32px_32px] md:inset-x-8"
          aria-hidden="true"
        />
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t bg-[#FFF8F5]/95 backdrop-blur-xl md:hidden"
        aria-label="Mobile navigation"
      >
        <div className="mx-auto flex h-16 max-w-md items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex min-w-24 flex-col items-center justify-center gap-1 text-xs font-semibold text-muted-foreground",
                    isActive && "text-primary"
                  )
                }
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
