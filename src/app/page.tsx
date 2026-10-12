import { Footer } from "@/components/marketing/Footer";
import { Hero } from "@/components/marketing/Hero";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Pricing } from "@/components/marketing/Pricing";
import { CtaBand, Faq, Features, HowItWorks } from "@/components/marketing/Sections";

/**
 * The public landing page.
 *
 * <p>It does not redirect a signed-in visitor into the app. Someone who
 * navigates to the home page may well want the pricing or the FAQ, and being
 * bounced somewhere else for having a session is the kind of helpfulness that
 * is only ever annoying. The header offers "Open app" instead.
 */
export default function LandingPage() {
  return (
    <>
      <MarketingNav />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Features />
        <Pricing />
        <Faq />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
