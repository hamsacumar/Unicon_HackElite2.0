// screens/SplashScreen.tsx
import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App"; // Adjust path as needed

type SplashScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "SplashScreen"
>;

const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();

  useEffect(() => {
    // Navigate to LandingPage after 3 seconds
    const timer = setTimeout(() => {
      navigation.navigate("LandingPage");
    }, 4000);

    // Clean up the timer if the component unmounts
    return () => clearTimeout(timer);
  }, [navigation]);

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