import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import RoleBasedBottomNav from "../component/rolebasedNav";

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
            <Text style={styles.profileName}>WSO2</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>24</Text>
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

        <Text style={styles.trustText}>Trusted by the World's best Enterprises</Text>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OrgProfile;
