import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  route("/sign-in/*", "routes/auth/login.tsx"),
  route("/p/:userId/reserve", "routes/public-reserve.tsx"),
  route("/r/:reserveId", "routes/public-reserve-detail.tsx"),
  layout("routes/private.tsx", [
    index("routes/home.tsx"),
    route("settings", "routes/settings.tsx"),
  ]),
] satisfies RouteConfig;
