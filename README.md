Webhook-Driven Task Processing Pipeline

A full-stack webhook processing platform that receives signed webhook events, queues them for asynchronous background processing, applies configurable pipeline actions, and delivers the results to registered subscriber endpoints.

The project includes:

-a modular TypeScript backend
-PostgreSQL-backed job queue
-separate processing and delivery workers
-retry logic for jobs and deliveries
-pipeline chaining with cycle detection
-a React dashboard for monitoring and management
-Docker Compose setup
-GitHub Actions CI
-automated tests

----------------------------------------------------------------------

Table of Contents

-Overview
-Core Features
-Architecture
-End-to-End Processing Flow
-Tech Stack
-Project Structure
-Database Design
-Key Technical Decisions
-Reliability and Failure Handling
-Security
-API Endpoints
-Request/Response Examples
-Running with Docker
-Running Locally Without Docker
-Testing
-CI Pipeline
-Frontend Features
-Operational Notes
-Future Improvements

----------------------------------------------------------------------

Overview

This system is designed to solve a common reliability problem in webhook-based systems: external services should be able to send events quickly, while internal processing and downstream deliveries should happen safely in the background.

Instead of processing an incoming webhook synchronously, the backend:

1-verifies the webhook signature
2-stores the event in the database
3-creates a background job
4-returns 202 Accepted
5-lets workers process and deliver the result asynchronously

Each user can create pipelines. A pipeline consists of:

-a unique webhook source URL
-a processing action
-one or more subscriber endpoints

After processing, the resulting payload is delivered to subscribers with retry logic and detailed delivery attempt logging.

The system also supports pipeline chaining, where the output of one pipeline can trigger another pipeline.

----------------------------------------------------------------------

Core Features


Pipeline Management

-create pipelines
-list pipelines
-get one pipeline
-delete pipelines
-add and remove subscribers
-create and remove links between pipelines


Webhook Processing

-signed webhook ingestion
-asynchronous processing
-event persistence
-job creation


Supported Processing Actions

-enrich
-transform
-filter
-deduplicate
-running_sum


Job System

-PostgreSQL-backed job queue
-background job worker
-job retry with exponential backoff
-job status tracking


Delivery System

-separate delivery worker
-multiple subscribers per pipeline
-delivery retry with exponential backoff
-delivery attempt logs
-failure notifications


Monitoring

-jobs page
-job details page
-metrics dashboard
-notifications page
-subscribers page
-chaining page
-webhook tester page


Infrastructure

-Docker Compose
-health checks
-CI pipeline
-frontend and backend tests


----------------------------------------------------------------------

Architecture

The system is split into five main runtime components:

1-API Server
2-PostgreSQL Database
3-Job Worker
4-Delivery Worker
5-Frontend Dashboard


High-level flow:

External Sender
   |
   v
POST /webhooks/:sourceKey
   |
   v
API Server
   |
   |-- store webhook event
   |-- create job
   |
   v
Jobs table (PostgreSQL queue)
   |
   v
Job Worker
   |
   |-- load webhook event
   |-- apply pipeline action
   |-- update job result
   |-- create delivery tasks
   |-- create chained jobs (if linked pipelines exist)
   |
   v
Job Deliveries table
   |
   v
Delivery Worker
   |
   |-- send result to subscriber URLs
   |-- retry on failure
   |-- store delivery attempt logs
   |
   v
Subscriber Endpoints

----------------------------------------------------------------------

End-to-End Processing Flow


1. User creates a pipeline

The user creates a pipeline through the dashboard or API.


A pipeline includes:

-pipeline name
-action type
-action configuration
-optional subscriber URLs


The backend generates:

-source_key
-webhook_secret

These are used for webhook ingestion and signature verification.



2. External system sends a webhook

Webhook endpoint:
POST /webhooks/sourceKey

The request must include:
-x-webhook-timestamp
-x-webhook-signature

The backend verifies the signature using HMAC SHA-256 and the pipeline's secret.



3. Backend stores the event and queues a job


If the signature is valid:

-the payload is stored in webhook_events
-a new row is inserted into jobs
-the API returns 202 Accepted


This keeps webhook ingestion fast and safe.




4. Job worker processes the job


The job worker:

-selects the next available pending job using row locking
-loads the webhook event
-loads the pipeline configuration
-applies the configured action
-stores the final result_payload
-creates delivery rows for subscribers
-creates chained jobs for downstream pipelines




5. Delivery worker sends the processed result


