import React from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';

const UnifyFinances = () => {
  const { scrollYProgress } = useScroll({
    offset: ["start end", "end start"]
  });
  
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 50,
    damping: 20,
    restDelta: 0.001
  });

  const floatAnimation = {
    initial: { y: 0 },
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const pulseAnimation = {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      {/* Background Animation */}
      <motion.div 
        className="absolute inset-0 opacity-10"
        initial={{ backgroundPosition: "0% 0%" }}
        animate={{ backgroundPosition: "100% 100%" }}
        transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
        style={{
          backgroundImage: "radial-gradient(circle at center, #ff3b2f 1px, transparent 1px)",
          backgroundSize: "50px 50px"
        }}
      />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: false, margin: "-100px" }}
            className="space-y-8"
          >
            <motion.h2 
              className="text-7xl md:text-8xl font-bold leading-tight"
            >
              <motion.span 
                className="inline-block bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent"
                {...pulseAnimation}
              >
                Unify your
              </motion.span>
              <br />
              <motion.span 
                className="inline-block bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                expenses
              </motion.span>
            </motion.h2>
          </motion.div>

          {/* Cards Animation Container */}
          <div className="relative h-[500px] flex items-center justify-center perspective-1000">
            <AnimatePresence>
              {/* Monthly Budget Card */}
              <motion.div
                key="budget-card"
                {...floatAnimation}
                initial={{ opacity: 0, rotateY: 90 }}
                whileInView={{ 
                  opacity: 1,
                  rotateY: 0,
                  transition: {
                    duration: 1,
                    ease: "easeOut"
                  }
                }}
                whileHover={{
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
                viewport={{ once: false, margin: "-100px" }}
                className="absolute w-64 h-40 bg-gradient-to-br from-green-400 to-green-600 rounded-xl p-4 text-white shadow-2xl backdrop-blur-sm transform-gpu hover:shadow-green-400/30"
              >
                <div className="flex flex-col h-full relative overflow-hidden">
                  {/* Animated background pattern */}
                  <motion.div
                    className="absolute inset-0 opacity-10"
                    animate={{
                      backgroundPosition: ["0% 0%", "100% 100%"]
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    style={{
                      backgroundImage: "linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff)",
                      backgroundSize: "20px 20px"
                    }}
                  />
                  <span className="text-sm font-medium relative z-10">Monthly Budget</span>
                  <motion.span 
                    className="text-2xl font-bold mt-1 relative z-10"
                    animate={{
                      scale: [1, 1.02, 1],
                      transition: { duration: 2, repeat: Infinity }
                    }}
                  >
                    ₹1,500.00
                  </motion.span>
                  <span className="text-lg mt-2 opacity-90 relative z-10">Spent: ₹847.25</span>
                  <motion.span 
                    className="text-sm mt-auto bg-white/20 px-3 py-1 rounded-full w-fit relative z-10"
                    animate={{
                      boxShadow: [
                        "0 0 0 0 rgba(255,255,255,0.4)",
                        "0 0 0 10px rgba(255,255,255,0)",
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity
                    }}
                  >
                    On Track
                  </motion.span>
                </div>
              </motion.div>

              {/* Balance Card */}
              <motion.div
                key="balance-card"
                initial={{ opacity: 0, y: 100, rotateX: -30 }}
                whileInView={{ 
                  opacity: 1, 
                  y: 20,
                  rotateX: 0,
                  transition: {
                    duration: 0.8,
                    delay: 0.2,
                    ease: "easeOut"
                  }
                }}
                viewport={{ once: false, margin: "-100px" }}
                className="absolute w-64 h-40 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl p-4 text-white shadow-2xl backdrop-blur-sm transform-gpu translate-x-20"
              >
                <div className="flex flex-col h-full">
                  <span className="text-sm font-medium">Current Balance</span>
                  <span className="text-2xl font-bold mt-1">₹2,450.75</span>
                  <span className="text-sm opacity-90">Savings Goal: ₹5,000</span>
                  <div className="mt-auto h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: "0%" }}
                      whileInView={{ width: "50%" }}
                      transition={{ duration: 1, delay: 0.5 }}
                      viewport={{ once: false, margin: "-100px" }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Category Card */}
              <motion.div
                key="category-card"
                initial={{ opacity: 0, y: -100, rotateX: 30 }}
                whileInView={{ 
                  opacity: 1, 
                  y: -20,
                  rotateX: 0,
                  transition: {
                    duration: 0.8,
                    delay: 0.4,
                    ease: "easeOut"
                  }
                }}
                viewport={{ once: false, margin: "-100px" }}
                className="absolute w-64 h-40 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl p-4 text-white shadow-2xl backdrop-blur-sm transform-gpu -translate-x-20"
              >
                <div className="flex flex-col h-full">
                  <span className="text-lg font-medium">Top Categories</span>
                  <div className="space-y-3 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="opacity-90">Groceries</span>
                      <span className="font-medium">₹320.45</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="opacity-90">Transport</span>
                      <span className="font-medium">₹145.80</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UnifyFinances;