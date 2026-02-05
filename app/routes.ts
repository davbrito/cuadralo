import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  route("/login", "routes/auth/login.tsx"),
  route("/logout", "routes/auth/logout.tsx"),
  layout("routes/private.tsx", [index("routes/home.tsx")]),
] satisfies RouteConfig;
