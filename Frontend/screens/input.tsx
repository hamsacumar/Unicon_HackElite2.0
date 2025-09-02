import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Platform,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { submitEvent } from '../services/in_api';

type Category = 'Work' | 'Personal' | 'Holiday' | 'Other';

const categories: Category[] = ['Work', 'Personal', 'Holiday', 'Other'];

const InputPage: React.FC = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Work');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function requestPermissions() {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Permission to access media library is required!');
        return false;
      }
    }
    return true;
  }

  const pickImage = async () => {
    const ok = await requestPermissions();
    if (!ok) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: false,
    });

    if (!result.canceled) {
      // `result` has uri property
      // @ts-ignore
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraPerm.status !== 'granted') {
      Alert.alert('Permission required', 'Permission to access camera is required!');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
      quality: 0.7,
    });

    if (!result.canceled) {
      // @ts-ignore
      setImageUri(result.assets[0].uri);
    }
  };

  const onSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Title is required');
      return;
    }
    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('startDate', startDate.toISOString());
      formData.append('endDate', endDate.toISOString());

      if (imageUri) {
        // @ts-ignore
        const uriParts = imageUri.split('.');
        const fileExt = uriParts[uriParts.length - 1];
        const fileName = `photo_${Date.now()}.${fileExt}`;

        // In Expo, file URI is something like "file:///..."
        // We must provide a `name` and `type`
        // Guess MIME type from extension (basic)
        const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';

        // @ts-ignore
        formData.append('image', {
          uri: imageUri,
          name: fileName,
          type: mimeType,
        } as any);
      }

      const res = await submitEvent(formData);

      if (res && res.success) {
        Alert.alert('Success', 'Event submitted');
        // reset form
        setTitle('');
        setDescription('');
        setImageUri(null);
        setCategory('Work');
        setStartDate(new Date());
        setEndDate(new Date());
      } else {
        Alert.alert('Error', res?.message || 'Submission failed');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, marginBottom: 12 }}>Create Event</Text>

      <TouchableOpacity onPress={pickImage} style={{ marginBottom: 8 }}>
        <View style={{ height: 150, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <Text>Tap to pick image from gallery</Text>
          )}
        </View>
      </TouchableOpacity>

      <Button title="Take Photo" onPress={takePhoto} />

      <Text style={{ marginTop: 12 }}>Title</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6, marginBottom: 8 }}
      />

      <Text>Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Description"
        multiline
        numberOfLines={4}
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6, marginBottom: 8, textAlignVertical: 'top' }}
      />

      <Text>Category</Text>
      <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, marginBottom: 8 }}>
        <Picker selectedValue={category} onValueChange={(v) => setCategory(v as Category)}>
          {categories.map((c) => (
            <Picker.Item key={c} label={c} value={c} />
          ))}
        </Picker>
      </View>

      <Text>Start Date</Text>
      <TouchableOpacity onPress={() => setShowStartPicker(true)} style={{ padding: 10, borderWidth: 1, borderColor: '#ccc', marginBottom: 8, borderRadius: 6 }}>
        <Text>{startDate.toDateString()}</Text>
      </TouchableOpacity>
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartPicker(false);
            if (selectedDate) setStartDate(selectedDate);
          }}
        />
      )}

      <Text>End Date</Text>
      <TouchableOpacity onPress={() => setShowEndPicker(true)} style={{ padding: 10, borderWidth: 1, borderColor: '#ccc', marginBottom: 8, borderRadius: 6 }}>
        <Text>{endDate.toDateString()}</Text>
      </TouchableOpacity>
      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndPicker(false);
            if (selectedDate) setEndDate(selectedDate);
          }}
        />
      )}

      <View style={{ marginTop: 12 }}>
        <Button title={submitting ? 'Submitting...' : 'Submit'} onPress={onSubmit} disabled={submitting} />
      </View>
    </ScrollView>
  );
};

export default InputPage;
