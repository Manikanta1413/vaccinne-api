import { UserDocument } from "../../models/user.model"; // adjust import if needed

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}
