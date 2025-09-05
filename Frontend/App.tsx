import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import { createStackNavigator } from "@react-navigation/stack";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
import Profile from "./screens/Profile";
import ViewProfile from "./screens/ViewProfile";
import EditProfile from "./screens/EditProfile";
import ProfileSetup from "./screens/ProfileSetup";

// Define your stack param list
export type RootStackParamList = {
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
  ViewProfile: undefined;
  EditProfile: undefined;
  ProfileSetup: undefined;
};

const NativeStack = createNativeStackNavigator<RootStackParamList>();
const Stack = createStackNavigator<RootStackParamList>();

const AuthStack = () => {
  const { token } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <Stack.Screen name="Home" component={Home} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
          <Stack.Screen name="ClassifyAccount" component={ClassifyAccount} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="ProfileSetup" component={ProfileSetup} />
        </>
      )}
    </Stack.Navigator>
  );
};

const MainStack = () => {
  return (
    <NativeStack.Navigator
      initialRouteName="Test"
      screenOptions={{
        headerStyle: { backgroundColor: "#FF5722" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <NativeStack.Screen name="Test" component={Test} />
      <NativeStack.Screen
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
      <NativeStack.Screen
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
        name="ViewProfile"
        component={ViewProfile}
        options={({ navigation }) => ({
          title: "Profile",
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 15 }}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfile}
        options={({ navigation }) => ({
          title: "EditProfile",
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 15 }}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="ProfileSetup"
        component={ProfileSetup}
        options={({ navigation }) => ({
          title: "Setup Profile",
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 15 }}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          ),
        })}
      />
    </NativeStack.Navigator>
  );
};

const RootNavigator = () => {
  const { token } = useAuth();
  return token ? <MainStack /> : <AuthStack />;
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
      <Toast />
    </AuthProvider>
  );
}