For each delivery:

-send HTTP POST to subscriber URL
-record the attempt
-update delivery status
-retry if needed
-mark final failure after max attempts




6. User monitors everything in the dashboard


The frontend dashboard allows the user to:

-inspect pipeline definitions
-inspect jobs
-inspect delivery attempts
-inspect metrics
-receive notifications
-send test webhooks directly


----------------------------------------------------------------------

Tech Stack


Backend

-Node.js
-Express
-TypeScript
-PostgreSQL
-Zod
-JWT
-bcryptjs
-Swagger


Frontend

-React
-TypeScript
-Vite
-React Router
-Framer Motion
-Lucide Icons


DevOps / Tooling

-Docker
-Docker Compose
-GitHub Actions
-ESLint
-Prettier
-Vitest
-Testing Library


----------------------------------------------------------------------

Project Structure

.
├── backend
│   ├── src
│   │   ├── config
│   │   │   └── swagger.ts
│   │   ├── db
│   │   │   ├── database.ts
│   │   │   ├── init.ts
│   │   │   ├── initDb.ts
│   │   │   └── sql/init.sql
│   │   ├── modules
│   │   │   ├── auth
│   │   │   ├── deliveries
│   │   │   ├── jobs
│   │   │   ├── metrics
│   │   │   ├── notifications
│   │   │   ├── pipelines
│   │   │   ├── subscribers
│   │   │   └── webhooks
│   │   ├── shared
│   │   │   ├── middleware
│   │   │   └── utils
│   │   ├── worker
│   │   │   ├── worker.ts
│   │   │   └── deliveryWorker.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend
│   ├── src
│   │   ├── api
│   │   ├── components
│   │   ├── pages
│   │   ├── test
│   │   ├── types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.ts
│
├── .github/workflows
│   └── ci.yml
│
└── docker-compose.yml


----------------------------------------------------------------------

Database Design

The database is not just used for persistence. It is also used as a lightweight queueing layer.


Main Tables


1-users
Stores registered users.

Important fields:
-id
-email
-password_hash


2-refresh_tokens
Stores hashed refresh tokens.

Important fields:
-id
-user_id
-token_hash
-expires_at


3-pipelines
Stores pipeline definitions.

Important fields:
-id
-user_id
-name
-source_key
-webhook_secret
-action_type
-action_config
-is_active


4-pipeline_links
Stores pipeline chaining links.

Important fields:
-source_pipeline_id
-target_pipeline_id

Constraints:
-unique source-target pair
-no self-loop at database level


5-pipeline_subscribers
Stores subscriber endpoints.

Important fields:
-pipeline_id
-target_url
-is_active


6-webhook_events
Stores all received webhook requests.

Important fields:
-pipeline_id
-headers
-payload


7-jobs
Acts as the processing queue.

Important fields:
-pipeline_id
-webhook_event_id
-status
-attempts
-max_attempts
-available_at
-started_at
-completed_at
-failed_at
-result_payload
-error_message


8-job_deliveries
Stores subscriber delivery tasks.

Important fields:
-subscriber_id
-status
-attempts
-max_attempts
-next_retry_at
-last_response_status
-last_error
-delivered_at


9-delivery_attempt_logs
Stores detailed delivery attempt history.

Important fields:
-delivery_id
-attempt_number
-request_payload
-response_status
-response_body
-error_message
-attempted_at


10-pipeline_aggregates
Stores state for aggregation-based processing such as running_sum.

Important fields:
-pipeline_id
-group_key
-aggregate_value


11-system_notifications
Stores notifications for failed jobs and failed deliveries.

Important fields:
-user_id
-type
-title
-message
-payload
-is_read


----------------------------------------------------------------------

Key Technical Decisions

1. PostgreSQL as queue storage
Instead of introducing RabbitMQ, Redis Streams, or another message broker, the project uses PostgreSQL as a lightweight durable queue.

Why
-fewer moving parts
-easier local setup
-simpler Docker orchestration
-strong persistence guarantees
-transactional consistency

Tradeoff
At very large scale, a dedicated message broker may be more suitable. For this project scope, PostgreSQL is a good balance between simplicity and reliability.



2. Separate job worker and delivery worker

The project intentionally separates:
-job processing
-delivery processing


Why

These two stages represent different concerns:
-pipeline transformation logic
-outbound HTTP delivery reliability

This improves:
-separation of concerns
-observability
-independent scaling
-clearer error boundaries



