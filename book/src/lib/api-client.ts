/**
 * API Client for Docusaurus-Embedded Features
 *
 * BROWSER-SAFE: No Node.js APIs, no process.env
 * Handles all communication with FastAPI backend
 * Graceful error handling - never crashes the app
 */

// ==================== CONFIGURATION ====================

/**
 * Browser-safe API base URL detection
 * Priority: window.docusaurus config > fallback default
 */
function getApiBaseUrl(): string {
  // Only access window in browser environment
  if (typeof window === 'undefined') {
    return 'http://localhost:8000';
  }

  // Try to get from Docusaurus config (injected at build time)
  try {
    const docusaurusConfig = (window as any).docusaurus?.siteConfig?.customFields;
    if (docusaurusConfig?.DOCUSAURUS_API_URL) {
      return docusaurusConfig.DOCUSAURUS_API_URL;
    }
  } catch {
    // Silently fail and use default
  }

  // Fallback to localhost for development
  return 'http://localhost:8000';
}

const API_BASE = getApiBaseUrl();

// ==================== ERROR TYPES ====================

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isNetworkError: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ==================== AUTH HELPERS ====================

/**
 * Get auth token from localStorage (browser-safe)
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('authToken');
  } catch {
    return null;
  }
}

/**
 * Store auth token in localStorage (browser-safe)
 */
function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('authToken', token);
  } catch {
    // Storage may be full or disabled
  }
}

/**
 * Remove auth token from localStorage (browser-safe)
 */
export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('authToken');
  } catch {
    // Ignore errors
  }
}

// ==================== CORE API REQUEST ====================

/**
 * Make an API request with proper error handling
 * NEVER throws unhandled errors - always returns structured response
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  timeout: number = 30000
): Promise<T> {
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // Could not parse error response
      }

      throw new ApiError(errorMessage, response.status, false);
    }

    // Parse and return JSON response
    const data = await response.json();
    return data as T;

  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort/timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', undefined, true);
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(
        'Unable to connect to the AI service. Please check your connection.',
        undefined,
        true
      );
    }

    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Wrap unknown errors
    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      undefined,
      true
    );
  }
}

// ==================== AUTH APIs ====================

export interface SignupRequest {
  email: string;
  password: string;
  software_background: 'beginner' | 'intermediate' | 'advanced';
  hardware_background: 'none' | 'hobbyist' | 'professional';
}

export interface SigninRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    software_background: string;
    hardware_background: string;
  };
}

export async function signup(data: SignupRequest): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (response.access_token) {
    setAuthToken(response.access_token);
  }

  return response;
}

export async function signin(data: SigninRequest): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (response.access_token) {
    setAuthToken(response.access_token);
  }

  return response;
}

export async function signout(): Promise<void> {
  try {
    await apiRequest('/api/auth/signout', { method: 'POST' });
  } finally {
    clearAuthToken();
  }
}

export async function getCurrentUser(): Promise<AuthResponse['user']> {
  return apiRequest<AuthResponse['user']>('/api/auth/me');
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

// ==================== RAG/CHAT APIs ====================

export interface RAGQueryRequest {
  query: string;
  mode: 'full-book' | 'selected-text';
  selected_text?: string;
  conversation_id?: string;
}

export interface RAGQueryResponse {
  answer: string;
  sources: Array<{
    chapter: string;
    excerpt: string;
    relevance_score: number;
  }>;
  confidence: number;
  query_id: string;
}

/**
 * Send a query to the RAG chatbot
 * Returns structured response or throws ApiError
 */
export async function ragQuery(data: RAGQueryRequest): Promise<RAGQueryResponse> {
  return apiRequest<RAGQueryResponse>('/api/rag/query', {
    method: 'POST',
    body: JSON.stringify(data),
  }, 60000); // 60 second timeout for AI responses
}

/**
 * Check if the API is available (health check)
 * Returns true if API is reachable, false otherwise
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    await apiRequest<{ status: string }>('/api/health', {
      method: 'GET',
    }, 5000); // 5 second timeout for health check
    return true;
  } catch {
    return false;
  }
}

// ==================== PERSONALIZATION APIs ====================

export interface PersonalizeRequest {
  chapter_id: string;
  original_markdown: string;
}

export interface PersonalizeResponse {
  chapter_id: string;
  content: string;
  summary: string;
  adaptations: Array<{
    reason: string;
    content_preview: string;
    type: string;
  }>;
  software_level: string;
  hardware_level: string;
}

export async function personalizeContent(
  data: PersonalizeRequest
): Promise<PersonalizeResponse> {
  return apiRequest<PersonalizeResponse>('/api/personalize', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ==================== TRANSLATION APIs ====================

export interface TranslateRequest {
  chapter_id: string;
  markdown_content: string;
  target_language: 'en' | 'ur';
}

export interface TranslateResponse {
  translated_markdown: string;
}

export async function translateContent(
  data: TranslateRequest
): Promise<TranslateResponse> {
  return apiRequest<TranslateResponse>('/api/translate/urdu', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
