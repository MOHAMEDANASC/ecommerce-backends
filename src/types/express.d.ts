export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        type: "USER" | "ADMIN";
        name?: string;
        email?: string;
      };
    }
  }
}

