import api from "./api";

/**
 * =====================================================
 * BACKEND INTEGRATION: Query Document/Assistant Endpoint
 * =====================================================
 * API Endpoint: POST http://127.0.0.1:8000/api/v1/documents/query
 * Headers: 
 *   - Content-Type: application/json
 *   - Authorization: Bearer <access_token> (auto-attached via Axios interceptor)
 * Request Payload:
 * {
 *   "query": "user query content...",
 *   "user_id": "user_id_string"
 * }
 */
export const queryAssistant = async (userId, query) => {
  try {
    const response = await api.post("/api/v1/documents/query", {
      user_id: userId,
      query: query,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.message || "Failed to query assistant";
    throw new Error(message);
  }
};
