// ─── Entity Image Picker ────────────────────────────────────
// Compact image picker for entity forms.
// Displays as a small square in the upper-left of the form.

import { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

interface EntityImagePickerProps {
  /** Current image URI — either a local file:// URI or a server URL */
  imageUri: string | null;
  /** Called when user picks or removes an image */
  onImageChange: (uri: string | null) => void;
}

export default function EntityImagePicker({
  imageUri,
  onImageChange,
}: EntityImagePickerProps) {
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    // Request permissions
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Camera roll access is required to pick images."
        );
        return;
      }
    }

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageChange(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to pick image");
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    onImageChange(null);
  };

  if (imageUri) {
    return (
      <View style={styles.imageWrapper}>
        <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.removeBtn} onPress={removeImage}>
          <FontAwesome5 name="times" size={10} color="#F87171" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.placeholder} onPress={pickImage}>
      {loading ? (
        <ActivityIndicator size="small" color="#7C3AED" />
      ) : (
        <>
          <FontAwesome5 name="camera" size={18} color="#6B7280" />
          <Text style={styles.placeholderText}>Image</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#334155",
    borderStyle: "dashed",
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  placeholderText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
  },
  imageWrapper: {
    position: "relative",
    width: 120,
    height: 120,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 16,
  },
  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    borderWidth: 1.5,
    borderColor: "#F87171",
    justifyContent: "center",
    alignItems: "center",
  },
});
