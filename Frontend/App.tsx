import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import { createStackNavigator } from "@react-navigation/stack";
import { TouchableOpacity, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import Test from "./screens/test";
import OrgSettings from "./screens/OrgSettings";
import { AuthProvider, useAuth } from "./utils/AuthContext"; // Import useAuth
import Login from "./screens/Login";
import Signup from "./screens/Signup";
import VerifyCode from "./screens/VerifyCode";
import ClassifyAccount from "./screens/ClassifyAccount";
import ForgotPassword from "./screens/ForgotPassword";
import ResetPassword from "./screens/ResetPassword";
import Home from "./screens/Home";
import Profile from "./screens/Profile";
import ViewProfile from "./screens/ViewProfile";
import EditProfile from "./screens/EditProfile"
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
};

const NativeStack = createNativeStackNavigator<RootStackParamList>();
const Stack = createStackNavigator<RootStackParamList>();

const AuthStack = () => {
  const { token } = useAuth(); // Use the custom hook

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <Stack.Screen name="Home" component={Home} />
      ) : (
        <>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Signup" component={Signup} />
          <Stack.Screen name="VerifyCode" component={VerifyCode} />
          <Stack.Screen name="ClassifyAccount" component={ClassifyAccount} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          <Stack.Screen name="ResetPassword" component={ResetPassword} />
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
          options={({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList, "ViewProfile"> }) => ({
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
          options={({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList, "EditProfile"> }) => ({
            title: "EditProfile",
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
  const { token } = useAuth(); // Use the custom hook

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
