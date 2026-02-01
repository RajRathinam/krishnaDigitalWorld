import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SplashScreen = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Display for 1.5 seconds then fade out
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onFinish();
      }, 500); // Wait for fade-out animation
    }, 1500);

    return () => {
      clearTimeout(timer);
    };
  }, [onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900 overflow-hidden"
        >
          {/* Animated logo from bottom-left to center */}
          <motion.div
            initial={{
              x: '-100vw', // Start from far left (off-screen left)
              y: '100vh',  // Start from far bottom (off-screen bottom)
              scale: 0.1,
              opacity: 0
            }}
            animate={{
              x: 0,
              y: 0,
              scale: 1,
              opacity: 1
            }}
            transition={{
              duration: 1,
              type: "spring",
              stiffness: 100,
              damping: 15
            }}
            className="relative"
          >
            <div className="relative w-24 h-24 md:w-32 md:h-32">
              <img
                src="/sk.png"
                alt="Sri Krishna Digital World"
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error('Logo not found at /sk.png');
                  e.target.style.display = 'none';
                }}
              />
              
              {/* Subtle glow effect */}
              <motion.div
                className="absolute inset-0 bg-blue-100 dark:bg-blue-900 rounded-full blur-xl opacity-50"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: 0.5,
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  opacity: { delay: 0.3, duration: 0.5 },
                  scale: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              />
            </div>
          </motion.div>

        
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;