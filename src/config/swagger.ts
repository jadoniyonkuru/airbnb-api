import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

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
            user: { "$ref": "#/components/schemas/User" }
          }
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Error message" }
          }
        }
      }
    }
  },
  
  
apis: ["./src/routes/*.ts", "./src/routes/**/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log(" Swagger docs available at http://localhost:3000/api-docs");
}