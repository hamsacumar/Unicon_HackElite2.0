import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import OrgProfile from "./OrgProfile";
import StuProfile from "./StuProfile";
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
    return <OrgProfile />;
  }

  if (role === "Student") {
    return <StuProfile />;
  }

  return null;
};

export default RoleBasedBottomNav;
