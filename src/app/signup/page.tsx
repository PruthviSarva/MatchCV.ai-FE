import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { FullPageLoader } from "@/components/ui/Feedback";

export const metadata: Metadata = { title: "Create your account" };

export default function SignupPage() {
  return (
    <Suspense fallback={<FullPageLoader label="Loading" />}>
      <AuthScreen mode="signup" />
    </Suspense>
  );
}
