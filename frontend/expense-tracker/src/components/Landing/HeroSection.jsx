import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import backgroundVideo from '../../assets/3757-174173857_large.mp4';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={backgroundVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-8 relative z-10">
        <div className="relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.8,
              type: "spring",
              stiffness: 100 
            }}
            className="max-w-3xl mx-auto"
          >
            <motion.h1 
              className="text-5xl md:text-7xl font-bold text-primary mb-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 1,
                delay: 0.2,
                ease: [0.25, 0.1, 0.25, 1]
              }}
            >
              Track Your Finances<br />with Ease
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-600/90 mb-12"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Simple, intuitive expense tracking to help you achieve your financial goals
            </motion.p>
            <motion.div 
              className="flex items-center justify-center gap-6 flex-col sm:flex-row"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Link
                to="/signup"
                className="bg-primary text-white px-10 py-4 rounded-xl hover:bg-primary/90 transition-all duration-300 font-medium text-lg"
              >
                Get Started - It's Free
              </Link>
              <a
                href="#features"
                className="text-gray-700 px-10 py-4 rounded-xl hover:text-primary transition-all duration-300 font-medium text-lg"
              >
                Learn More
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;