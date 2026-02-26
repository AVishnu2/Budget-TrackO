import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMenu, HiX } from 'react-icons/hi';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const menuItems = [
    { label: 'Features', href: '#features' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-transparent'}`}>
      <div className="max-w-[1440px] mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <span className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                TrackO
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-10">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`transition-all duration-300 font-medium text-base ${scrolled ? 'text-gray-900' : 'text-white'} hover:text-primary`}
              >
                {item.label}
              </a>
            ))}
            <Link
              to="/login"
              className={`px-8 py-3 rounded-2xl transition-all duration-300 font-semibold ${scrolled ? 'bg-primary text-white' : 'bg-primary/10 text-white'} hover:bg-primary hover:text-white`}
            >
              Sign In
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 transition-colors duration-300 ${scrolled ? 'text-gray-900' : 'text-white'} hover:text-primary`}
            >
              {isOpen ? (
                <HiX className="h-7 w-7" />
              ) : (
                <HiMenu className="h-7 w-7" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`md:hidden ${scrolled ? 'bg-white shadow-md' : 'bg-transparent'}`}
          >
            <div className="px-6 py-8 space-y-6">
              {menuItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`block transition-all duration-300 py-2 font-medium text-lg ${scrolled ? 'text-gray-900' : 'text-white'} hover:text-primary`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <Link
                to="/login"
                className={`block w-full text-center px-8 py-3 rounded-2xl transition-all duration-300 font-semibold ${scrolled ? 'bg-primary text-white' : 'bg-primary/10 text-white'} hover:bg-primary hover:text-white`}
                onClick={() => setIsOpen(false)}
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navigation;