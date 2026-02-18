import type {
  unstable_ClientInstrumentation,
  unstable_InstrumentationHandlerResult,
} from "react-router";

export const windowPerfInstrumentation: unstable_ClientInstrumentation = {
  router({ instrument }) {
    instrument({
      navigate: (fn, { to, currentUrl }) =>
        measure("navigation", `navigation:${currentUrl}->${to}`, fn),
      fetch: (fn, { href }) => measure("fetch", `fetcher:${href}`, fn),
    });
  },
  route({ instrument, id }) {
    instrument({
      middleware: (fn) => measure("middleware", `middleware:${id}`, fn),
      loader: (fn) => measure("loader", `loader:${id}`, fn),
      action: (fn) => measure("action", `action:${id}`, fn),
    });
  },
};

async function measure(
  group: string,
  label: string,
  cb: () => Promise<unstable_InstrumentationHandlerResult>,
) {
  const detail = {
    devtools: {
      track: group,
      trackGroup: "react-router",
    },
  };
  console.log(`-> ${label}`);
  performance.mark(`start:${label}`, { detail });
  await cb();
  performance.mark(`end:${label}`, { detail });
  performance.measure(label, {
    start: `start:${label}`,
    end: `end:${label}`,
    detail,
  });
}
