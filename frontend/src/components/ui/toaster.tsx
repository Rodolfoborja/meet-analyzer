"use client";

import * as React from "react";
import * as Toast from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

// Simple toast implementation
export function Toaster() {
  return (
    <Toast.Provider>
      <Toast.Viewport className="fixed bottom-0 right-0 flex flex-col p-6 gap-2 w-96 max-w-full m-0 list-none z-50" />
    </Toast.Provider>
  );
}

// Export a simple toast hook placeholder
export const toast = {
  success: (message: string) => console.log("Toast success:", message),
  error: (message: string) => console.error("Toast error:", message),
  info: (message: string) => console.info("Toast info:", message),
};
