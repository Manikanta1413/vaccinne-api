import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Vaccine Registration API",
      version: "1.0.0",
      description: "API documentation for Vaccine Registration System",
    },
    servers: [
      {
        url: "http://localhost:5000", // replace with prod URL later
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
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.ts"], // Include all your route files
});
