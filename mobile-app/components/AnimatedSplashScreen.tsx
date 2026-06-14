import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface AnimatedSplashScreenProps {
  onFinish: () => void;
}

export default function AnimatedSplashScreen({ onFinish }: AnimatedSplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Animation values
  const bgOpacity = useRef(new Animated.Value(1)).current;
  const mainOpacity = useRef(new Animated.Value(1)).current;
  const mainScale = useRef(new Animated.Value(1)).current;
  
  const logoScaleProgress = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const loaderTranslateX = useRef(new Animated.Value(-140)).current; // -100% of 140px width

  useEffect(() => {
    // 1. Logo Pop-in Animation (0 to 1 over 600ms)
    Animated.timing(logoScaleProgress, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // 2. Glow Fade In (delay 500ms, duration 1000ms)
    Animated.sequence([
      Animated.delay(500),
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Loader Slide In (delay 600ms, duration 1500ms)
    Animated.sequence([
      Animated.delay(600),
      Animated.timing(loaderTranslateX, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();

    // 4. Copyright Text Fade In (delay 800ms, duration 600ms)
    Animated.sequence([
      Animated.delay(800),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // 5. Overall Exit Sequence after 2.2 seconds
    const timer = setTimeout(() => {
      // Scale up main view to 2.8 and fade out over 650ms
      Animated.parallel([
        Animated.timing(mainScale, {
          toValue: 2.8,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(mainOpacity, {
          toValue: 0,
          duration: 650,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsVisible(false);
        // Then fade out the background underlay
        Animated.timing(bgOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          onFinish();
        });
      });
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  // Interpolate logo scale (0 -> 1.18 -> 0.92 -> 1) simulating Framer Motion easing
  const logoScale = logoScaleProgress.interpolate({
    inputRange: [0, 0.55, 0.8, 1],
    outputRange: [0, 1.18, 0.92, 1],
  });

  return (
    <>
      {/* Background Underlay */}
      <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 48, opacity: bgOpacity }]}>
        <LinearGradient
          colors={['#0d001a', '#1e0040', '#2e005e', '#1a0030']}
          locations={[0, 0.3, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Main Animated Overlay */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            zIndex: 50,
            opacity: mainOpacity,
            transform: [{ scale: mainScale }],
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }
        ]}
      >
        <LinearGradient
          colors={['#0d001a', '#1e0040', '#2e005e', '#1a0030']}
          locations={[0, 0.3, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Bottom-left Deep Purple Glow */}
        <Animated.View 
          style={{
            position: 'absolute',
            bottom: -60,
            left: -60,
            width: 280,
            height: 280,
            borderRadius: 140,
            backgroundColor: 'rgba(90,0,180,0.4)',
            opacity: glowOpacity,
          }}
        />

        {/* Subtle Grid Overlay could be done with a repeating SVG or an Image, simplified for RN using pure CSS glow above */}
        
        {/* Logo */}
        <Animated.View 
          style={{ 
            width: 100, 
            height: 100, 
            opacity: logoScaleProgress,
            transform: [{ scale: logoScale }] 
          }}
        >
          <Image
            source={require('@/assets/images/sk.png')}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        </Animated.View>

        {/* Loader Bar */}
        <View 
          style={{
            position: 'absolute',
            bottom: 40,
            left: width / 2 - 70, // Center perfectly (140px / 2 = 70)
            width: 140,
            height: 2,
            borderRadius: 9999,
            backgroundColor: 'rgba(255,255,255,0.1)',
            overflow: 'hidden',
          }}
        >
          <Animated.View 
            style={{
              width: '100%',
              height: '100%',
              transform: [{ translateX: loaderTranslateX }]
            }}
          >
            <LinearGradient
              colors={['#9B30FF', '#E0208A', '#FFCC00']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        {/* Copyright Text */}
        <Animated.Text
          style={{
            position: 'absolute',
            bottom: 16,
            opacity: textOpacity,
            fontSize: 11,
            fontWeight: '500',
            color: 'rgba(255,255,255,0.28)',
            letterSpacing: 0.5,
          }}
        >
          Sri Krishna Digital World © {new Date().getFullYear()}
        </Animated.Text>
      </Animated.View>
    </>
  );
}
