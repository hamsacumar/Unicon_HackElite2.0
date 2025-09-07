import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Constants from "expo-constants";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import RoleBasedBottomNav from "../component/rolebasedNav";

import Ionicons from "react-native-vector-icons/Ionicons";

import { ProfileService, Profile, Post } from '../services/ProfileService';


const API_URL = Constants.expoConfig?.extra?.apiUrl?.replace("/api", "");

// Define your stack param list
type RootStackParamList = {
  OrgProfile: undefined;
  EditProfile: undefined;
};

// Define the type for navigation prop
type OrgProfileNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'OrgProfile'
>;

const OrgProfile: React.FC = () => {
  const navigation = useNavigation<OrgProfileNavigationProp>();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postCount, setPostCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileData = await ProfileService.getProfile();
        const postsData = await ProfileService.getPosts();
        setProfile(profileData);
        setPosts(postsData);

        const count = await ProfileService.getPostCount();
      setPostCount(count);
      
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
        <Text style={{ textAlign: 'center', marginTop: 50 }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* Fixed Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileHeader}>
        <View style={styles.profileBorder}>
  <View style={styles.profileImage}>
    <Image
      source={{
        uri: profile?.profileImageUrl
          ? (profile.profileImageUrl.startsWith("http")
              ? profile.profileImageUrl
              : `${API_URL}${profile.profileImageUrl.startsWith("/") ? "" : "/"}${profile.profileImageUrl}`)
          : Image.resolveAssetSource(require("../assets/icon.png")).uri, // ✅ fallback
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
          <Text style={styles.statNumber}>{postCount}</Text>
                <Text style={styles.statLabel}>posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>52</Text>
                <Text style={styles.statLabel}>subscribers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>20</Text>
                <Text style={styles.statLabel}>subscribed</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.trustText}>{profile?.description}</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.editButton}>
            <Text 
              style={styles.buttonText}  
              onPress={() => navigation.navigate('EditProfile')}>
                Edit profile
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.buttonText}>Share profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Ionicons name="grid-outline" size={24} color="#FF5722" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.tab}>
            <Ionicons name="play-outline" size={24} color="#666666" />
          </TouchableOpacity>
        </View>

      </View>

      {/* Scrollable Posts Section */}
      <ScrollView style={styles.postsContainer} showsVerticalScrollIndicator={false}>
        {posts.map((post) => (
          <View key={post.id} style={styles.postCard}>
          <View style={styles.postContent}>
            <View style={styles.postTextContainer}>
              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postSubtitle}>{post.category}</Text>
              <Text style={styles.postDescription} numberOfLines={4}>
                {post.description}
              </Text>
            </View>
            <View style={styles.postImageContainer}>
  <Image
    source={{
      uri: post.imageUrl
        ? post.imageUrl.startsWith("http")
          ? post.imageUrl
          : `${API_URL}${post.imageUrl.startsWith("/") ? "" : "/"}${post.imageUrl}`
        : "https://via.placeholder.com/300x200", // fallback
    }}
    style={styles.postImage}
    resizeMode="cover"
    onError={(e) =>
      console.log("Error loading post image:", e.nativeEvent.error)
    }
  />
</View>

          </View>
        </View>

        ))}
      </ScrollView>



      <RoleBasedBottomNav navigation={navigation} />

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FF5722',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 56,
  },
  backArrow: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 4,
  },
  menuIcon: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileBorder: {
    width: 86,              // 80 (image) + 3*2 (border)
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: "#FF5722",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",     // clips the image into a circle
    backgroundColor: "#FF5722",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  profileInfo: {
    flex: 1,
    marginLeft: 30,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 5,
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  trustText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#FF5722',
    paddingVertical: 12,
    borderRadius: 6,
    marginRight: 8,
    alignItems: 'center',
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#FF5722',
    paddingVertical: 12,
    borderRadius: 6,
    marginLeft: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF5722',
  },
  tabIcon: {
    fontSize: 18,
    color: '#666666',
  },
  postsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  postContent: {
    flexDirection: 'row',
  },
  postTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  postTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  postSubtitle: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 8,
  },
  postDescription: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  postImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 10,
    overflow: "hidden",
  },
  postImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postImagePlaceholder: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default OrgProfile;
