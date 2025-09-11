// InputPage.tsx
import React, { useState } from "react";
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
  ActivityIndicator,
  KeyboardAvoidingView,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { submitEvent, getCurrentUser } from "../services/in_api";

type Category =
  | "Submission"
  | "Competition"
  | "Seminar"
  | "Promotion"
  | "Research"
  | "Interview"
  | "Registration"
  | "Others";
const categories: Category[] = [
  "Submission",
  "Competition",
  "Seminar",
  "Promotion",
  "Research",
  "Interview",
  "Registration",
  "Others",
];

// --- Image Picker Component ---
const ImagePickerField: React.FC<{
  imageUri: string | null;
  setImageUri: (uri: string | null) => void;
  submitting: boolean;
}> = ({ imageUri, setImageUri, submitting }) => {
  const requestPermissions = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (perm.status !== "granted") {
      Alert.alert(
        "Permission required",
        `Permission to access ${fromCamera ? "camera" : "gallery"} is required!`
      );
      return false;
    }
    return true;
  };

  const pickOrTakeImage = async (fromCamera: boolean) => {
    const ok = await requestPermissions(fromCamera);
    if (!ok) return;

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
        });

    if (!result.canceled) {
      // @ts-ignore
      setImageUri(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.imagePickerContainer}>
      <TouchableOpacity
        onPress={() => pickOrTakeImage(false)}
        disabled={submitting}
      >
        <View style={styles.imageBox}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <Text>Tap to pick image from gallery</Text>
          )}
        </View>
      </TouchableOpacity>
      <Button
        title="Take Photo"
        onPress={() => pickOrTakeImage(true)}
        disabled={submitting}
        color={"#FF5722"}
      />
    </View>
  );
};

// --- Date Picker Component ---
const DatePickerField: React.FC<{
  label: string;
  date: Date;
  setDate: (d: Date) => void;
}> = ({ label, date, setDate }) => {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View style={styles.fieldContainer}>
      <Text>{label}</Text>
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        style={styles.dateBox}
      >
        <Text>{date.toDateString()}</Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}
    </View>
  );
};

// --- Main Input Page ---
const InputPage: React.FC = () => {
  const navigation = useNavigation();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("Submission");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("Submission");
    setStartDate(new Date());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setEndDate(tomorrow);
    setImageUri(null);
  };

  const onSubmit = async () => {
    if (!title.trim()) return Alert.alert("Validation", "Title is required");
    if (endDate <= startDate)
      return Alert.alert("Validation", "End date must be after start date");

    setSubmitting(true);

    try {
      const currentUser = await getCurrentUser();
      if (!currentUser || !currentUser.id) {
        Alert.alert(
          "Error",
          "Cannot determine your user ID. Please log in again."
        );
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("startDate", startDate.toISOString());
      formData.append("endDate", endDate.toISOString());
      formData.append("userId", currentUser.id);

      if (imageUri) {
        const uriParts = imageUri.split(".");
        const fileExt = uriParts[uriParts.length - 1].toLowerCase();
        const mimeType = fileExt === "jpg" ? "jpeg" : fileExt;
        const fileName = `post_${Date.now()}.${fileExt}`;
        formData.append("image", {
          uri: imageUri,
          name: fileName,
          type: `image/${mimeType}`,
        } as any);
      }

      const result = await submitEvent(formData);

      if (result.success) {
        Alert.alert("Success", "Event created successfully!", [
          {
            text: "OK",
            onPress: () => {
              resetForm();
              navigation.goBack();
            },
          },
        ]);
      } else {
        throw new Error(result.message || "Failed to create event");
      }
    } catch (error) {
      console.error("Error submitting event:", error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Create Event</Text>

        <ImagePickerField
          imageUri={imageUri}
          setImageUri={setImageUri}
          submitting={submitting}
        />

        <Text>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          editable={!submitting}
          style={styles.input}
        />

        <Text>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Description"
          editable={!submitting}
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />

        <Text>Category</Text>
        <View style={styles.pickerBox}>
          <Picker
            selectedValue={category}
            enabled={!submitting}
            onValueChange={(v) => setCategory(v as Category)}
          >
            {categories.map((c) => (
              <Picker.Item key={c} label={c} value={c} />
            ))}
          </Picker>
        </View>

        <DatePickerField
          label="Start Date"
          date={startDate}
          setDate={setStartDate}
        />
        <DatePickerField label="End Date" date={endDate} setDate={setEndDate} />

        <View style={styles.submitButton}>
          {submitting ? (
            <ActivityIndicator size="large" color="#FF5722" />
          ) : (
            <Button title="Submit" onPress={onSubmit} color="#FF5722" />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default InputPage;

// -------------------- Styles --------------------
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  heading: { fontSize: 20, marginBottom: 12 },
  imagePickerContainer: {
     marginBottom: 12,
     marginTop: 10,
     },
  imageBox: {
    height: 180,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  image: { width: "100%", height: "100%" },
  fieldContainer: { marginBottom: 8 },
  dateBox: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    marginTop: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    marginTop: 8,
    textAlignVertical: "top",
  },
  pickerBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 12,
    marginTop: 8,
  },
  submitButton: {
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 6,
    backgroundColor: "#FF5722",
  },
});
