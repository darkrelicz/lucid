/**
 * Lucid API Client — typed fetch wrapper for the backend API.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ── Types ──────────────────────────────────────────────────────

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type StepType = 'plan' | 'execute' | 'observe' | 'reflect' | 'correct';
export type HallucinationType = 'none' | 'intrinsic' | 'extrinsic' | 'fabricated_citation' | 'reasoning_error' | 'tool_misuse' | 'self_contradiction';
export type Severity = 'none' | 'minor' | 'moderate' | 'critical';
export type ClaimType = 'factual' | 'numerical' | 'citation' | 'reasoning' | 'opinion';

export interface RunSummary {
  id: string;
  goal: string;
  model: string;
  status: RunStatus;
  total_steps: number;
  total_tokens: number;
  total_cost: number;
  confidence_score: number | null;
  hallucination_count: number;
  created_at: string;
  completed_at: string | null;
}

export interface TraceStep {
  id: string;
  run_id: string;
  step_number: number;
  step_type: StepType;
  input_text: string;
  output_text: string;
  summary: string;
  model: string;
  prompt_messages: Record<string, unknown>[];
  response_raw: string;
  tokens_prompt: number;
  tokens_completion: number;
  cost: number;
  latency_ms: number;
  tool_calls: Record<string, unknown>[];
  agent_state: Record<string, unknown>;
  confidence_score: number | null;
  created_at: string;
}

export interface RunDetail extends RunSummary {
  steps: TraceStep[];
  error_message: string | null;
}

export interface VerificationResult {
  id: string;
  method: string;
  verdict: string;
  confidence: number;
  evidence: Record<string, unknown>;
  explanation: string;
  created_at: string;
}

export interface Claim {
  id: string;
  run_id: string;
  step_id: string;
  text: string;
  claim_type: ClaimType;
  source_span: string;
  hallucination_type: HallucinationType;
  severity: Severity;
  confidence_score: number;
  explanation: string;
  verifications: VerificationResult[];
  created_at: string;
}

export interface HallucinationSummary {
  run_id: string;
  total_claims: number;
  hallucinated_claims: number;
  hallucination_rate: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
  overall_confidence: number;
  claims: Claim[];
}

export interface RunCreate {
  goal: string;
  model?: string;
  config?: Record<string, unknown>;
}

// ── API Client ─────────────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API Error: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Runs
  createRun: (data: RunCreate) =>
    request<RunSummary>('/api/runs', { method: 'POST', body: JSON.stringify(data) }),

  listRuns: (params?: { model?: string; status?: RunStatus; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.model) query.set('model', params.model);
    if (params?.status) query.set('status_filter', params.status);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const qs = query.toString();
    return request<RunSummary[]>(`/api/runs${qs ? `?${qs}` : ''}`);
  },

  getRun: (id: string) =>
    request<RunDetail>(`/api/runs/${id}`),

  getRunSteps: (id: string, limit = 100, offset = 0) =>
    request<TraceStep[]>(`/api/runs/${id}/steps?limit=${limit}&offset=${offset}`),

  deleteRun: (id: string) =>
    request<void>(`/api/runs/${id}`, { method: 'DELETE' }),

  // Hallucinations
  triggerAnalysis: (runId: string) =>
    request<{ status: string; run_id: string }>(`/api/runs/${runId}/analyze`, { method: 'POST' }),

  getHallucinations: (runId: string) =>
    request<HallucinationSummary>(`/api/runs/${runId}/hallucinations`),

  getClaims: (runId: string) =>
    request<Claim[]>(`/api/runs/${runId}/claims`),

  // Health
  health: () =>
    request<{ status: string; version: string; services: Record<string, string> }>('/health'),
};
