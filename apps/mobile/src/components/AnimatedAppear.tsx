import React, { useEffect, useRef } from "react";
import { Animated, type ViewStyle } from "react-native";

/**
 * 마운트 시 등장 애니메이션 (페이드 + 슬라이드 + 살짝 스케일).
 * 카드 딜인, 베팅칩 팝 등에 사용. useNativeDriver=false 로 웹/네이티브 모두 안전.
 */
export function AnimatedAppear({
  children,
  style,
  translateX = 0,
  translateY = 10,
  rotateFrom = "0deg",
  delay = 0,
  duration = 360,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  translateX?: number;
  translateY?: number;
  rotateFrom?: string;
  delay?: number;
  duration?: number;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration, delay, useNativeDriver: false }).start();
  }, [v, duration, delay]);

  return (
    <Animated.View
      style={[
        style as ViewStyle,
        {
          opacity: v,
          transform: [
            { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [translateX, 0] }) },
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [translateY, 0] }) },
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
            { rotate: v.interpolate({ inputRange: [0, 1], outputRange: [rotateFrom, "0deg"] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
