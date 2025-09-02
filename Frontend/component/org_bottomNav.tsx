import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HexagonButton from "./HexagonButton";

interface Props {
  onPressHome?: () => void;
  onPressFilter?: () => void;
  onPressAdd?: () => void;
  onPressNotification?: () => void;
  onPressProfile?: () => void;
}

const BottomNav: React.FC<Props> = ({
  onPressHome,
  onPressFilter,
  onPressAdd,
  onPressNotification,
  onPressProfile,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPressHome} style={styles.iconButton}>
        <Ionicons name="home-outline" size={26} color="#000" />
      </TouchableOpacity>

      <TouchableOpacity onPress={onPressFilter} style={styles.iconButton}>
        <Ionicons name="filter-outline" size={26} color="#000" />
      </TouchableOpacity>

      <HexagonButton onPress={onPressAdd} />

      <TouchableOpacity onPress={onPressNotification} style={styles.iconButton}>
        <Ionicons name="notifications-outline" size={26} color="#000" />
      </TouchableOpacity>

      <TouchableOpacity onPress={onPressProfile} style={styles.iconButton}>
        <Ionicons name="person-outline" size={26} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderRadius: 35,
    height: 90, 
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 5,
  },
  iconButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default BottomNav;