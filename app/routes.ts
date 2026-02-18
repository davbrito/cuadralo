import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  route("/sign-in/*", "routes/auth/login.tsx"),
  route("/p/:userId/reserve", "routes/booking/create.tsx", [
    route(":serviceId?", "routes/booking/create-content.tsx"),
  ]),
  route("/r/:reserveId", "routes/booking/detail.tsx"),
  layout("routes/private.tsx", [
    index("routes/home.tsx"),
    route("agenda", "routes/agenda.tsx"),
    route("settings", "routes/settings.tsx"),
  ]),
] satisfies RouteConfig;
