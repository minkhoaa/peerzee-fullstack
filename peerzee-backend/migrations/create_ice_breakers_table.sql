CREATE TABLE IF NOT EXISTS "ice_breakers" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "prompt" text NOT NULL,
    "category" character varying NOT NULL DEFAULT 'general',
    "isActive" boolean NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_ice_breakers_id" PRIMARY KEY ("id")
);
