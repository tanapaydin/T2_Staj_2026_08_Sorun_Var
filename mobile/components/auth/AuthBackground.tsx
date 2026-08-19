import React, { ReactNode, useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  View,
} from "react-native";
import Svg, { G, Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  children: ReactNode;
};

export default function AuthBackground({
  children,
}: Props) {
  return (
    <View style={styles.background}>
      <AnimatedSketch />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {children}
        </View>
      </SafeAreaView>
    </View>
  );
}

function AnimatedSketch() {
  const drift = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const driftAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 9000,
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 9000,
          useNativeDriver: true,
        }),
      ])
    );
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );

    driftAnimation.start();
    pulseAnimation.start();

    return () => {
      driftAnimation.stop();
      pulseAnimation.stop();
    };
  }, [drift, pulse]);

  const routeShift = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 24],
  });
  const mapShift = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });
  const mapTilt = drift.interpolate({
    inputRange: [0, 1],
    outputRange: ["-0.8deg", "0.8deg"],
  });
  return (
    <View pointerEvents="none" style={styles.sketchLayer}>
      <Animated.View
        style={[
          styles.mapMotion,
          { transform: [{ translateX: mapShift }, { rotate: mapTilt }] },
        ]}
      >
        <Svg style={styles.mapSvg} viewBox="0 0 400 800">
        <Path
          d="M-30 120 C70 180 45 280 120 330 S210 470 140 560 S210 720 430 690"
          fill="none"
          stroke="#B7E4C7"
          strokeWidth="34"
          strokeLinecap="round"
        />
        <Path
          d="M-30 120 C70 180 45 280 120 330 S210 470 140 560 S210 720 430 690"
          fill="none"
          stroke="#E8F5E9"
          strokeWidth="25"
          strokeLinecap="round"
        />

        <G fill="none" stroke="#B9DEC4" strokeWidth="1.5" strokeLinecap="round" opacity="0.62">
          <Path d="M0 175 L400 95" />
          <Path d="M-20 285 L420 205" />
          <Path d="M-20 405 L420 325" />
          <Path d="M-20 535 L420 450" />
          <Path d="M-20 675 L420 590" />
          <Path d="M55 0 L125 800" />
          <Path d="M180 0 L225 800" />
          <Path d="M315 0 L285 800" />
        </G>

        <G stroke="#4F9D69" strokeWidth="2" strokeDasharray="7 8" fill="none">
          <Path d="M44 735 C112 610 105 520 185 435 S285 270 355 90" />
        </G>

        </Svg>
      </Animated.View>

      <Animated.View style={[styles.mapIcon, styles.mapIconTopOne, { transform: [{ translateX: routeShift }] }]}>
        <Ionicons name="volume-high-outline" size={25} color="#2E9B72" />
      </Animated.View>
      <Animated.View style={[styles.mapIcon, styles.mapIconTopTwo, { transform: [{ translateX: routeShift }] }]}>
        <Ionicons name="bulb-outline" size={25} color="#F2B84B" />
      </Animated.View>
      <Animated.View style={[styles.mapIcon, styles.mapIconTopThree, { transform: [{ translateX: routeShift }] }]}>
        <Ionicons name="construct-outline" size={25} color="#E67E4F" />
      </Animated.View>
      <Animated.View style={[styles.mapIcon, styles.mapIconBottomOne, { transform: [{ translateX: routeShift }] }]}>
        <Ionicons name="trash-outline" size={25} color="#7A8790" />
      </Animated.View>
      <Animated.View style={[styles.mapIcon, styles.mapIconBottomTwo, { transform: [{ translateX: routeShift }] }]}>
        <Ionicons name="leaf-outline" size={25} color="#45B96B" />
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#EEF6F8",
  },

  sketchLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },

  mapSvg: {
    backgroundColor: "#EEF6F8",
    height: "100%",
    position: "absolute",
    width: "100%",
  },

  mapMotion: {
    ...StyleSheet.absoluteFillObject,
  },

  routeMarker: {
    backgroundColor: "#4F9D69",
    borderColor: "#FFFFFF",
    borderRadius: 9,
    borderWidth: 2,
    height: 18,
    left: "42%",
    position: "absolute",
    top: "53%",
    width: 18,
  },

  route: {
    borderColor: "#A8D5BA",
    borderLeftWidth: 2,
    borderRadius: 80,
    borderRightWidth: 2,
    height: 390,
    left: "12%",
    position: "absolute",
    top: "8%",
    transform: [{ rotate: "18deg" }],
    width: "70%",
  },

  street: {
    backgroundColor: "#D8F3DC",
    height: 2,
    position: "absolute",
    transform: [{ rotate: "-24deg" }],
    width: "78%",
  },

  streetOne: {
    left: "-8%",
    top: "24%",
  },

  streetTwo: {
    right: "-12%",
    top: "48%",
    transform: [{ rotate: "28deg" }],
  },

  streetThree: {
    left: "-10%",
    top: "72%",
    transform: [{ rotate: "12deg" }],
  },

  mapIcon: {
    opacity: 0.9,
    position: "absolute",
  },

  mapIconTopOne: {
    left: "12%",
    top: "14%",
  },

  mapIconTopTwo: {
    left: "45%",
    top: "10%",
  },

  mapIconTopThree: {
    right: "12%",
    top: "19%",
  },

  mapIconBottomOne: {
    bottom: "15%",
    left: "18%",
  },

  mapIconBottomTwo: {
    bottom: "10%",
    right: "20%",
  },

  safeArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  content: {
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    maxWidth: 420,
    padding: 24,
    shadowColor: "#287A4A",
    shadowOpacity: 0,
    shadowRadius: 0,
    width: "100%",
  },
});