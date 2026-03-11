export type Pipeline = {
  id: string;
  name: string;
  source_key: string;
  action_type: "transform" | "filter" | "enrich" | string;
  action_config?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

export type Job = {
  id: string;
  pipeline_id: string;
  webhook_event_id: string;
  status: "pending" | "processing" | "completed" | "failed" | string;
  attempts: number;
  max_attempts?: number;
  created_at: string;
  completed_at?: string | null;
  failed_at?: string | null;
};

export type PipelineLink = {
  id: string;
  source_pipeline_id: string;
  target_pipeline_id: string;
  target_pipeline_name?: string;
  target_pipeline_action_type?: string;
  target_pipeline_is_active?: boolean;
  created_at: string;
};

export type LoginResponse = {
  message?: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    user?: {
      id: string;
      email: string;
    };
  };
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
  };
};

export type Subscriber = {
  id: string;
  pipeline_id: string;
  target_url: string;
  is_active?: boolean;
  created_at: string;
};

export type JobDelivery = {
  id: string;
  job_id: string;
  subscriber_id: string;
  status: string;
  attempts: number;
  max_attempts: number;
  next_retry_at?: string | null;
  last_response_status?: number | null;
  last_error?: string | null;
  delivered_at?: string | null;
  created_at: string;
  target_url?: string;
};

export type DeliveryAttemptLog = {
  id: string;
  delivery_id: string;
  attempt_number: number;
  request_payload: Record<string, unknown>;
  response_status?: number | null;
  response_body?: string | null;
  error_message?: string | null;
  attempted_at: string;
  subscriber_id?: string;
};

export type JobDetailsResponse = {
  job: Job;
  deliveries: JobDelivery[];
  attempts: DeliveryAttemptLog[];
};

export type MetricsResponse = {
  metrics: {
    pipelines: number;
    jobs_processed: number;
    jobs_failed: number;
    deliveries_sent: number;
    deliveries_failed: number;
    pending_retries: number;
  };
  timestamp: string;
};

export type SystemNotification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  payload: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
};