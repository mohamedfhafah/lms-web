"use client";

import React from "react";
import { TRPCProvider } from "../lib/trpc/provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <TRPCProvider>{children}</TRPCProvider>;
}
