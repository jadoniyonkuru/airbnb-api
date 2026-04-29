import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Airbnb API",
      version: "1.0.0",
      description:
        "A simplified Airbnb-like REST API with authentication, listings, bookings, and file uploads.",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
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
          required: ["email", "password", "username"],
          properties: {
            email: {
              type: "string",
              example: "john@example.com",
            },
            password: {
              type: "string",
              example: "password123",
            },
            username: {
              type: "string",
              example: "john_doe",
            },
          },
        },
        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              example: "john@example.com",
            },
            password: {
              type: "string",
              example: "password123",
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "user-123",
            },
            email: {
              type: "string",
              example: "john@example.com",
            },
            username: {
              type: "string",
              example: "john_doe",
            },
            profile: {
              type: "object",
              properties: {
                firstName: { type: "string" },
                lastName: { type: "string" },
                bio: { type: "string" },
                avatar: { type: "string" },
              },
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            token: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            user: {
              $ref: "#/components/schemas/User",
            },
          },
        },
        Booking: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            listingId: {
              type: "string",
              example: "listing-123",
            },
            userId: {
              type: "string",
              example: "user-456",
            },
            checkInDate: {
              type: "string",
              format: "date",
              example: "2026-05-01",
            },
            checkOutDate: {
              type: "string",
              format: "date",
              example: "2026-05-05",
            },
            totalPrice: {
              type: "number",
              example: 500,
            },
            status: {
              type: "string",
              enum: ["pending", "confirmed", "cancelled"],
              example: "confirmed",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        CreateBookingInput: {
          type: "object",
          required: ["listingId", "checkInDate", "checkOutDate"],
          properties: {
            listingId: {
              type: "string",
              example: "listing-123",
            },
            checkInDate: {
              type: "string",
              format: "date",
              example: "2026-05-01",
            },
            checkOutDate: {
              type: "string",
              format: "date",
              example: "2026-05-05",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Error message",
            },
            error: {
              type: "string",
            },
          },
        },
        Listing: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "listing-123",
            },
            title: {
              type: "string",
              example: "Beautiful apartment in downtown",
            },
            description: {
              type: "string",
              example: "A cozy and spacious apartment",
            },
            price: {
              type: "number",
              example: 100,
            },
            location: {
              type: "string",
              example: "New York, NY",
            },
            amenities: {
              type: "array",
              items: { type: "string" },
              example: ["WiFi", "Kitchen", "Gym"],
            },
            images: {
              type: "array",
              items: { type: "string" },
            },
            hostId: {
              type: "string",
              example: "user-123",
            },
            maxGuests: {
              type: "integer",
              example: 4,
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        CreateListingInput: {
          type: "object",
          required: ["title", "description", "price", "location", "maxGuests"],
          properties: {
            title: {
              type: "string",
              example: "Beautiful apartment in downtown",
            },
            description: {
              type: "string",
              example: "A cozy and spacious apartment",
            },
            price: {
              type: "number",
              example: 100,
            },
            location: {
              type: "string",
              example: "New York, NY",
            },
            amenities: {
              type: "array",
              items: { type: "string" },
              example: ["WiFi", "Kitchen", "Gym"],
            },
            maxGuests: {
              type: "integer",
              example: 4,
            },
          },
        },
      },
    },
  },
  // swagger-jsdoc scans these files for @swagger comments
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);
export function setupSwagger(app: Express): void {
  // serve swagger UI at /api-docs
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // expose raw JSON spec at /api-docs.json
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log(" Swagger docs available at http://localhost:3000/api-docs");
}