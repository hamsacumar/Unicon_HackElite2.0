import React, { useEffect } from "react";
import { TouchableOpacity, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
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
import SplashScreen from "./screens/SplashScreen"; 
// Context
import { AuthProvider, useAuth } from "./utils/AuthContext";

export type RootStackParamList = {
  // App flow screens
  SplashScreen: undefined;
  Home: undefined;
  LandingPage: undefined;
  Profile: undefined;
  OrgSettings: undefined;
  InputPage: undefined;
  InboxScreen: { currentUserId: string };
  Chat: { currentUserId: string; otherUserId: string; currentUsername: string; otherUsername: string };
  ViewProfile: { username: string };
  EditProfile: undefined;
  ProfileSetup: undefined;
  OrgProfile: undefined;
  PostDetail: { post: EventItem; userId?: string | null };
  
  // Auth flow screens
  Login: undefined;
  Signup: undefined;
  VerifyCode: undefined;
  ClassifyAccount: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  
  // Feature screens
  NotificationScreen: undefined;
  
  // Navigation stacks
  AppStack: undefined;
  AuthStack: undefined;
  App: undefined;
  Auth: undefined;
  
  // Test screen
  Test: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Main authenticated app stack
const AppStack = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: "#FF5722" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Stack.Screen 
        name="Home"
        component={Home}
        options={{
          title: "EventTrix",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("InboxScreen", { currentUserId: "123" })} 
              style={{ marginRight: 15 }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={26} color="white" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <Stack.Screen
        name="OrgProfile"
        component={OrgProfile}
        options={{
          title: "Organization Profile",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          ),
        }}
      />

      <Stack.Screen
        name="Profile"
        component={Profile}
        options={{
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
        }}
      />

      <Stack.Screen
        name="OrgSettings"
        component={OrgSettings}
        options={{ title: "Settings and Activity" }}
      />
      <Stack.Screen
        name="InputPage"
        component={InputPage}
        options={{ title: "Create Event" }}
      />
      <Stack.Screen
        name="InboxScreen"
        component={InboxScreen}
        options={{ title: "Inbox" }}
      />
      <Stack.Screen name="Chat" component={Chat} options={{ title: "Chat" }} />
      <Stack.Screen name="ViewProfile" component={ViewProfile} options={{ title: "Profile" }} />
      <Stack.Screen name="EditProfile" component={EditProfile} options={{ title: "Edit Profile" }} />
      <Stack.Screen name="PostDetail" component={PostDetail} options={{ title: "Post" }} />
      <Stack.Screen name="Test" component={Test} />
      <Stack.Screen name="NotificationScreen" component={NotificationScreen} options={{ title: "Notifications" }} />
    </Stack.Navigator>
  );
};

// Authentication stack for unauthenticated users
const AuthStack = () => {
  return (
    <Stack.Navigator 
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
        name="LandingPage"
        component={LandingPage}
        options={{
          title: "EventTrix",
          headerShown: true,
          headerLeft: () => null, // Remove back button on LandingPage
        }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ title: "Login" }}
      />
      <Stack.Screen 
        name="Signup" 
        component={SignupScreen} 
        options={{ title: "Create Account" }}
      />
      <Stack.Screen 
        name="VerifyCode" 
        component={VerifyCodeScreen} 
        options={{ title: "Verify Code" }}
      />
      <Stack.Screen 
        name="ClassifyAccount" 
        component={ClassifyAccount} 
        options={{ title: "Account Type" }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen} 
        options={{ title: "Forgot Password" }}
      />
      <Stack.Screen 
        name="ResetPassword" 
        component={ResetPasswordScreen} 
        options={{ title: "Reset Password" }}
      />
    </Stack.Navigator>
  );
};

// Root stack navigator
const RootStack = createNativeStackNavigator<RootStackParamList>();

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
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!token ? (
          // Show Auth stack with SplashScreen as initial route
          <RootStack.Screen name="AuthStack" component={AuthStack} />
        ) : (
          // Show App stack with Home as initial route
          <RootStack.Screen name="AppStack" component={AppStack} />
        )}
      </RootStack.Navigator>
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
