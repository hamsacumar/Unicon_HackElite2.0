import React, { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { AuthContext } from "../utils/AuthContext";

const Home = () => {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const logout = auth?.logout;

  return (
    <View style={styles.container}>
      <Text>
        Welcome, {user?.username} ({user?.role})
      </Text>
      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
      {/* Add links to OrgProfile, OrgSettings if Organizer */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#E64A0D",
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
  },
});

export default Home;