3. Asynchronous webhook handling
Webhook requests return immediately after persistence and job creation.

Why
-faster response to external senders
-prevents long webhook request times
-isolates downstream failures from the ingestion path

Returned status:
202 Accepted



4. Transactional critical paths
Critical multi-query operations are wrapped in database transactions.

Examples:
-creating pipeline + initial subscribers
-creating pipeline links
-completing a job + creating deliveries + creating chained jobs

Why
This prevents partial state updates and improves consistency.



5. Pipeline chaining with cycle detection
Pipelines can trigger downstream pipelines, but cycle detection prevents infinite loops.

Why
Chaining adds flexibility and demonstrates a richer processing model than a single-step pipeline



6. Retry logic for both jobs and deliveries

The project supports retry at two different layers:
-processing retries for failed jobs
-delivery retries for subscriber failures

Why

Failures can happen during:
-processing logic
-outbound network delivery


----------------------------------------------------------------------

Reliability and Failure Handling

Reliability was a major design goal.


Job Retry

If processing fails:
-attempts are incremented
-next retry is scheduled using exponential backoff
-after max attempts, the job is marked failed


Delivery Retry

If subscriber delivery fails:
-the delivery attempt is logged
-next retry time is scheduled
-after max attempts, the delivery is marked failed


Attempt Logging

Each delivery attempt stores:
-attempt number
-request payload
-HTTP status
-response body
-error message
-timestamp



Failure Notifications

The system creates notifications when:
-a job permanently fails
-a delivery permanently fails



Transactions
Critical operations are grouped in database transactions to avoid partial writes.



Row Locking for Jobs

The job worker uses database row locking to safely claim work.
Pattern used: FOR UPDATE SKIP LOCKED

This prevents multiple workers from processing the same job.


----------------------------------------------------------------------

Security


Authentication
Protected endpoints use JWT access tokens.

Supported auth flow:
-register
-login
-get current user
-refresh token
-logout



Password Hashing
Passwords are hashed using bcrypt.



Refresh Token Storage
Refresh tokens are stored hashed in the database, not as raw values.



Webhook Signature Verification
Each pipeline has its own webhook_secret.

Incoming webhooks must include:
-x-webhook-timestamp
-x-webhook-signature


Signature verification uses:
-HMAC SHA-256
-timing-safe comparison
-timestamp tolerance to reduce replay risk



Rate Limiting
Webhook ingestion is protected by a rate-limiting middleware.

Current implementation is in-memory, which is suitable for this project scope.


----------------------------------------------------------------------

API Endpoints


Base URL:
http://localhost:3000


Swagger UI:
http://localhost:3000/api-docs



Auth

Register
POST /auth/register

Request body:
{
  "email": "aisha@example.com",
  "password": "12345678"
}


Response:
{
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "aisha@example.com"
    },
    "accessToken": "jwt",
    "refreshToken": "jwt"
  }
}



Login
POST /auth/login

Request body:
{
  "email": "aisha@example.com",
  "password": "12345678"
}



Refresh Token
POST /auth/refresh

Request body:
{
  "refreshToken": "jwt"
}



Logout
POST /auth/logout

Request body:
{
  "refreshToken": "jwt"
}



Current User
GET /auth/me
Authorization: Bearer <access_token>

------------------------------------------------

Pipelines

Create Pipeline
POST /pipelines
Authorization: Bearer <access_token>


Example request:
{
  "name": "Orders Running Sum",
  "action_type": "running_sum",
  "action_config": {
    "group_by_field": "customerId",
    "value_field": "amount",
    "target_field": "running_total"
  },
  "subscribers": [
    {
      "target_url": "http://localhost:3000/subscriber-order-service"
    }
  ]
}


Supported action_type values:
-transform
-filter
-enrich
-deduplicate
-running_sum


Action config examples

Transform
{
  "fields": ["orderId", "status", "amount"]
}


Filter
{
  "field": "status",
  "value": "created"
}


Enrich
{}


Deduplicate
{
  "id_field": "eventId"
}


Running Sum
{
  "group_by_field": "customerId",
  "value_field": "amount",
  "target_field": "running_total"
}



Get All Pipelines
GET /pipelines
Authorization: Bearer <access_token>



Get One Pipeline
GET /pipelines/:id
Authorization: Bearer <access_token>


Delete Pipeline
DELETE /pipelines/:id
Authorization: Bearer <access_token>


----------------------------------------------

Pipeline Links

