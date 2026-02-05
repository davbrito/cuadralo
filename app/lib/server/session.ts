import { createCookieSessionStorage } from "react-router";

type SessionFlashData = {
  error: string;
  success: string;
};

export const flashStorage = createCookieSessionStorage<
  Record<string, never>,
  SessionFlashData
>({
  cookie: {
    name: "__flash_session",

    httpOnly: true,
    maxAge: 10,
    path: "/",
    sameSite: "lax",
    secrets: ["s3cret1"],
    secure: true,
  },
});
