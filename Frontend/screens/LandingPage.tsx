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

  // Fetch events from API on component mount
  useEffect(() => {
    async function fetchData() {
      const data = await getEvents();
      setEvents(data);
    }
    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      {/* Event list */}
      <FlatList
        data={events}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            {/* Profile section (avatar + username) */}
            <View style={styles.userRow}>
              <Image
                source={{
                  uri: item.userImage
                    ? item.userImage
                    : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png", // fallback avatar
                }}
                style={styles.avatar}
              />
              <Text style={styles.username}>
  {item.username}
</Text>
            </View>

            {/* Post image */}
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
            ) : (
              <View style={styles.noImage}>
                <Text style={styles.noImageText}>No Image</Text>
              </View>
            )}

            {/* Post category and content */}
            <Text style={styles.category}>{item.category}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>

            {/* Actions (like + comment) */}
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

      {/* Bottom navigation */}
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  listContent: {
    padding: 10,
    paddingBottom: 100, // avoid content hidden behind footer
  },

  /* Post card container */
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

  /* Profile row (avatar + username) */
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20, // circular avatar
    marginRight: 10,
  },
  username: {
    fontWeight: "600",
    fontSize: 14,
    color: "#333",
  },

  /* Post image */
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

  /* Post category and content */
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

  /* Action buttons */
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
