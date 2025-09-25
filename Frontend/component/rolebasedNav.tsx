import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, Text, Button } from "react-native";
import Org_BottomNav from "./org_bottomNav";
import Stu_BottomNav from "./stu_bottomNav";
import { getUserRole } from "../services/navService";
import BottomNav from "./bottomNav";

interface Props {
  navigation: any;
}

const RoleBasedBottomNav: React.FC<Props> = ({ navigation }) => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      const userRole = await getUserRole();
      setRole(userRole);
      setLoading(false);
    };

    fetchRole();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#E64A0D" />
      </View>
    );
  }

  if (role === "Organizer") {
    return (
      <Org_BottomNav
        onPressHome={() => navigation.navigate("Home")}
        onPressFilter={() => navigation.navigate("Filter")}
        onPressAdd={() => navigation.navigate("InputPage")}
        onPressNotification={() => navigation.navigate("Notification")}
        onPressProfile={() => navigation.navigate("Profile")}
      />
    );
  }

  if (role === "Student") {
    return (
      <Stu_BottomNav
        onPressHome={() => navigation.navigate("Home")}
        onPressFilter={() => navigation.navigate("Filter")}
        onPressNotification={() => navigation.navigate("Notification")}
        onPressProfile={() => navigation.navigate("Profile")}
      />
    );
  }

  // fallback UI
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Unable to determine role. Please login again.</Text>
      <Button
        title="Go to Login"
        onPress={() => navigation.navigate("Login")}
      />
    </View>
  );
};

export default RoleBasedBottomNav;
