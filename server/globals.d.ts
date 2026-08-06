/// <reference types="node" />

declare module "nodemailer";

declare module "express-session" {
  interface SessionData {
    admin?: {
      email: string;
      authenticatedAt: string;
    };
  }
}
