// App.tsx
import "react-native-gesture-handler";
import React from "react";
import { TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";

import { Ionicons } from "@expo/vector-icons";

// Import screens
import Test from "./screens/test";
import OrgSettings from "./screens/OrgSettings";
import Home from "./screens/Home";
import LandingPage from "./screens/LandingPage";
import InputPage from "./screens/input"; // Input Page
import Profile from "./screens/Profile";
import ViewProfile from "./screens/ViewProfile";
import EditProfile from "./screens/EditProfile";
import MessagesPage from "./screens/MessagePage";;
import OrgProfile from "./screens/OrgProfile";
import PostDetail from "./screens/PostDetail";
import { EventItem } from "./services/eventService";
// Define type for stack navigator
export type RootStackParamList = {
  Test: undefined;
  Profile: undefined;
  OrgSettings: undefined;
  Home: undefined;
  LandingPage: undefined;
  InputPage: undefined;
  ViewProfile: undefined;
  EditProfile: undefined;
  OrgProfile: undefined;
  PostDetail: { post: EventItem };
  MessagePage: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Test"
        screenOptions={{
          headerStyle: { backgroundColor: "#FF5722" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        {/* Home screen */}
        <Stack.Screen
          name="Home"
          component={Home}
          options={{
            title: "EventTrix",
          }}
        />

        {/* Landing Page screen with back button */}
        <Stack.Screen
          name="LandingPage"
          component={LandingPage}
          options={({
            navigation,
          }: {
            navigation: NativeStackNavigationProp<
              RootStackParamList,
              "LandingPage"
            >;
          }) => ({
            title: "EventTrix",
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
        {/* OrgProfile screen with back button */}
        <Stack.Screen
          name="OrgProfile"
          component={OrgProfile} // make sure to import OrgProfile at the top
          options={({
            navigation,
          }: {
            navigation: NativeStackNavigationProp<
              RootStackParamList,
              "OrgProfile"
            >;
          }) => ({
            title: "Organization Profile", // header title
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

        {/* Test screen */}
        <Stack.Screen name="Test" component={Test} />

        {/* Profile screen with back and menu buttons */}
        <Stack.Screen
          name="Profile"
          component={Profile}
          options={({
            navigation,
          }: {
            navigation: NativeStackNavigationProp<
              RootStackParamList,
              "Profile"
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

        {/* OrgSettings screen */}
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

        {/* InputPage screen */}
        <Stack.Screen
          name="InputPage"
          component={InputPage}
          options={{ title: "Create Event" }}
        />
        <Stack.Screen
          name="ViewProfile"
          component={ViewProfile}
          options={({
            navigation,
          }: {
            navigation: NativeStackNavigationProp<
              RootStackParamList,
              "ViewProfile"
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
          })}
        />

        {/* EditProfile screen */}
        <Stack.Screen
          name="EditProfile"
          component={EditProfile}
          options={({
            navigation,
          }: {
            navigation: NativeStackNavigationProp<
              RootStackParamList,
              "EditProfile"
            >;
          }) => ({
            title: "Edit Profile",
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
          name="MessagePage"
          component={MessagesPage}
          options={{ title: "Messages" }}
        />

<Stack.Screen name="PostDetail" component={PostDetail} options={{ title: "Post" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
