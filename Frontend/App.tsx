// App.tsx
import React from "react";
import { TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import Test from "./screens/test";
import OrgProfile from "./screens/OrgProfile";
import OrgSettings from "./screens/OrgSettings";

import Home from "./screens/Home";
import LandingPage from "./screens/LandingPage";

// Define your stack param list
export type RootStackParamList = {
  Test: undefined;
  OrgProfile: undefined;
  OrgSettings: undefined;
  Home: undefined;
  LandingPage: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="LandingPage"
        screenOptions={{
          headerStyle: { backgroundColor: "#E64A0D" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        <Stack.Screen
          name="LandingPage"
          component={LandingPage}
          options={{
            title: "Events",
          }}
        />

        <Stack.Screen name="Test" component={Test} />
        <Stack.Screen
          name="OrgProfile"
          component={OrgProfile}
          options={({
            navigation,
          }: {
            navigation: NativeStackNavigationProp<
              RootStackParamList,
              "OrgProfile"
            >;
          }) => ({
            title: "Profile",
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ marginLeft: 15 }}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <TouchableOpacity
                onPress={() => navigation.navigate("OrgSettings")}
                style={{ marginRight: 15 }}
              >
                <Ionicons name="menu" size={28} color="white" />
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen
          name="OrgSettings"
          component={OrgSettings}
          options={({
            navigation,
          }: {
            navigation: NativeStackNavigationProp<
              RootStackParamList,
              "OrgSettings"
            >;
          }) => ({
            title: "Settings and Activity",
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ marginLeft: 15 }}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
            ),
          })}
        />

        <Stack.Screen
          name="Home"
          component={Home}
          options={{
            title: "EventTrix", // Title for header
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
