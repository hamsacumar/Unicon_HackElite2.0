import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Share,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import RoleBasedBottomNav from "../component/rolebasedNav";
import Constants from "expo-constants";
import Ionicons from "react-native-vector-icons/Ionicons";

import { ProfileService, Profile, Post } from "../services/ProfileService";
import { getBookmarks, EventItem } from "../services/eventService";

const API_URL = Constants.expoConfig?.extra?.apiUrl?.replace("/api", "");

type RootStackParamList = {
  StuProfile: undefined;
  EditProfile: { profile: Profile };
  PostDetail: { post: EventItem | Post };
};

type OrgProfileNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "StuProfile"
>;

const StuProfile: React.FC = () => {
  const navigation = useNavigation<OrgProfileNavigationProp>();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"posts" | "bookmarks" | "settings">("posts");
  const [bookmarks, setBookmarks] = useState<EventItem[]>([]);

  const onShareProfile = async () => {
    try {
      await Share.share({
        message: `Check out ${profile?.username}'s profile: https://yourapp.com/user/${profile?.username}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (activeTab === "bookmarks") {
      (async () => {
        const data = await getBookmarks();
        setBookmarks(data);
      })();
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileData = await ProfileService.getProfile();
        const postsData = await ProfileService.getPosts();
        setProfile(profileData);
        setPosts(postsData);
      } catch (error) {
        console.error("Error fetching profile or posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ textAlign: "center", marginTop: 50 }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ================= Profile Section ================= */}
      <View style={styles.profileSection}>
        <View style={styles.profileHeader}>
          <View style={styles.profileBorder}>
            <View style={styles.profileImage}>
              <Image
                source={{
                  uri: profile?.profileImageUrl
                    ? profile.profileImageUrl.startsWith("http")
                      ? profile.profileImageUrl
                      : `${API_URL}${profile.profileImageUrl.startsWith("/") ? "" : "/"}${profile.profileImageUrl}`
                    : Image.resolveAssetSource(require("../assets/icon.png")).uri,
                }}
                style={styles.image}
                resizeMode="cover"
                onError={(e) =>
                  console.log("Error loading profile image:", e.nativeEvent.error)
                }
              />
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.username}</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>4</Text>
                <Text style={styles.statLabel}>subscribed</Text>
              </View>
            </View>
            <Text style={styles.trustText}>{profile?.description}</Text>
          </View>
        </View>

        {/* ================= Buttons ================= */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              if (profile) navigation.navigate("EditProfile", { profile });
            }}
          >
            <Text style={styles.buttonText}>Edit profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton} onPress={onShareProfile}>
            <Text style={styles.buttonText}>Share profile</Text>
          </TouchableOpacity>
        </View>

        {/* ================= Tabs ================= */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "bookmarks" && styles.activeTab]}
            onPress={() => setActiveTab("bookmarks")}
          >
            <Ionicons
              name="bookmark-outline"
              size={24}
              color={activeTab === "bookmarks" ? "#FF5722" : "#666666"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "settings" && styles.activeTab]}
            onPress={() => setActiveTab("settings")}
          >
            <Ionicons
              name="settings-outline"
              size={24}
              color={activeTab === "settings" ? "#FF5722" : "#666666"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ================= Scrollable Posts / Bookmarks ================= */}
      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.postsContainer}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={true}
        >
          {activeTab === "posts" &&
            posts.map((post) => (
              <TouchableOpacity
                key={post.id}
                style={styles.postCard}
                onPress={() => navigation.navigate("PostDetail", { post })}
              >
                <View style={styles.postContent}>
                  <View style={styles.postTextContainer}>
                    <Text style={styles.postTitle}>{post.title || "Workshops"}</Text>
                    <Text style={styles.postDescription} numberOfLines={4}>
                      {post.description}
                    </Text>
                  </View>
                  <View style={styles.postImageContainer}>
                    {post.imageUrl ? (
                      <Image
                        source={{
                          uri: post.imageUrl.startsWith("http")
                            ? post.imageUrl
                            : `${API_URL}${post.imageUrl.startsWith("/") ? "" : "/"}${post.imageUrl}`,
                        }}
                        style={styles.postImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.postImage, { justifyContent: "center", alignItems: "center" }]}>
                        <Text style={styles.postImagePlaceholder}>No Image</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}

          {activeTab === "bookmarks" &&
            bookmarks.map((post) => (
              <TouchableOpacity
                key={post.id}
                style={styles.postCard}
                onPress={() => navigation.navigate("PostDetail", { post })}
              >
                <View style={styles.postContent}>
                  <View style={styles.postTextContainer}>
                    <Text style={styles.postTitle}>{post.title}</Text>
                    <Text style={styles.postDescription} numberOfLines={4}>
                      {post.description}
                    </Text>
                  </View>
                  <View style={styles.postImageContainer}>
                    {post.imageUrl ? (
                      <Image
                        source={{
                          uri: post.imageUrl.startsWith("http")
                            ? post.imageUrl
                            : `${API_URL}${post.imageUrl.startsWith("/") ? "" : "/"}${post.imageUrl}`,
                        }}
                        style={styles.postImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.postImage, { justifyContent: "center", alignItems: "center" }]}>
                        <Text style={styles.postImagePlaceholder}>No Image</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      {/* ================= Bottom Navigation ================= */}
      <RoleBasedBottomNav navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  profileSection: { backgroundColor: "#FFFFFF", paddingHorizontal: 16, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: "#E0E0E0" },
  profileHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  profileBorder: { width: 86, height: 86, borderRadius: 43, borderWidth: 3, borderColor: "#FF5722", justifyContent: "center", alignItems: "center", marginTop: 20 },
  profileImage: { width: 80, height: 80, borderRadius: 40, overflow: "hidden", backgroundColor: "#FF5722" },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  profileInfo: { flex: 1, marginLeft: 30 },
  profileName: { fontSize: 24, fontWeight: "bold", color: "#000000", marginTop: 5, marginBottom: 8 },
  statsContainer: { flexDirection: "row", gap: 40 },
  statItem: { alignItems: "center" },
  statNumber: { fontSize: 18, fontWeight: "bold", color: "#000000" },
  statLabel: { fontSize: 12, color: "#666666" },
  trustText: { fontSize: 14, color: "#666666", marginTop: 5, marginBottom: 16 },
  buttonContainer: { flexDirection: "row", marginBottom: 16 },
  editButton: { flex: 1, backgroundColor: "#FF5722", paddingVertical: 12, borderRadius: 6, marginRight: 8, alignItems: "center" },
  shareButton: { flex: 1, backgroundColor: "#FF5722", paddingVertical: 12, borderRadius: 6, marginLeft: 8, alignItems: "center" },
  buttonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "500" },
  tabContainer: { flexDirection: "row", justifyContent: "center", gap: 40, marginBottom: 16 },
  tab: { paddingHorizontal: 24, paddingVertical: 8, marginHorizontal: 4 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: "#FF5722" },
  postsContainer: { flex: 1, paddingHorizontal: 16 },
  postCard: { backgroundColor: "#FFFFFF", marginVertical: 8, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#E0E0E0" },
  postContent: { flexDirection: "row" },
  postTextContainer: { flex: 1, paddingRight: 12 },
  postTitle: { fontSize: 14, fontWeight: "bold", color: "#000000", marginBottom: 4 },
  postDescription: { fontSize: 12, color: "#666666", lineHeight: 16 },
  postImageContainer: { width: 120, height: 120, borderRadius: 10, overflow: "hidden" },
  postImage: { width: "100%", height: "100%", backgroundColor: "#2E7D32", borderRadius: 8, justifyContent: "center", alignItems: "center" },
  postImagePlaceholder: { color: "#FFFFFF", fontSize: 12, fontWeight: "bold" },
});

export default StuProfile;
