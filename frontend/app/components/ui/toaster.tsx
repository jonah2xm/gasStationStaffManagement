"use client";

import * as React from "react";
import { Toaster as HotToaster } from "react-hot-toast";

type ToasterProps = React.ComponentProps<typeof HotToaster>;

// react-hot-toast styled with the NSC tokens; each page still picks its position.
function Toaster({ toastOptions, ...props }: ToasterProps) {
  return (
    <HotToaster
      {...props}
      toastOptions={{
        duration: 4000,
        style: {
          background: "#FFFFFF",
          color: "#10151C",
          border: "1px solid #E2E6EC",
          borderRadius: "10px",
          boxShadow: "0 8px 24px rgba(16, 21, 28, 0.10)",
          padding: "10px 14px",
          fontSize: "13.5px",
          fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
        },
        success: { iconTheme: { primary: "#0F7B55", secondary: "#FFFFFF" } },
        error: { iconTheme: { primary: "#DC2626", secondary: "#FFFFFF" } },
        ...toastOptions,
      }}
    />
  );
}

export { Toaster };
