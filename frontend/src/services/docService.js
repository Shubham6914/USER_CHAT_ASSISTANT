import api from "./api";

/**
 * =====================================================
 * BACKEND INTEGRATION: Upload Document Endpoint
 * =====================================================
 * API Endpoint: POST http://127.0.0.1:8000/api/v1/auth/upload-document
 * Headers: 
 *   - Content-Type: multipart/form-data
 *   - Authorization: Bearer <access_token> (auto-attached via Axios interceptor)
 * Request Payload (FormData):
 *   - user_id: string
 *   - file: Binary File
 */
export const uploadDocument = async (userId, file) => {
  try {
    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("file", file);

    const response = await api.post("/api/v1/auth/upload-document", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.message || "Failed to upload document";
    throw new Error(message);
  }
};
