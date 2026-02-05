import { privateMiddleware } from "@/middleware/auth";
import type { Route } from "./+types/private";

export const middleware: Route.MiddlewareFunction[] = [privateMiddleware];
