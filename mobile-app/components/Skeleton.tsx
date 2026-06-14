import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  baseColor?: string;
  highlightColor?: string;
  style?: StyleProp<ViewStyle>;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4,
  baseColor = '#F3F4F6',
  highlightColor = 'rgba(255, 255, 255, 0.7)',
  style 
}) => {
  const [layoutWidth, setLayoutWidth] = React.useState<number>(0);
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startShimmer = () => {
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    };

    startShimmer();
  }, [shimmerAnim]);

  // Ensure absolute numeric values for native driver
  const animWidth = layoutWidth || (typeof width === 'number' ? width : 400);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-animWidth, animWidth],
  });

  return (
    <View 
      onLayout={(e) => setLayoutWidth(e.nativeEvent.layout.width)}
      style={[
        styles.container, 
        { width: width as any, height: height as any, borderRadius, backgroundColor: baseColor }, 
        style
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', highlightColor, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E5E7EB', // Gray-200
    overflow: 'hidden',
  },
});

export default Skeleton;
