import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Vaccination API",
      version: "1.0.0",
    },
  },
  apis: ["./src/routes/*.ts"], // where your route comments are
};

export const swaggerSpec = swaggerJsdoc(options);
