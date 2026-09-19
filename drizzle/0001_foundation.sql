CREATE TYPE "public"."tool_invocation_status" AS ENUM('pending', 'running', 'succeeded', 'failed', 'denied');--> statement-breakpoint
CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."embedding_model_status" AS ENUM('active', 'retiring', 'retired');--> statement-breakpoint
CREATE TYPE "public"."memory_kind" AS ENUM('fact', 'preference', 'goal', 'decision', 'insight', 'relationship', 'event');--> statement-breakpoint
CREATE TYPE "public"."memory_status" AS ENUM('candidate', 'active', 'superseded', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('planned', 'active', 'blocked', 'done', 'archived');--> statement-breakpoint
CREATE TYPE "public"."venture_stage" AS ENUM('idea', 'building', 'operating', 'scaling', 'paused', 'exited');--> statement-breakpoint
CREATE TYPE "public"."venture_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passkey" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"created_at" timestamp with time zone,
	"aaguid" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tool_invocation" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"message_id" uuid,
	"capability_id" text NOT NULL,
	"input" jsonb NOT NULL,
	"output" jsonb,
	"status" "tool_invocation_status" DEFAULT 'pending' NOT NULL,
	"error" text,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text,
	"summary" text,
	"venture_id" uuid,
	"project_id" uuid,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" uuid PRIMARY KEY NOT NULL,
	"conversation_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "message_role" NOT NULL,
	"parts" jsonb NOT NULL,
	"model_role" text,
	"token_input" integer,
	"token_output" integer,
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atlas_event" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text,
	"type" text NOT NULL,
	"subject_type" text,
	"subject_id" uuid,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"actor" text DEFAULT 'owner' NOT NULL,
	"request_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"identity_summary" text,
	"thinking_style" text,
	"communication_prefs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"current_priorities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"onboarding_state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "embedding_model" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"model_version" text,
	"dimensions" integer NOT NULL,
	"status" "embedding_model_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"retired_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "memory" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" "memory_kind" NOT NULL,
	"status" "memory_status" DEFAULT 'candidate' NOT NULL,
	"content" text NOT NULL,
	"search" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', "content")) STORED NOT NULL,
	"importance" real DEFAULT 0.5 NOT NULL,
	"confidence" real DEFAULT 0.7 NOT NULL,
	"source_message_id" uuid,
	"venture_id" uuid,
	"project_id" uuid,
	"entities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"supersedes_id" uuid,
	"last_accessed_at" timestamp with time zone,
	"access_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "memory_embedding_1536" (
	"memory_id" uuid NOT NULL,
	"embedding_model_id" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"content_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memory_embedding_1536_memory_id_embedding_model_id_pk" PRIMARY KEY("memory_id","embedding_model_id")
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"venture_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" "project_status" DEFAULT 'active' NOT NULL,
	"objective" text,
	"context" text,
	"next_step" text,
	"blockers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "venture" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"one_liner" text,
	"stage" "venture_stage" DEFAULT 'building' NOT NULL,
	"status" "venture_status" DEFAULT 'active' NOT NULL,
	"context" text,
	"goals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_invocation" ADD CONSTRAINT "tool_invocation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_invocation" ADD CONSTRAINT "tool_invocation_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_venture_id_venture_id_fk" FOREIGN KEY ("venture_id") REFERENCES "public"."venture"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atlas_event" ADD CONSTRAINT "atlas_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory" ADD CONSTRAINT "memory_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory" ADD CONSTRAINT "memory_source_message_id_message_id_fk" FOREIGN KEY ("source_message_id") REFERENCES "public"."message"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory" ADD CONSTRAINT "memory_venture_id_venture_id_fk" FOREIGN KEY ("venture_id") REFERENCES "public"."venture"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory" ADD CONSTRAINT "memory_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_embedding_1536" ADD CONSTRAINT "memory_embedding_1536_memory_id_memory_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."memory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_embedding_1536" ADD CONSTRAINT "memory_embedding_1536_embedding_model_id_embedding_model_id_fk" FOREIGN KEY ("embedding_model_id") REFERENCES "public"."embedding_model"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_venture_id_venture_id_fk" FOREIGN KEY ("venture_id") REFERENCES "public"."venture"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venture" ADD CONSTRAINT "venture_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "passkey_user_id_idx" ON "passkey" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "passkey_credential_id_idx" ON "passkey" USING btree ("credential_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "tool_invocation_user_created_idx" ON "tool_invocation" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "tool_invocation_message_idx" ON "tool_invocation" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "conversation_user_recent_idx" ON "conversation" USING btree ("user_id","last_message_at");--> statement-breakpoint
CREATE INDEX "conversation_project_idx" ON "conversation" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "message_conversation_created_idx" ON "message" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "atlas_event_user_created_idx" ON "atlas_event" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "atlas_event_subject_idx" ON "atlas_event" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "memory_user_status_idx" ON "memory" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "memory_search_gin_idx" ON "memory" USING gin ("search");--> statement-breakpoint
CREATE INDEX "memory_project_idx" ON "memory" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "memory_embedding_1536_hnsw_idx" ON "memory_embedding_1536" USING hnsw ("embedding" vector_cosine_ops) WITH (m=16,ef_construction=64);--> statement-breakpoint
CREATE UNIQUE INDEX "project_user_slug_uidx" ON "project" USING btree ("user_id","slug");--> statement-breakpoint
CREATE INDEX "project_user_status_idx" ON "project" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "project_venture_idx" ON "project" USING btree ("venture_id");--> statement-breakpoint
CREATE UNIQUE INDEX "venture_user_slug_uidx" ON "venture" USING btree ("user_id","slug");--> statement-breakpoint
CREATE INDEX "venture_user_status_idx" ON "venture" USING btree ("user_id","status");