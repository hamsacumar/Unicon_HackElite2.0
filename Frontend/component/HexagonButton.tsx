// components/HexagonButton.tsx
import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  onPress?: () => void;
}

const HexagonButton: React.FC<Props> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.wrapper} onPress={onPress}>
      <Svg height="70" width="70" viewBox="0 0 100 100">
        <Polygon
          points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
          fill="#FF5722"
        />
      </Svg>
      <Ionicons name="add" size={32} color="#fff" style={styles.icon} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 55, // slightly above navbar
    alignSelf: "center",
    width: 70,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    position: "absolute",
  },
});

export default HexagonButton;
