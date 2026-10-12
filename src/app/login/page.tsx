import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { FullPageLoader } from "@/components/ui/Feedback";

export const metadata: Metadata = { title: "Log in" };

/**
 * The Suspense boundary is required, not decorative: AuthScreen reads the
 * `next` search parameter, and Next refuses to prerender a client component
 * that does so without one.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<FullPageLoader label="Loading" />}>
      <AuthScreen mode="login" />
    </Suspense>
  );
}
