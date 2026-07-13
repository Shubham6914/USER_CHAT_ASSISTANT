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

/**
 * =====================================================
 * BACKEND INTEGRATION: Streamed Query Document/Assistant
 * =====================================================
 * API Endpoint: POST http://127.0.0.1:8000/api/v1/documents/query
 * Headers: 
 *   - Accept: text/event-stream
 *   - Content-Type: application/json
 *   - Authorization: Bearer <access_token> (manually read from localStorage)
 * Request Payload:
 * {
 *   "query": "user query content...",
 *   "user_id": "user_id_string"
 * }
 */
export const queryAssistantStream = async (userId, query, onChunk, onSources, onDone, onError) => {
  try {
    const user = localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : null;
      
    const headers = {
      "Content-Type": "application/json",
      "Accept": "text/event-stream",
    };

    if (user && user.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }

    const response = await fetch("http://127.0.0.1:8000/api/v1/documents/query", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        user_id: userId,
        query: query,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      // Decode chunk
      const chunkText = decoder.decode(value, { stream: true });

      // Detect raw text stream vs formatted SSE stream. If there is no "data:" prefix
      // and it does not start with JSON, yield the token instantly to the UI.
      if (!chunkText.includes("data:") && !chunkText.trim().startsWith("{")) {
        onChunk(chunkText);
        continue;
      }

      buffer += chunkText;

      // Split SSE messages by single newline (\n) for instant line-by-line parse
      const lines = buffer.split("\n");
      buffer = lines.pop(); // Keep incomplete chunk in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Strip "data: " prefix if present (standard SSE format)
        let dataStr = trimmed;
        if (trimmed.startsWith("data:")) {
          dataStr = trimmed.slice(5).trim();
        }

        // Check if stream is done
        if (dataStr === "[DONE]") {
          continue;
        }

        try {
          if (dataStr.includes("{") && dataStr.includes("}")) {
            const parsed = JSON.parse(dataStr);
            
            // Extract sources from multiple potential backend payload structures
            let extractedSources = 
              (parsed.type === "sources" && parsed.sources) ||
              parsed.retrieved_docs ||
              parsed.sources;

            if (!extractedSources) {
              const toolRes = parsed.tool_response?.data || parsed.tool_response;
              if (toolRes) {
                if (Array.isArray(toolRes.results?.results)) {
                  extractedSources = toolRes.results.results;
                } else if (Array.isArray(toolRes.results)) {
                  extractedSources = toolRes.results;
                }
              }
            }

            if (!extractedSources) {
              if (Array.isArray(parsed.results?.results)) {
                extractedSources = parsed.results.results;
              } else if (Array.isArray(parsed.results)) {
                extractedSources = parsed.results;
              }
            }

            if (extractedSources && Array.isArray(extractedSources)) {
              if (onSources) onSources(extractedSources);
              continue;
            }

            // Otherwise check for text chunk
            const textChunk = parsed.response || parsed.text || parsed.answer || parsed.delta;
            if (textChunk !== undefined) {
              onChunk(textChunk);
              continue;
            }
          }
        } catch (e) {
          // Fallback to raw text below
        }

        // Raw text chunk
        onChunk(dataStr);
      }
    }

    // Process any remaining text in buffer
    if (buffer.trim()) {
      let dataStr = buffer.trim();
      if (dataStr.startsWith("data:")) {
        dataStr = dataStr.slice(5).trim();
      }
      if (dataStr !== "[DONE]") {
        onChunk(dataStr);
      }
    }

    if (onDone) onDone();
  } catch (error) {
    if (onError) onError(error);
  }
};
