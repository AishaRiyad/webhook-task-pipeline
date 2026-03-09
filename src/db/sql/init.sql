CREATE TABLE IF NOT EXISTS pipelines (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    source_key VARCHAR(255) NOT NULL UNIQUE,
    webhook_secret VARCHAR(255) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline_links (
    id UUID PRIMARY KEY,
    source_pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    target_pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT pipeline_links_unique UNIQUE (source_pipeline_id, target_pipeline_id),
    CONSTRAINT pipeline_links_no_self_loop CHECK (source_pipeline_id <> target_pipeline_id)
);

CREATE TABLE IF NOT EXISTS pipeline_subscribers (
    id UUID PRIMARY KEY,
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    target_url TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY,
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    headers JSONB NOT NULL DEFAULT '{}'::jsonb,
    payload JSONB NOT NULL,
    received_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY,
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    webhook_event_id UUID NOT NULL REFERENCES webhook_events(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    available_at TIMESTAMP NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    failed_at TIMESTAMP NULL,
    result_payload JSONB NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_deliveries (
    id UUID PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    subscriber_id UUID NOT NULL REFERENCES pipeline_subscribers(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    next_retry_at TIMESTAMP NULL,
    last_response_status INT NULL,
    last_error TEXT NULL,
    delivered_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_attempt_logs (
    id UUID PRIMARY KEY,
    delivery_id UUID NOT NULL REFERENCES job_deliveries(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL,
    request_payload JSONB NOT NULL,
    response_status INT NULL,
    response_body TEXT NULL,
    error_message TEXT NULL,
    attempted_at TIMESTAMP NOT NULL DEFAULT NOW()
);