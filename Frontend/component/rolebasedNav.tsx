import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import Org_BottomNav from "./org_bottomNav";
import Stu_BottomNav from "./stu_bottomNav";
import { getUserRole } from "../services/navService";

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
        onPressHome={() => console.log("home pressed")}
        onPressFilter={() => console.log("Filter pressed")}
        onPressAdd={() => console.log("input pressed")}
        onPressNotification={() => console.log("Notification pressed")}
        onPressProfile={() => navigation.navigate("OrgProfile")}
      />
    );
  }

  if (role === "Student") {
    return (
      <Stu_BottomNav
        onPressHome={() => console.log("home pressed")}
        onPressFilter={() => console.log("Filter pressed")}
        onPressNotification={() => console.log("Notification pressed")}
        onPressProfile={() => navigation.navigate("StuProfile")}
      />
    );
  }

  return null;
};

export default RoleBasedBottomNav;
