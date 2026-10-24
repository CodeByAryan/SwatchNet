import React, { useState } from "react";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { HeroSection } from "./components/home/HeroSection";
import { HowItWorksSection } from "./components/home/HowItWorksSection";
import { OurImpactSection } from "./components/home/OurImpactSection";
import { CommunityCtaSection } from "./components/home/CommunityCtaSection";
import { PlaceholderModal, ModalType } from "./components/ui/PlaceholderModal";

export default function App(): React.JSX.Element {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: ModalType;
    title?: string;
    description?: string;
  }>({
    isOpen: false,
    type: null,
  });

  const handleOpenReport = () => {
    setModalState({
      isOpen: true,
      type: "report",
      title: "Garbage Reporting Feature",
      description:
        "The submission interface with camera integration, GPS geolocation tagging, and automated classification is scheduled for the next development step. The foundational architecture and UI are ready.",
    });
  };

  const handleOpenSignIn = () => {
    setModalState({
      isOpen: true,
      type: "signin",
      title: "Civic Portal Sign In",
      description:
        "Resident profiles, cleaner dashboards, and municipal coordinator authentication will be connected as part of the user management module.",
    });
  };

  const handleOpenInfo = () => {
    setModalState({
      isOpen: true,
      type: "info",
      title: "Community Guidelines & Transparency",
      description:
        "SwatchNet adheres to open civic principles and double photo verification standards for all cleanups across participating districts.",
    });
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleScrollToHowItWorks = () => {
    const elem = document.querySelector("#how-it-works");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 selection:bg-emerald-800 selection:text-white">
      {/* 1. Header & Navigation */}
      <Navbar
        onReportClick={handleOpenReport}
        onSignInClick={handleOpenSignIn}
      />

      {/* Main Content Area */}
      <main className="flex-grow">
        {/* 2. Hero Section */}
        <HeroSection
          onReportClick={handleOpenReport}
          onHowItWorksClick={handleScrollToHowItWorks}
        />

        {/* 3. How It Works (4 stages) */}
        <HowItWorksSection onReportClick={handleOpenReport} />

        {/* 4. Our Impact (Goals, metrics placeholders, zero fake stats) */}
        <OurImpactSection />

        {/* 5. Community CTA */}
        <CommunityCtaSection
          onReportClick={handleOpenReport}
          onSignInClick={handleOpenSignIn}
        />
      </main>

      {/* 6. Footer */}
      <Footer
        onReportClick={handleOpenReport}
        onSignInClick={handleOpenSignIn}
        onOpenInfo={handleOpenInfo}
      />

      {/* Interactive Modal for in-progress CTAs */}
      <PlaceholderModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        title={modalState.title}
        description={modalState.description}
        onClose={handleCloseModal}
      />
    </div>
  );
}
