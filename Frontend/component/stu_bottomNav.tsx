import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  onPressHome?: () => void;
  onPressFilter?: () => void;
  onPressNotification?: () => void;
  onPressProfile?: () => void;
}

const BottomNav: React.FC<Props> = ({
  onPressHome,
  onPressFilter,
  onPressNotification,
  onPressProfile,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPressHome} style={styles.iconButton}>
        <Ionicons name="home-outline" size={28} color="#000000ff" />
      </TouchableOpacity>

      <TouchableOpacity onPress={onPressFilter} style={styles.iconButton}>
        <Ionicons name="filter-outline" size={28} color="#000000ff" />
      </TouchableOpacity>

      <TouchableOpacity onPress={onPressNotification} style={styles.iconButton}>
        <Ionicons name="notifications-outline" size={28} color="#000000ff" />
      </TouchableOpacity>

      <TouchableOpacity onPress={onPressProfile} style={styles.iconButton}>
        <Ionicons name="person-outline" size={28} color="#000000ff" />
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
