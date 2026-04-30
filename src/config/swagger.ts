import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import path from "path";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Airbnb API",
      version: "1.0.0",
      description: "A simplified Airbnb-like REST API with authentication, listings, bookings, and file uploads.",
    },
    servers: [
      {
        url: "http://localhost:3000/api/v1",
        description: "Development server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        }
      },
      schemas: {
        RegisterInput: {
          type: "object",
          required: ["name", "email", "username", "password", "phone"],
          properties: {
            name: { type: "string", example: "John Doe" },
            email: { type: "string", example: "john@mail.com" },
            username: { type: "string", example: "johndoe" },
            password: { type: "string", example: "password123" },
            phone: { type: "string", example: "1234567890" },
            role: { type: "string", enum: ["HOST", "GUEST"], example: "GUEST" }
          }
        },
        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", example: "john@mail.com" },
            password: { type: "string", example: "password123" }
          }
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", example: "uuid-123" },
            name: { type: "string", example: "John Doe" },
            email: { type: "string", example: "john@mail.com" },
            username: { type: "string", example: "johndoe" },
            phone: { type: "string", example: "1234567890" },
            role: { type: "string", enum: ["HOST", "GUEST", "ADMIN"] },
            avatar: { type: "string", nullable: true },
            bio: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        AuthResponse: {
          type: "object",
          properties: {
            token: { type: "string", example: "eyJhbGciOiJIUzI1NiJ9..." },
            user: { $ref: "#/components/schemas/User" }
          }
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Error message" }
          }
        },
        Listing: {
          type: "object",
          properties: {
            id: { type: "string", example: "uuid-123" },
            title: { type: "string", example: "Cozy Apartment" },
            description: { type: "string", example: "A nice place to stay" },
            location: { type: "string", example: "Kigali, Rwanda" },
            pricePerNight: { type: "number", example: 80 },
            guests: { type: "integer", example: 2 },
            type: { type: "string", enum: ["APARTMENT", "HOUSE", "VILLA", "CABIN"] },
            amenities: { type: "array", items: { type: "string" }, example: ["wifi", "pool"] },
            rating: { type: "number", nullable: true, example: 4.5 },
            hostId: { type: "string", example: "uuid-456" },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        CreateListingInput: {
          type: "object",
          required: ["title", "description", "location", "pricePerNight", "guests", "type", "amenities"],
          properties: {
            title: { type: "string", example: "Cozy Apartment" },
            description: { type: "string", example: "A nice place to stay" },
            location: { type: "string", example: "Kigali, Rwanda" },
            pricePerNight: { type: "number", example: 80 },
            guests: { type: "integer", example: 2 },
            type: { type: "string", enum: ["APARTMENT", "HOUSE", "VILLA", "CABIN"] },
            amenities: { type: "array", items: { type: "string" }, example: ["wifi", "pool"] }
          }
        },
        Booking: {
          type: "object",
          properties: {
            id: { type: "string", example: "uuid-123" },
            listingId: { type: "string", example: "uuid-456" },
            guestId: { type: "string", example: "uuid-789" },
            checkIn: { type: "string", format: "date-time" },
            checkOut: { type: "string", format: "date-time" },
            totalPrice: { type: "number", example: 240 },
            status: { type: "string", enum: ["PENDING", "CONFIRMED", "CANCELLED"] },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        Review: {
          type: "object",
          properties: {
            id: { type: "string", example: "uuid-123" },
            rating: { type: "integer", example: 5 },
            comment: { type: "string", example: "Great place!" },
            userId: { type: "string", example: "uuid-456" },
            listingId: { type: "string", example: "uuid-789" },
            createdAt: { type: "string", format: "date-time" }
          }
        }
      }
    }
  },
  apis: [path.join(__dirname, "../routes/**/*.ts"), path.join(__dirname, "../routes/**/*.js")],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log("Swagger docs available at http://localhost:3000/api-docs");
}
