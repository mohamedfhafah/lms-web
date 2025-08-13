"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { trpc } from "@/lib/trpc/client";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md text-sm font-medium ${
        active ? "bg-gray-900 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

export default function NavBar() {
  const { data } = trpc.adherent.me.useQuery(undefined, { retry: false });
  const isLibrarian = data?.role === "LIBRARIAN";

  return (
    <nav className="bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-white font-semibold">
              LMS
            </Link>
            <div className="hidden md:flex items-center gap-1 ml-4">
              <NavLink href="/" label="Home" />
              <NavLink href="/catalogue" label="Catalogue" />
              <SignedIn>
                <NavLink href="/loans" label="Loans" />
                <NavLink href="/reservations" label="Reservations" />
                {isLibrarian && <NavLink href="/admin" label="Admin" />}
              </SignedIn>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/me"
                className="hidden md:inline text-gray-300 hover:text-white text-sm px-2"
              >
                Me
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  );
}
