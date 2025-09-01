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
import InputPage from "./screens/input"; // ✅ import your InputPage
import Chat from "./screens/Chat"; // Import Chat screen

// Define your stack param list
export type RootStackParamList = {
  Test: undefined;
  OrgProfile: undefined;
  OrgSettings: undefined;
  InputPage: undefined;
  Chat: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Test"
        screenOptions={{
          headerStyle: { backgroundColor: "#E64A0D" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
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
        {/* ✅ Add InputPage screen */}
        <Stack.Screen
          name="InputPage"
          component={InputPage}
          options={{ title: "Create Event" }}
        />

        {/* Add Chat screen */}
        {/* <Stack.Screen
          name="Chat"
          component={Chat}
          options={{ title: "Chat" }}
          > */}
          {/* </Stack.Screen> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
