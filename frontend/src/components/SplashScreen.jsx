import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SplashScreen = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [bgVisible, setBgVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        setBgVisible(false);
        setTimeout(() => {
          onFinish();
        }, 400);
      }, 400);
    }, 2200);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <>
      {/* ── Background underlay — prevents white flash ── */}
      <AnimatePresence>
        {bgVisible && (
          <motion.div
            key="splash-bg"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 48,
              background: 'linear-gradient(160deg, #0d001a 0%, #1e0040 30%, #2e005e 55%, #1a0030 100%)',
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Main splash overlay ── */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            key="splash-main"
            initial={{ opacity: 1, scale: 1 }}
            exit={{
              scale: 2.8,
              opacity: 0,
              transition: { duration: 0.65, ease: [0.55, 0, 1, 0.45] },
            }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              transformOrigin: 'center center',
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
                background: 'radial-gradient(circle, rgba(90,0,180,0.4) 0%, transparent 65%)',
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

            {/* ── Logo: Blinkit-style scale punch-in ── */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.18, 0.92, 1], opacity: 1 }}
              transition={{
                scale:   { duration: 0.6, times: [0, 0.55, 0.8, 1], ease: 'easeOut' },
                opacity: { duration: 0.2 },
              }}
              style={{ position: 'relative', zIndex: 10 }}
            >
              <div style={{ width: '100px', height: '100px', position: 'relative' }}>
                <img
                  src="/sk.png"
                  alt="SK Digital World"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
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

            {/* ── Copyright text ── */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                margin: 0,
                whiteSpace: 'nowrap',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.28)',
                letterSpacing: '0.5px',
              }}
            >
              Sri Krishna Digital World © {new Date().getFullYear()}
            </motion.p>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SplashScreen;