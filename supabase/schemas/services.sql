CREATE TABLE "services" (
    -- Columns
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES "auth"."users" ("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "description" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz,
    -- Constraints
    UNIQUE ("user_id", "name"),
    CHECK (char_length("name") > 0),
    CHECK (char_length("description") <= 1000)
);