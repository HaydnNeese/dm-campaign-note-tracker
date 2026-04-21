// ─── Image upload service ───────────────────────────────────
// Uploads a local image URI to the backend and returns the server URL.
// Handles both web (blob) and native (RN-style FormData) platforms.

import { Platform } from "react-native";
import { API_BASE_URL } from "@/constants/Config";
import { getToken } from "./api";

/**
 * Upload an image from a local device URI to the backend.
 * @returns The server-relative URL, e.g. "/uploads/abc123.jpg"
 */
export async function uploadImage(localUri: string): Promise<string> {
  const token = await getToken();

  // Build multipart form data
  const formData = new FormData();

  // Determine filename and MIME type from the URI
  const uriParts = localUri.split("/");
  const rawFileName = uriParts[uriParts.length - 1] || "photo.jpg";
  // Strip any query params from filename (blob URIs can have them)
  const fileName = rawFileName.split("?")[0] || "photo.jpg";
  const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };
  const mimeType = mimeMap[ext] || "image/jpeg";

  if (Platform.OS === "web") {
    // On web, we need to fetch the blob from the URI (data: or blob: URL)
    // and append it as a proper File/Blob to the FormData.
    const response = await fetch(localUri);
    const blob = await response.blob();
    formData.append("image", blob, fileName);
  } else {
    // On native (iOS/Android), React Native supports the {uri, name, type} pattern
    formData.append("image", {
      uri: localUri,
      name: fileName,
      type: mimeType,
    } as any);
  }

  const res = await fetch(`${API_BASE_URL}/uploads/image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // Don't set Content-Type — fetch will set it with the boundary
    },
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Upload failed: ${res.status}`);
  }

  const data = await res.json();
  return data.url;
}
