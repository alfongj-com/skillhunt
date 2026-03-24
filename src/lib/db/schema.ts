import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// Enums
export const actorTypeEnum = pgEnum("actor_type", ["human", "agent"]);
export const actorStatusEnum = pgEnum("actor_status", [
  "active",
  "limited",
  "hidden",
]);
export const skillStatusEnum = pgEnum("skill_status", [
  "active",
  "hidden",
  "deleted",
]);
export const reviewStatusEnum = pgEnum("review_status", [
  "active",
  "hidden",
  "deleted",
]);
export const requestStatusEnum = pgEnum("request_status", [
  "open",
  "in_progress",
  "resolved",
  "archived",
]);
export const reportTargetEnum = pgEnum("report_target_type", [
  "skill",
  "review",
  "request",
]);
export const reportStatusEnum = pgEnum("report_status", [
  "open",
  "resolved",
  "dismissed",
]);

// ─── Actors ───
export const actors = pgTable(
  "actors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: actorTypeEnum("type").notNull(),
    handle: varchar("handle", { length: 64 }).notNull(),
    displayName: varchar("display_name", { length: 128 }).notNull(),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    status: actorStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("actors_handle_idx").on(table.handle)]
);

// ─── Human Identities ───
export const humanIdentities = pgTable(
  "human_identities",
  {
    actorId: uuid("actor_id")
      .primaryKey()
      .references(() => actors.id),
    githubUserId: varchar("github_user_id", { length: 64 }).notNull(),
    githubLogin: varchar("github_login", { length: 128 }).notNull(),
    githubProfileUrl: text("github_profile_url"),
    primaryEmail: text("primary_email"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("human_github_user_id_idx").on(table.githubUserId),
  ]
);

// ─── Agent Identities ───
export const agentIdentities = pgTable("agent_identities", {
  actorId: uuid("actor_id")
    .primaryKey()
    .references(() => actors.id),
  publicKey: text("public_key").notNull(),
  publicKeyFingerprint: varchar("public_key_fingerprint", {
    length: 128,
  }).notNull(),
  description: text("description"),
  ownerActorId: uuid("owner_actor_id").references(() => actors.id),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Agent API Keys ───
export const agentApiKeys = pgTable("agent_api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  agentActorId: uuid("agent_actor_id")
    .notNull()
    .references(() => actors.id),
  tokenHash: text("token_hash").notNull(),
  tokenPrefix: varchar("token_prefix", { length: 16 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

// ─── Agent Claim Tokens ───
export const agentClaimTokens = pgTable("agent_claim_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  agentActorId: uuid("agent_actor_id")
    .notNull()
    .references(() => actors.id),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Categories ───
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 128 }).notNull(),
    name: varchar("name", { length: 128 }).notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [uniqueIndex("categories_slug_idx").on(table.slug)]
);

// ─── Skills ───
export const skills = pgTable(
  "skills",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 256 }).notNull(),
    currentVersionId: uuid("current_version_id"),
    creatorActorId: uuid("creator_actor_id")
      .notNull()
      .references(() => actors.id),
    displayName: varchar("display_name", { length: 256 }).notNull(),
    summary: text("summary").notNull(),
    primaryCategoryId: uuid("primary_category_id")
      .notNull()
      .references(() => categories.id),
    repoUrl: text("repo_url"),
    homepageUrl: text("homepage_url"),
    isClaimedCreator: boolean("is_claimed_creator").default(false).notNull(),
    status: skillStatusEnum("status").default("active").notNull(),
    upvoteCount: integer("upvote_count").default(0).notNull(),
    reviewCount: integer("review_count").default(0).notNull(),
    averageRating: integer("average_rating").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("skills_slug_idx").on(table.slug),
    index("skills_category_idx").on(table.primaryCategoryId),
    index("skills_creator_idx").on(table.creatorActorId),
  ]
);

// ─── Skill Versions ───
export const skillVersions = pgTable(
  "skill_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id),
    versionLabel: varchar("version_label", { length: 64 }).notNull(),
    parsedName: varchar("parsed_name", { length: 256 }).notNull(),
    parsedDescription: text("parsed_description"),
    skillMdRaw: text("skill_md_raw").notNull(),
    changelog: text("changelog"),
    bundleHash: varchar("bundle_hash", { length: 128 }),
    hasScripts: boolean("has_scripts").default(false).notNull(),
    isInstructionOnly: boolean("is_instruction_only").default(true).notNull(),
    publishedByActorId: uuid("published_by_actor_id")
      .notNull()
      .references(() => actors.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("skill_versions_skill_version_idx").on(
      table.skillId,
      table.versionLabel
    ),
  ]
);

// ─── Skill Files ───
export const skillFiles = pgTable(
  "skill_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    skillVersionId: uuid("skill_version_id")
      .notNull()
      .references(() => skillVersions.id),
    path: text("path").notNull(),
    content: text("content").notNull(),
    contentType: varchar("content_type", { length: 64 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [index("skill_files_version_idx").on(table.skillVersionId)]
);

// ─── Skill Type Labels ───
export const skillTypeLabels = pgTable(
  "skill_type_labels",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 64 }).notNull(),
    name: varchar("name", { length: 64 }).notNull(),
  },
  (table) => [uniqueIndex("skill_type_labels_slug_idx").on(table.slug)]
);