Create Pipeline Link
POST /pipelines/:id/links
Authorization: Bearer <access_token>


Request body:
{
  "target_pipeline_id": "uuid"
}


This creates a link:
source pipeline (:id) -> target pipeline

Cycle creation is rejected.



Get Pipeline Links
GET /pipelines/:id/links
Authorization: Bearer <access_token>


Delete Pipeline Link
DELETE /pipelines/:id/links/:targetPipelineId
Authorization: Bearer <access_token>


------------------------------------------------

Subscribers


Add Subscriber
POST /pipelines/:id/subscribers
Authorization: Bearer <access_token>


Request body:
{
  "target_url": "http://localhost:3000/subscriber-notification-service"
}



Get Subscribers
GET /pipelines/:id/subscribers
Authorization: Bearer <access_token>



Delete Subscriber
DELETE /pipelines/:id/subscribers/:subscriberId
Authorization: Bearer <access_token>


---------------------------------------------

Webhooks

Send Webhook
POST /webhooks/:sourceKey


Required headers:
x-webhook-timestamp: 1710000000
x-webhook-signature: <hex_hmac_signature>
Content-Type: application/json


Example body:
{
  "eventId": "evt-1001",
  "orderId": "ORD-1002",
  "status": "created",
  "amount": 200,
  "customerId": "cust-1"
}


Success response:
{
  "message": "Webhook accepted and queued for processing",
  "data": {
    "pipeline_id": "uuid",
    "webhook_event_id": "uuid",
    "job_id": "uuid",
    "job_status": "pending"
  }
}


------------------------------------------

Jobs

Get Jobs
GET /jobs
Authorization: Bearer <access_token>

Returns all jobs for the authenticated user's pipelines.



Get One Job
GET /jobs/:id
Authorization: Bearer <access_token>

Returns:
-job details
-deliveries
-attempt logs



Get Job Deliveries
GET /jobs/:id/deliveries
Authorization: Bearer <access_token>


-------------------------------------------------

Metrics

Get Metrics
GET /metrics
Authorization: Bearer <access_token>


Returns metrics such as:
-total pipelines
-processed jobs
-failed jobs
-successful deliveries
-failed deliveries
-pending retries


---------------------------------------------------

Notifications


Get Notifications
GET /notifications
Authorization: Bearer <access_token>



Get Unread Notifications Count
GET /notifications/unread-count
Authorization: Bearer <access_token>



Mark Notification as Read
PATCH /notifications/:id/read
Authorization: Bearer <access_token>


---------------------------------------------------

Health Check

Health Endpoint
GET /health

Used to verify API and database connectivity.


---------------------------------------------------

Demo Subscriber Endpoints

These are included in the backend for local testing:
POST /subscriber-order-service
POST /subscriber-analytics-service
POST /subscriber-notification-service


These endpoints print received payloads and respond successfully, which makes local testing easier.


----------------------------------------------------

Request/Response Examples

