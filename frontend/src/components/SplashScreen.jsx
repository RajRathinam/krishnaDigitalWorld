import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SplashScreen = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animationPhase, setAnimationPhase] = useState('enter');

  useEffect(() => {
    // Arrive at center - 1.5 seconds for a nice smooth entrance
    const enterTimer = setTimeout(() => {
      setAnimationPhase('moveToCorner');
      
      // Move to top-right corner - 1.2 seconds for graceful exit
      const moveTimer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          onFinish();
        }, 400);
      }, 1200);
      
      return () => clearTimeout(moveTimer);
    }, 1500);
    
    return () => clearTimeout(enterTimer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900 overflow-hidden"
        >
          <motion.div
            initial={{
              x: '100vw',
              y: '100vh',
              scale: 0.1,
              opacity: 0,
              rotate: 15
            }}
            animate={{
              x: animationPhase === 'enter' ? 0 : '100vw',
              y: animationPhase === 'enter' ? 0 : '-100vh',
              scale: animationPhase === 'enter' ? 1 : 0.2,
              opacity: animationPhase === 'enter' ? 1 : 0,
              rotate: animationPhase === 'enter' ? 0 : 30
            }}
            transition={{
              x: {
                duration: animationPhase === 'enter' ? 1.5 : 1.2,
                ease: animationPhase === 'enter' ? [0.34, 1.56, 0.64, 1] : "easeIn" // Custom bezier for smoothness
              },
              y: {
                duration: animationPhase === 'enter' ? 1.5 : 1.2,
                ease: animationPhase === 'enter' ? [0.34, 1.56, 0.64, 1] : "easeIn"
              },
              scale: {
                duration: 1.2,
                ease: "easeIn"
              },
              opacity: {
                duration: 0.8
              },
              rotate: {
                duration: 1.2
              }
            }}
            className="relative"
          >
            <div className="relative w-20 h-20 md:w-24 md:h-24">
              <img
                src="/sk.png"
                alt="Sri Krishna Digital World"
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error('Logo not found at /sk.png');
                  e.target.style.display = 'none';
                }}
              />
              
              <motion.div
                className="absolute inset-0 bg-blue-100 dark:bg-blue-900 rounded-full blur-xl"
                animate={{
                  opacity: animationPhase === 'enter' ? 0.5 : 0,
                  scale: animationPhase === 'enter' ? 1 : 0.5
                }}
                transition={{
                  duration: 0.8
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