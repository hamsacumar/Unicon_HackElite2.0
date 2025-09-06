import React from "react";
import { TouchableOpacity, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import { createStackNavigator } from "@react-navigation/stack";
import Toast from "react-native-toast-message";

import Test from "./screens/test";
import OrgSettings from "./screens/OrgSettings";
import { AuthProvider, useAuth } from "./utils/AuthContext";

// Updated imports for new auth screens
import LoginScreen from "./screens/auth/LoginScreen";
import SignupScreen from "./screens/auth/SignupScreen";
import VerifyCodeScreen from "./screens/auth/VerifyCodeScreen";
import ClassifyAccount from "./screens/auth/ClassifyAccountScreen";
import ForgotPasswordScreen from "./screens/auth/ForgotPasswordScreen";
import ResetPasswordScreen from "./screens/auth/ResetPasswordScreen";

import Home from "./screens/Home";
import LandingPage from "./screens/LandingPage";
import InputPage from "./screens/input";
import Chat from "./screens/Chat";
import InboxScreen from "./screens/InboxScreen";
import Profile from "./screens/Profile";
import ViewProfile from "./screens/ViewProfile";
import EditProfile from "./screens/EditProfile";
import ProfileSetup from "./screens/ProfileSetup";
import OrgProfile from "./screens/OrgProfile";
import PostDetail from "./screens/PostDetail";
import NotificationScreen from "./screens/NotificationScreen";
import { EventItem } from "./services/eventService";


export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  LandingPage: undefined;
  Test: undefined;
  Profile: undefined;
  OrgSettings: undefined;
  InputPage: undefined;
  InboxScreen: { currentUserId: string };
  Chat: { currentUserId: string; otherUserId: string; currentUsername: string; otherUsername: string };
  ViewProfile: undefined;
  EditProfile: undefined;
  ProfileSetup: undefined;
  OrgProfile: undefined;
  PostDetail: { post: EventItem };
  Login: undefined;
  Signup: undefined;
  VerifyCode: undefined;
  ClassifyAccount: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  NotificationScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppStack = () => (
  <Stack.Navigator
    initialRouteName="Test"
    screenOptions={{
      headerStyle: { backgroundColor: "#FF5722" },
      headerTintColor: "#fff",
      headerTitleStyle: { fontWeight: "bold" },
    }}
  >
    <Stack.Screen name="Home" component={Home} options={{ title: "EventTrix" }} />

    <Stack.Screen
      name="LandingPage"
      component={LandingPage}
      options={({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList, "LandingPage"> }) => ({
        title: "EventTrix",
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 15 }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        ),
      })}
    />

    <Stack.Screen
      name="OrgProfile"
      component={OrgProfile}
      options={({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList, "OrgProfile"> }) => ({
        title: "Organization Profile",
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 15 }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        ),
      })}
    />

    <Stack.Screen
      name="Profile"
      component={Profile}
      options={({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList, "Profile"> }) => ({
        title: "Profile",
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 15 }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={() => navigation.navigate("OrgSettings")} style={{ marginRight: 15 }}>
            <Ionicons name="menu" size={28} color="white" />
          </TouchableOpacity>
        ),
      })}
    />

    <Stack.Screen name="OrgSettings" component={OrgSettings} options={{ title: "Settings and Activity" }} />
    <Stack.Screen name="InputPage" component={InputPage} options={{ title: "Create Event" }} />
    <Stack.Screen name="InboxScreen" component={InboxScreen} options={{ title: "Inbox" }} />
    <Stack.Screen name="Chat" component={Chat} options={{ title: "Chat" }} />
    <Stack.Screen name="ViewProfile" component={ViewProfile} options={{ title: "Profile" }} />
    <Stack.Screen name="EditProfile" component={EditProfile} options={{ title: "Edit Profile" }} />
    <Stack.Screen name="PostDetail" component={PostDetail} options={{ title: "Post" }} />
    
    <Stack.Screen 
      name="NotificationScreen" 
      component={NotificationScreen} 
      options={({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList, "NotificationScreen"> }) => ({
        title: "Notifications",
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 15 }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        )
      })} 
    />

    <Stack.Screen name="Test" component={Test} />
    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
    <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ClassifyAccount" component={ClassifyAccount} options={{ headerShown: false }} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ProfileSetup" component={ProfileSetup} options={{ headerShown: false }} />
  </Stack.Navigator>
);

// Add a new AuthStack component for unauthenticated users
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
    <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
    <Stack.Screen name="ClassifyAccount" component={ClassifyAccount} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
  </Stack.Navigator>
);

// Main App component with authentication check
const MainApp = () => {
  const { token, isLoading } = useAuth();
  
  // Show loading indicator while checking auth state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  
  return (
    <NavigationContainer>
      {token ? <AppStack /> : <AuthStack />}
      <Toast />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