Example: Create pipeline
curl -X POST http://localhost:3000/pipelines \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Orders Enricher",
    "action_type": "enrich",
    "action_config": {},
    "subscribers": [
      {
        "target_url": "http://localhost:3000/subscriber-order-service"
      }
    ]
  }'


  Example: Send signed webhook
  You can use the built-in Webhook Tester page in the frontend, or generate a signature manually using the pipeline secret.


  The frontend includes a Webhook Tester page that:
  -accepts source key
  -accepts webhook secret
  -generates HMAC signature
  -sends the webhook request

  This is the easiest way to test webhook ingestion manually.


  -------------------------------------------------------------------

  Running with Docker

  Prerequisites
  -Docker
  -Docker Compose


  Start the entire system

  From the repository root:
  docker compose up --build


  This starts:
  -PostgreSQL
  -database initialization service
  -API server
  -job worker
  -delivery worker
  -frontend


  URLs
  Frontend: http://localhost:5173
  API: http://localhost:3000
  Swagger Docs: http://localhost:3000/api-docs



  Docker services

  The Compose file includes:
  -postgres
  -db_init
  -api
  -job_worker
  -delivery_worker
  -frontend


  The backend containers run compiled code, while local non-Docker development uses dev scripts.


  -------------------------------------------------------------------

  Running Locally Without Docker

  1. Start PostgreSQL
  Make sure PostgreSQL is running locally and create a database matching your backend env variables.


  2. Backend setup
  
  Inside backend:
  npm install

  Create .env with values like:
  PORT=3000
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=webhook_pipeline
  DB_USER=postgres
  DB_PASSWORD=postgres

  JWT_ACCESS_SECRET=access_secret
  JWT_REFRESH_SECRET=refresh_secret
  JWT_ACCESS_EXPIRES_IN=15m
  JWT_REFRESH_EXPIRES_IN=7d

  WEBHOOK_RATE_LIMIT_WINDOW_MS=60000
  WEBHOOK_RATE_LIMIT_MAX_REQUESTS=10

  WORKER_POLL_INTERVAL_MS=2000
  DELIVERY_WORKER_POLL_INTERVAL_MS=2000

  FAILURE_NOTIFICATION_URL=http://localhost:3000/subscriber-notification-service



  Initialize tables:
  npm run db:init



  Run API server:
  npm run dev


  Run job worker in another terminal:
  npm run worker


  Run delivery worker in another terminal:
  npm run worker:delivery



  3. Frontend setup

  Inside frontend:
  npm install
  npm run dev


  Frontend default URL:
  http://localhost:5173


  -------------------------------------------------------------------

  Testing

  The project includes automated tests for both backend and frontend.


  Backend Tests
  Backend uses Vitest.


  Covered areas:
  -webhook signature verification
  -rate limiting middleware
  -retry backoff helper
  -pipeline cycle detection


  Run backend tests:
  cd backend
  npm test

  
  Other useful commands:
  npm run lint:ci
  npm run format
  npm run format:check
  npm run typecheck
  npm run build




  Frontend Tests

  Frontend uses:
  -Vitest
  -Testing Library
  -jsdom


  Covered areas:
  -protected route behavior
  -component rendering


  Run frontend tests:
  cd frontend
  npm test


  Other useful commands:
  npm run lint:ci
  npm run format
  npm run format:check
  npm run typecheck
  npm run build


  -------------------------------------------------------------------

  CI Pipeline

  GitHub Actions runs checks for both backend and frontend.


  Backend CI steps
  install dependencies
  format check
  lint
  typecheck
  tests
  build



  Frontend CI steps
  install dependencies
  format check
  lint
  typecheck
  tests
  build


  Docker validation

  CI also builds:
  backend Docker image
  frontend Docker image


  This ensures the project is both code-valid and container-ready.

  -------------------------------------------------------------------

  Frontend Features

  The frontend dashboard is not just decorative. It is directly connected to the API and provides operational visibility.


  Pages
  Login
  Signup
  Dashboard
  Pipelines
  Jobs
  Job Details
  Subscribers
  Pipeline Chaining
  Webhook Tester
  Metrics
  Notifications


  Main UI Capabilities
  -create pipelines with action configuration
  -delete pipelines
  -add and delete subscribers
  -create and remove links between pipelines
  -view job list
  -inspect delivery logs
  -read notifications
  -view metrics
  -test signed webhooks from the browser


  -------------------------------------------------------------------

  Operational Notes

  Local testing strategy

  For easier demo and manual validation, the backend includes mock subscriber endpoints:

  /subscriber-order-service
  /subscriber-analytics-service
  /subscriber-notification-service


  This allows you to:
  -create pipelines with real subscriber URLs
  -send test webhooks
  -observe worker processing
  -inspect delivery logs without needing external services


  Frontend Webhook Tester
  The Webhook Tester page computes HMAC signatures in the browser using the provided webhook secret. This was intentionally added to make manual end-to-end testing easier.


  Rate Limiting Scope
  Webhook rate limiting is currently implemented in-memory. This is appropriate for the current project scope but would likely move to Redis in a distributed production environment.

  -------------------------------------------------------------------

  Future Improvements

  Possible future enhancements include:
  -distributed rate limiting with Redis
  -delivery claiming/locking similar to job claiming
  -dead-letter queue support
  -idempotency keys for webhook ingestion
  -stronger metrics and tracing
  -WebSocket/live dashboard updates
  -pipeline templates
  -role-based access control
  -dedicated message broker for very large scale

  -------------------------------------------------------------------

  Summary

  This project implements a complete webhook-driven asynchronous processing platform with:

  -signed webhook ingestion
  -PostgreSQL-backed job queue
  -processing and delivery workers
  -retry logic
  -delivery logs
  -pipeline chaining
  -notifications
  -metrics
  -full-stack dashboard
  -Docker setup
  -CI
  -tests

 
 It was designed to balance:
 -reliability
 -modularity
 -simplicity of setup
 -visibility into system behavior
























