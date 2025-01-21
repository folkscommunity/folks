"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { CSPostHogProvider } from "./posthog-provider";
import { WindowContextProvider } from "./window-context";

export function ContextProviders({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();

  return (
    <CSPostHogProvider>
      <QueryClientProvider client={queryClient}>
        <Toaster position="bottom-right" theme="system" />

        <WindowContextProvider>{children}</WindowContextProvider>
      </QueryClientProvider>
    </CSPostHogProvider>
  );
}
