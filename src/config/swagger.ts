import swaggerJsdoc from "swagger-jsdoc";


const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Webhook-Driven Task Processing Pipeline API",
      version: "1.0.0",
      description:
        "API documentation for the webhook-driven task processing pipeline project",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        RegisterInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              example: "aisha@example.com",
            },
            password: {
              type: "string",
              example: "12345678",
            },
          },
        },
        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              example: "aisha@example.com",
            },
            password: {
              type: "string",
              example: "12345678",
            },
          },
        },
        CreatePipelineInput: {
          type: "object",
          required: ["name", "action_type"],
          properties: {
            name: {
              type: "string",
              example: "Orders Enricher",
            },
            action_type: {
              type: "string",
              enum: ["transform", "filter", "enrich"],
              example: "enrich",
            },
            action_config: {
              type: "object",
              example: {},
            },
            subscribers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  target_url: {
                    type: "string",
                    example: "http://localhost:3000/subscriber-order-service",
                  },
                },
              },
            },
          },
        },
        CreateSubscriberInput: {
          type: "object",
          required: ["target_url"],
          properties: {
            target_url: {
              type: "string",
              example: "http://localhost:3000/subscriber-notification-service",
            },
          },
        },
        CreatePipelineLinkInput: {
          type: "object",
          required: ["target_pipeline_id"],
          properties: {
            target_pipeline_id: {
              type: "string",
              example: "4c7dbf3e-f0a4-45f7-a8e6-123456789abc",
            },
          },
        },
        MetricsResponse: {
          type: "object",
          properties: {
            metrics: {
              type: "object",
              properties: {
                pipelines: { type: "number", example: 2 },
                jobs_processed: { type: "number", example: 5 },
                jobs_failed: { type: "number", example: 1 },
                deliveries_sent: { type: "number", example: 4 },
                deliveries_failed: { type: "number", example: 1 },
                pending_retries: { type: "number", example: 0 },
              },
            },
            timestamp: {
              type: "string",
              example: "2026-03-10T12:00:00.000Z",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/modules/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);