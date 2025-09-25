// App.tsx
import "react-native-gesture-handler";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import { createStackNavigator } from "@react-navigation/stack";
import Toast from "react-native-toast-message";

import Test from "./screens/test";
import OrgSettings from "./screens/OrgSettings";

// Updated imports for new auth screens
import LoginScreen from "./screens/auth/LoginScreen";
import SignupScreen from "./screens/auth/SignupScreen";
import VerifyCodeScreen from "./screens/auth/VerifyCodeScreen";
import ClassifyAccount from "./screens/auth/ClassifyAccountScreen";
import ForgotPasswordScreen from "./screens/auth/ForgotPasswordScreen";
import ResetPasswordScreen from "./screens/auth/ResetPasswordScreen";

import Filter from "./screens/filter";
import Home from "./screens/Home";
import LandingPage from "./screens/LandingPage";
import InputPage from "./screens/input"; // Input Page
import Profile from "./screens/Profile";
import ViewProfile from "./screens/ViewProfile";
import EditProfile from "./screens/EditProfile";
import MessagesPage from "./screens/MessagePage";
import ProfileSetup from "./screens/ProfileSetup";
import OrgProfile from "./screens/OrgProfile";
import PostDetail from "./screens/PostDetail";
import { EventItem } from "./services/eventService";
import SplashScreen from "./screens/SplashScreen";
import OrgPostDetail from "./screens/OrgPostDetail";
// Context
import { AuthProvider } from "./utils/AuthContext";
import LandingPostDetail from "./screens/LandingPostDetail";
import NotificationScreen from "./screens/NotificationScreen";
import HelpScreen from "./screens/HelpScreen";
import TermsScreen from "./screens/TermsScreen";
import AboutScreen from "./screens/AboutScreen";

export type RootStackParamList = {
  SplashScreen: undefined;
  Auth: undefined;
  Home: undefined;
  LandingPage: undefined;
  Profile: undefined;
  OrgSettings: undefined;
  InputPage: undefined;
  InboxScreen: { currentUserId: string };
  EventDetail: { eventId: string };
  Chat: {
    currentUserId: string;
    otherUserId: string;
    currentUsername: string;
    otherUsername: string;
  };
  Notification: undefined;
  ViewProfile: { username: string };
  EditProfile: undefined;
  ProfileSetup: undefined;
  OrgProfile: undefined;
  PostDetail: { post: EventItem; userId?: string | null };
  LandingPostDetail: { post: EventItem };
  OrgPostDetail: { post: EventItem; userId?: string | null };

  Test: undefined;
  Login: undefined;
  Signup: undefined;
  VerifyCode: undefined;
  ClassifyAccount: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  Filter: { userId: string };
  MessagePage: undefined;
  Help: undefined;
  Terms: undefined;
  About: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppStack = () => (
  <Stack.Navigator
    initialRouteName="SplashScreen" // intial start screen is SplashScreen
    screenOptions={{
      headerStyle: { backgroundColor: "#FF5722" },
      headerTintColor: "#fff",
      headerTitleStyle: { fontWeight: "bold" },
    }}
  >
    <Stack.Screen
      name="SplashScreen"
      component={SplashScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Home"
      component={Home}
      options={({
        navigation,
      }: {
        navigation: NativeStackNavigationProp<RootStackParamList, "Home">;
      }) => ({
        title: "EventTrix",
        headerRight: () => (
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity
              onPress={() => navigation.navigate("Notification")}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="notifications-outline" size={26} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("MessagePage")}
              style={{ marginRight: 15 }}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={26}
                color="white"
              />
            </TouchableOpacity>
          </View>
        ),
      })}
    />

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
          ></TouchableOpacity>
        ),
      })}
    />

    <Stack.Screen
      name="Profile"
      component={Profile}
      options={({
        navigation,
      }: {
        navigation: NativeStackNavigationProp<RootStackParamList, "Profile">;
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
      options={{ title: "Settings and Activity" }}
    />
    <Stack.Screen
      name="Filter"
      component={Filter}
      options={{ title: "Filter" }}
      initialParams={{ userId: "" }} // This will be populated with the actual userId when navigating
    />

    <Stack.Screen
      name="InputPage"
      component={InputPage}
      options={{ title: "Create Event" }}
    />
    <Stack.Screen
      name="ViewProfile"
      component={ViewProfile}
      options={{ title: "Profile" }}
    />
    <Stack.Screen
      name="EditProfile"
      component={EditProfile}
      options={{ title: "Edit Profile" }}
    />
    <Stack.Screen
      name="PostDetail"
      component={PostDetail}
      options={{ title: "Post Details" }}
    />

    <Stack.Screen name="Test" component={Test} />
    <Stack.Screen
      name="Login"
      component={LoginScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Signup"
      component={SignupScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="VerifyCode"
      component={VerifyCodeScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ClassifyAccount"
      component={ClassifyAccount}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ForgotPassword"
      component={ForgotPasswordScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ResetPassword"
      component={ResetPasswordScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ProfileSetup"
      component={ProfileSetup}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Notification"
      component={NotificationScreen}
      options={({ navigation }) => ({
        title: "Notifications",
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginLeft: 15 }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        ),
        headerStyle: { backgroundColor: "#FF5722" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      })}
    />
    <Stack.Screen
      name="MessagePage"
      component={MessagesPage}
      options={{ title: "Message" }}
    />

    <Stack.Screen
      name="Help"
      component={HelpScreen}
      options={{ title: "Help & Support" }}
    />
    <Stack.Screen
      name="Terms"
      component={TermsScreen}
      options={{ title: "Terms & Policies" }}
    />
    <Stack.Screen
      name="About"
      component={AboutScreen}
      options={{ title: "About" }}
    />

    <Stack.Screen
      name="LandingPostDetail"
      component={LandingPostDetail}
      options={{ title: "EventTrix" }}
    />

    <Stack.Screen
      name="OrgPostDetail"
      component={OrgPostDetail}
      options={{ title: "EventTrix" }}
    />
  </Stack.Navigator>
);

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <NavigationContainer>
          <AppStack />
          <Toast />
        </NavigationContainer>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
