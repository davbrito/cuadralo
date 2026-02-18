import { startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { windowPerfInstrumentation } from "./core/instrumentation/performance.client";

startTransition(() => {
  hydrateRoot(
    document,
    <HydratedRouter unstable_instrumentations={[windowPerfInstrumentation]} />,
  );
});
