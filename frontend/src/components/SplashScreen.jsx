import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SplashScreen = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onFinish();
      }, 600);
    }, 2200);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            background: 'linear-gradient(160deg, #0d001a 0%, #1e0040 30%, #2e005e 55%, #1a0030 100%)',
          }}
        >
         


          {/* ── Bottom-left deep purple accent ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            style={{
              position: 'absolute',
              bottom: '-60px',
              left: '-60px',
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(90,0,180,0.4) 0%, transparent 65%)',
              filter: 'blur(40px)',
            }}
          />

          {/* ── Subtle grid overlay for depth ── */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 40%, transparent 100%)',
            }}
          />

          {/* ── Logo: flies in from bottom-left ── */}
          <motion.div
            initial={{ x: '-110vw', y: '110vh', scale: 0.08, opacity: 0 }}
            animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 1.05, type: 'spring', stiffness: 90, damping: 16 }}
            style={{ position: 'relative', zIndex: 10 }}
          >
         

            {/* Logo image */}
            <div style={{ width: '100px', height: '100px', position: 'relative' }}>
              <img
                src="/sk.png"
                alt="SK Digital World"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </motion.div>

        



          {/* ── Loading bar at bottom ── */}
          <motion.div
            style={{
              position: 'absolute',
              bottom: '40px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '140px',
              height: '2px',
              borderRadius: '9999px',
              background: 'rgba(255,255,255,0.1)',
              overflow: 'hidden',
              zIndex: 10,
            }}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              transition={{ delay: 0.6, duration: 1.5, ease: 'easeInOut' }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #9B30FF, #E0208A, #FFCC00)',
                borderRadius: '9999px',
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;