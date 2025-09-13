// Filter.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Platform, Modal, TouchableWithoutFeedback } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import Constants from "expo-constants";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { EventItem } from "../services/eventService";
import RoleBasedBottomNav from "../component/rolebasedNav";
import { ScrollView } from "react-native-gesture-handler";

const API_URL = Constants.expoConfig?.extra?.apiUrl?.replace("/api", "");

type Props = NativeStackScreenProps<RootStackParamList, 'Filter'>;

const Filter = ({ route, navigation }: Props) => {
  const { userId } = route.params;
  const [category, setCategory] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [posts, setPosts] = useState<EventItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const categories = [
    { label: 'Submission', value: 'Submission' },
    { label: 'Competition', value: 'Competition' },
    { label: 'Seminar', value: 'Seminar' },
    { label: 'Promotion', value: 'Promotion' },
    { label: 'Research', value: 'Research' },
    { label: 'Interview', value: 'Interview' },
    { label: 'Registration', value: 'Registration' },
    { label: 'Other', value: 'Other' },
  ];

  const fetchFilteredPosts = async () => {
    try {
      // Show loading state
      setPosts([]);
      
      const params = new URLSearchParams();
      
      // Add category filter if selected
      if (category) {
        params.append('category', category);
        console.log('Filtering by category:', category);
      }
      
      // Add date filters if selected
      if (startDate) {
        const formattedStartDate = startDate.toISOString().split('T')[0];
        params.append('startDate', formattedStartDate);
        console.log('Filtering by start date:', formattedStartDate);
      }
      
      if (endDate) {
        const formattedEndDate = endDate.toISOString().split('T')[0];
        params.append('endDate', formattedEndDate);
        console.log('Filtering by end date:', formattedEndDate);
      }

      const url = `${API_URL}/api/Posts/filter?${params.toString()}`;
      console.log('Fetching from URL:', url);
      
      const response = await axios.get<EventItem[]>(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });
      
      console.log('Filter response received. Status:', response.status);
      console.log('Response data:', response.data);
      
      if (!Array.isArray(response.data)) {
        console.error('Invalid response format. Expected an array but got:', typeof response.data);
        setPosts([]);
        return;
      }
      
      setPosts(response.data);
    } catch (error: any) {
      const errorDetails = {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        code: error.code,
        isAxiosError: error.isAxiosError,
        timestamp: new Date().toISOString()
      };
      
      console.error("Error fetching filtered posts:", JSON.stringify(errorDetails, null, 2));
      
      // Show user-friendly error message
      if (error.response) {
        // Server responded with error status code
        console.error('Server error:', error.response.data);
      } else if (error.request) {
        // Request was made but no response received
        console.error('No response received from server. Check your network connection.');
      } else {
        // Something else happened
        console.error('Error:', error.message);
      }
      
      setPosts([]);
    }
  };

  const handlePostPress = (item: EventItem) => {
    // Pass userId when navigating
    navigation.navigate("PostDetail", { post: item, userId });
  };

  return (
    <View style={styles.container}>
      {/* Category Dropdown */}
      <View style={styles.dropdownContainer}>
        <TouchableOpacity 
          style={styles.dropdownHeader}
          onPress={() => setShowDropdown(!showDropdown)}
        >
          <Text style={styles.dropdownHeaderText}>
            {category || 'Select Category'}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
        
        {showDropdown && (
          <View style={styles.dropdownList}>
            {categories.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={styles.dropdownItem}
                onPress={() => {
                  setCategory(item.value);
                  setShowDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Date Pickers */}
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
        <Text>{startDate ? startDate.toDateString() : "Start Date"}</Text>
      </TouchableOpacity>
      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(e, date) => {
            // Close the picker when a date is selected or when dismissed
            if (e.type === 'set' || e.type === 'dismissed') {
              setShowStartPicker(false);
            }
            if (date) {
              setStartDate(date);
              // On Android, we need to manually close the picker after selection
              if (Platform.OS === 'android') {
                setShowStartPicker(false);
              }
            }
          }}
        />
      )}

      <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
        <Text>{endDate ? endDate.toDateString() : "End Date"}</Text>
      </TouchableOpacity>
      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(e, date) => {
            // Close the picker when a date is selected or when dismissed
            if (e.type === 'set' || e.type === 'dismissed') {
              setShowEndPicker(false);
            }
            if (date) {
              setEndDate(date);
              // On Android, we need to manually close the picker after selection
              if (Platform.OS === 'android') {
                setShowEndPicker(false);
              }
            }
          }}
        />
      )}

      <TouchableOpacity style={styles.applyButton} onPress={fetchFilteredPosts}>
        <Text style={styles.applyText}>Fetch Posts</Text>
      </TouchableOpacity>

      {/* Filtered Posts */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handlePostPress(item)}>
            <ScrollView style={styles.postCard}>
              {item.imageUrl ? (
                <Image
                  source={{
                    uri: item.imageUrl.startsWith('http') 
                      ? item.imageUrl 
                      : item.imageUrl.startsWith('/')
                        ? `${API_URL}${item.imageUrl}`
                        : `${API_URL}/${item.imageUrl}`,
                    cache: 'force-cache'
                  }}
                  style={styles.postImage}
                  onError={(e) => {
                    console.log('Error loading image:', e.nativeEvent.error);
                    console.log('Image URL:', item.imageUrl);
                  }}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.noImage}>
                  <Text>No Image</Text>
                </View>
              )}
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </ScrollView>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <RoleBasedBottomNav navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 10, 
    backgroundColor: "#fff" 
  },
  dropdownContainer: {
    marginBottom: 10,
    zIndex: 1000,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  dropdownHeaderText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginTop: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  applyButton: {
    backgroundColor: '#FF5722',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  applyText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
  },
  noImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 10,
  },
  category: {
    color: '#666',
    fontSize: 14,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  description: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default Filter;
