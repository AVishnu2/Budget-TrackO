import React from 'react';
import Navigation from './Navigation';
import HeroSection from './HeroSection';
import UnifyFinances from './UnifyFinances';
import FeaturesSection from './FeaturesSection';
import Footer from './Footer';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <UnifyFinances />
      <FeaturesSection />
      <Footer />
    </div>
  );
};

export default LandingPage;