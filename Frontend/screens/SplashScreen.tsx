// screens/SplashScreen.tsx
import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App"; // Adjust path as needed
import { useAuth } from "../utils/AuthContext";

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();

  const { token } = useAuth();

  useEffect(() => {
    // After 2 seconds, navigate based on auth status
    const timer = setTimeout(() => {
      if (token) {
        // Navigate to AppStack which shows the main app
        navigation.navigate('AppStack');
      } else {
        // Navigate to LandingPage directly
        navigation.navigate('LandingPage');
      }
    }, 2000);

    // Clean up the timer if the component unmounts
    return () => clearTimeout(timer);
  }, [navigation, token]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/eventTrix.png")} // Replace with your actual logo path
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>EventTrix</Text>
      <Text style={styles.subtitle}>Your Event Management Solution</Text>
      <ActivityIndicator size="large" color="#FF5722" style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FF5722",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;
