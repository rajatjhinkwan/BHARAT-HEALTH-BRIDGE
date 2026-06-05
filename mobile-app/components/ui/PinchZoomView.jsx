import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Enhanced cross-platform Pinch-to-zoom and Pan-to-move container.
 */
export default function PinchZoomView({
  children,
  minScale = 1,
  maxScale = 6,
  style,
  externalScale,
  onScaleChange,
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Synchronize when external scale (e.g. from zoom buttons) changes
  useEffect(() => {
    if (externalScale !== undefined && externalScale !== null) {
      scale.value = withTiming(externalScale, { duration: 200 });
      savedScale.value = externalScale;
      if (externalScale === 1) {
        translateX.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(0, { duration: 200 });
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    }
  }, [externalScale]);

  const updateParentScale = (val) => {
    if (onScaleChange) {
      onScaleChange(val);
    }
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const nextScale = savedScale.value * e.scale;
      const targetScale = Math.min(maxScale, Math.max(minScale, nextScale));
      scale.value = targetScale;
      runOnJS(updateParentScale)(targetScale);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < minScale) {
        scale.value = withSpring(minScale);
        savedScale.value = minScale;
        runOnJS(updateParentScale)(minScale);
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      if (scale.value > 1) {
        // Constrain the panning boundaries so the image doesn't fly off screen
        const maxTx = (SCREEN_WIDTH * (scale.value - 1)) / 2;
        const maxTy = (SCREEN_HEIGHT * (scale.value - 1)) / 2;

        if (translateX.value > maxTx) {
          translateX.value = withSpring(maxTx);
        } else if (translateX.value < -maxTx) {
          translateX.value = withSpring(-maxTx);
        }

        if (translateY.value > maxTy) {
          translateY.value = withSpring(maxTy);
        } else if (translateY.value < -maxTy) {
          translateY.value = withSpring(-maxTy);
        }

        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      if (scale.value > 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        runOnJS(updateParentScale)(1);
      } else {
        scale.value = withTiming(3);
        savedScale.value = 3;
        runOnJS(updateParentScale)(3);
      }
    });

  const composedGesture = Gesture.Race(
    doubleTapGesture,
    Gesture.Simultaneous(pinchGesture, panGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, style, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
