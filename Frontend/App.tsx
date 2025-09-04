import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createStackNavigator, StackNavigationProp } from "@react-navigation/stack";
import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

// Screens
import Test from "./screens/test";
import OrgSettings from "./screens/OrgSettings";
import LoginScreen from "./screens/auth/LoginScreen";
import SignupScreen from "./screens/auth/SignupScreen";
import VerifyCodeScreen from "./screens/auth/VerifyCodeScreen";
import ClassifyAccount from "./screens/auth/ClassifyAccountScreen";
import ForgotPasswordScreen from "./screens/auth/ForgotPasswordScreen";
import ResetPasswordScreen from "./screens/auth/ResetPasswordScreen";
import Home from "./screens/Home";
import LandingPage from "./screens/LandingPage";
import InputPage from "./screens/input"; // Input Page
import Chat from "./screens/Chat";
import InboxScreen from "./screens/InboxScreen";
import Profile from "./screens/Profile";
import ViewProfile from "./screens/ViewProfile";
import ProfileSetup from "./screens/ProfileSetup";

// Context
import { AuthProvider, useAuth } from "./utils/AuthContext";

import EditProfile from "./screens/EditProfile";
import OrgProfile from "./screens/OrgProfile";
import PostDetail from "./screens/PostDetail";
import { EventItem } from "./services/eventService";
// Define type for stack navigator
export type RootStackParamList = {
  // Main app screens
  App: undefined;
  Auth: undefined;
  
  // Other screens
  Test: undefined;
  Profile: undefined;
  OrgSettings: undefined;
  Login: undefined;
  Signup: undefined;
  VerifyCode: undefined;
  ClassifyAccount: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  Home: undefined;
  LandingPage: undefined;
  InputPage: undefined;
  InboxScreen: { currentUserId: string };
  Chat: {
    currentUserId: string;
    otherUserId: string;
    currentUsername: string;
    otherUsername: string;
  };
  ViewProfile: undefined;
  EditProfile: undefined;
  ProfileSetup: undefined;
  OrgProfile: undefined;
  PostDetail: { post: EventItem };
};

const NativeStack = createNativeStackNavigator<RootStackParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// Auth Stack
const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
      <Stack.Screen name="ClassifyAccount" component={ClassifyAccount} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetup} />
    </Stack.Navigator>
  );
};

// Main App Stack
const AppStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
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
            navigation: StackNavigationProp<RootStackParamList, "LandingPage">;
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
            navigation: StackNavigationProp<RootStackParamList, "OrgProfile">;
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
            navigation: StackNavigationProp<RootStackParamList, "Profile">;
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

        {/* InboxScreen screen */}
        <Stack.Screen
          name="InboxScreen"
          component={InboxScreen}
          options={{ title: "Inbox" }}
        />

        {/* Chat screen */}
        <Stack.Screen
          name="Chat"
          component={Chat}
          options={{ title: "Chat" }}
        />

        {/* ViewProfile screen */}
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

<Stack.Screen name="PostDetail" component={PostDetail} options={{ title: "Post" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