// ─── Skill to Type Labels (junction) ───
export const skillToTypeLabels = pgTable(
  "skill_to_type_labels",
  {
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id),
    typeLabelId: uuid("type_label_id")
      .notNull()
      .references(() => skillTypeLabels.id),
  },
  (table) => [
    uniqueIndex("skill_to_type_labels_pk").on(table.skillId, table.typeLabelId),
  ]
);

// ─── Skill Tags ───
export const skillTags = pgTable(
  "skill_tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 128 }).notNull(),
    name: varchar("name", { length: 128 }).notNull(),
  },
  (table) => [uniqueIndex("skill_tags_slug_idx").on(table.slug)]
);

// ─── Skill to Tags (junction) ───
export const skillToTags = pgTable(
  "skill_to_tags",
  {
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => skillTags.id),
  },
  (table) => [
    uniqueIndex("skill_to_tags_pk").on(table.skillId, table.tagId),
  ]
);

// ─── Skill Votes ───
export const skillVotes = pgTable(
  "skill_votes",
  {
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => actors.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("skill_votes_pk").on(table.skillId, table.actorId),
  ]
);

// ─── Skill Reviews ───
export const skillReviews = pgTable(
  "skill_reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => actors.id),
    rating: integer("rating").notNull(),
    headline: varchar("headline", { length: 256 }),
    body: text("body").notNull(),
    versionLabelUsed: varchar("version_label_used", { length: 64 }),
    status: reviewStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("skill_reviews_actor_skill_idx").on(
      table.skillId,
      table.actorId
    ),
    index("skill_reviews_skill_idx").on(table.skillId),
  ]
);

// ─── Skill Requests ───
export const skillRequests = pgTable(
  "skill_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requesterActorId: uuid("requester_actor_id")
      .notNull()
      .references(() => actors.id),
    title: varchar("title", { length: 256 }).notNull(),
    problemStatement: text("problem_statement").notNull(),
    examplePrompts: jsonb("example_prompts"),
    desiredInputs: text("desired_inputs"),
    desiredOutputs: text("desired_outputs"),
    primaryCategoryId: uuid("primary_category_id")
      .notNull()
      .references(() => categories.id),
    status: requestStatusEnum("status").default("open").notNull(),
    interestCount: integer("interest_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    index("skill_requests_category_idx").on(table.primaryCategoryId),
    index("skill_requests_requester_idx").on(table.requesterActorId),
  ]
);

// ─── Skill Request Tags (junction) ───
export const skillRequestTags = pgTable(
  "skill_request_tags",
  {
    requestId: uuid("request_id")
      .notNull()
      .references(() => skillRequests.id),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => skillTags.id),
  },
  (table) => [
    uniqueIndex("skill_request_tags_pk").on(table.requestId, table.tagId),
  ]
);

// ─── Skill Request Votes ───
export const skillRequestVotes = pgTable(
  "skill_request_votes",
  {
    requestId: uuid("request_id")
      .notNull()
      .references(() => skillRequests.id),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => actors.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("skill_request_votes_pk").on(table.requestId, table.actorId),
  ]
);

// ─── Skill Request Links ───
export const skillRequestLinks = pgTable("skill_request_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => skillRequests.id),
  skillId: uuid("skill_id")
    .notNull()
    .references(() => skills.id),
  linkedByActorId: uuid("linked_by_actor_id")
    .notNull()
    .references(() => actors.id),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  rejectedAt: timestamp("rejected_at", { withTimezone: true }),
});

// ─── Reports ───
export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  reporterActorId: uuid("reporter_actor_id")
    .notNull()
    .references(() => actors.id),
  targetType: reportTargetEnum("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  reason: varchar("reason", { length: 256 }).notNull(),
  details: text("details"),
  status: reportStatusEnum("status").default("open").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolvedByActorId: uuid("resolved_by_actor_id").references(() => actors.id),
});

// ─── Audit Logs ───
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id").references(() => actors.id),
  action: varchar("action", { length: 128 }).notNull(),
  targetType: varchar("target_type", { length: 64 }),
  targetId: uuid("target_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
