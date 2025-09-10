import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

interface Props {
  title: string;
  onPress: () => void; // pass navigation function
}

const SettingsButton: React.FC<Props> = ({ title, onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    marginBottom: 5,
  },
  text: {
    fontSize: 16,
  },
});

export default SettingsButton;
