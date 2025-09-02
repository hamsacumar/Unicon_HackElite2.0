import React from 'react';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import RoleBasedBottomNav from "../component/rolebasedNav";

import Ionicons from "react-native-vector-icons/Ionicons";

// Define your stack param list
type RootStackParamList = {
  StuProfile: undefined;
  // Add other screens here if needed
};

// Define the type for navigation prop
type OrgProfileNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'StuProfile'
>;

const StuProfile: React.FC = () => {
  const navigation = useNavigation<OrgProfileNavigationProp>();

  const posts = [
    {
      id: 1,
      title: "Submissions Are Now Open of",
      subtitle: "Get ready to apply the scholarship of 2025!!!",
      description: "Complete your submission here!!! https://scholarsarchive.net/scholarship/ Submission Deadline: https://scholarsarchive.net/ scholarship-deadline/",
      image: require('../assets/icon.png'), // Replace with your image path
    },
    {
      id: 2,
      title: "Submissions Are Now Open of",
      subtitle: "Get ready to apply the scholarship of 2025!!!",
      description: "Complete your submission here!!! https://scholarsarchive.net/scholarship/ Submission Deadline: https://scholarsarchive.net/ scholarship-deadline/",
      image: require('../assets/icon.png'), // Replace with your image path
    },
    {
      id: 3,
      title: "It's a Time to Get Hands-On!",
      subtitle: "Workshop of Interview with Behavior 2024 is here!",
      description: "Get ready for Interview! Ace Soft- Skills Interview Workshop on Improve Your Chances! Successfully Landing Your Next Job! Registration Link: https://behavioralinterviewworkshop.com/ Contact us at 14 July 2024 3:00 PM to 4:00 PM",
      image: require('../assets/icon.png'), // Replace with your image path
    },
  ];

  return (
    <SafeAreaView style={styles.container}>

      {/* Fixed Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileHeader}>
          <View style={styles.profileBorder}>
            <View style={styles.profileImage}>
              <Image
                source={require("../assets/icon.png")}
                style={styles.image}
              />
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Amile Sweety</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>4</Text>
                <Text style={styles.statLabel}>subscribed</Text>
              </View>
            </View>
            <Text style={styles.trustText}>We can do it, don't try hard,think smart</Text>
          </View>
        </View>

        

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.buttonText}>Edit profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.buttonText}>Share profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Ionicons name="bookmark-outline" size={24} color="#FF5722" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.tab}>
            <Ionicons name="settings-outline" size={24} color="#666666" />
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
                <Text style={styles.postSubtitle}>{post.subtitle}</Text>
                <Text style={styles.postDescription} numberOfLines={4}>
                  {post.description}
                </Text>
              </View>
              <View style={styles.postImageContainer}>
                <Image
                  source={post.image} // <-- use the post.image here
                  style={styles.postImage} // ensure proper width/height
                  resizeMode="cover"     // or 'contain' as needed
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
    marginTop:20,
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

export default StuProfile;
