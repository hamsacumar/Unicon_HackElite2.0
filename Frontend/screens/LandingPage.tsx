import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import BottomNav from "../component/bottomNav";
import { EventItem, getEvents } from "../services/eventService";

type LandingPageNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "LandingPage"
>;

export default function LandingPage() {
  const navigation = useNavigation<LandingPageNavigationProp>();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const data = await getEvents();
      setEvents(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#E64A0D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id.toString()}

        renderItem={({ item }) => (
          <View style={styles.postCard}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
            ) : (
              <View style={styles.noImage}>
                <Text style={styles.noImageText}>No Image</Text>
              </View>
            )}

            <Text style={styles.category}>{item.category}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>

            {/* Like + Comment buttons (UI only) */}
            <View style={styles.actions}>
              <TouchableOpacity>
                <Text style={styles.actionButton}>❤️ Like</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.actionButton}>💬 Comment</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />

     
      <BottomNav
        
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 10,
    paddingBottom: 100, // avoid content hidden behind footer
  },
  postCard: {
    backgroundColor: "#f9f9f9",
    marginBottom: 15,
    padding: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  postImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
  },
  noImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    color: "#555",
  },
  category: {
    fontWeight: "bold",
    marginTop: 8,
    fontSize: 14,
    color: "#E64A0D",
  },
  title: {
    fontSize: 16,
    marginTop: 4,
    fontWeight: "600",
    color: "#333",
  },
  description: {
    fontSize: 13,
    marginTop: 4,
    color: "#666",
  },
  actions: {
    flexDirection: "row",
    marginTop: 8,
    justifyContent: "space-around",
  },
  actionButton: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e74c3c",
  },
});
