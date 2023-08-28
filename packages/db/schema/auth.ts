//TODO: add relations

import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  json,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  instance_id: text("instance_id"),
  aud: varchar("aud", { length: 255 }),
  role: varchar("role", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  encrypted_password: varchar("encrypted_password", { length: 255 }),
  name: varchar("name", { length: 255 }),
  email_confirmed_at: timestamp("email_confirmed_at", {
    mode: "date",
  }),
  invited_at: timestamp("invited_at", {
    mode: "date",
  }),
  confirmation_token: varchar("confirmation_token", { length: 255 }),
  confirmation_token_sent_at: timestamp("confirmation_token_sent_at", {
    mode: "date",
  }),
  recovery_token: varchar("recovery_token", { length: 255 }),
  recovery_sent_at: timestamp("recovery_sent_at", {
    mode: "date",
  }),
  email_change_token_new: varchar("email_change_token_new", { length: 255 }),
  email_change: varchar("email_change", { length: 255 }),
  email_change_sent_at: timestamp("email_change_sent_at", {
    mode: "date",
  }),
  last_sign_in_at: timestamp("last_sign_in_at", {
    mode: "date",
  }),
  raw_app_meta_data: json("raw_app_meta_data"),
  is_super_admin: boolean("is_super_admin"),
  raw_user_meta_data: json("raw_app_meta_data"),
  phone: text("phone").unique(),
  phone_confirmed_at: timestamp("phone_confirmed_at", {
    mode: "date",
  }),
  phone_change: text("phone_change").default(""),
  phone_change_token: varchar("phone_change_token", { length: 255 }).default(
    "",
  ),
  phone_change_token_sent_at: timestamp("phone_change_token_sent_at", {
    mode: "date",
  }),
  confirmed_at: timestamp("confirmed_at", {
    mode: "date",
  }),
  email_change_token_current: varchar("email_change_token_current", {
    length: 255,
  }).default(""),
  email_change_confirm_status: smallint("email_change_confirm_status").default(
    0,
  ),
  banned_until: timestamp("banned_until", {
    mode: "date",
  }),
  reauthentication_token: varchar("reauthentication_token", {
    length: 255,
  }).default(""),
  reauthentication_sent_at: timestamp("reauthentication_sent_at", {
    mode: "date",
  }),
  is_sso_user: boolean("is_sso_user").default(false),
  deleted_at: timestamp("deleted_at", {
    mode: "date",
  }),

  created_at: timestamp("created_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
  updated_at: timestamp("updated_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
});

export const audit_log_entries = pgTable("audit_logs_instance_id_idx", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  instance_id: text("instance_id"),
  payload: json("payload"),
  id_address: varchar("id_address", {
    length: 64,
  }).default(""),

  created_at: timestamp("created_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
});

export const flow_state = pgTable("idx_auth_code", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  user_id: uuid("user_id"),
  auth_code: text("auth_code").notNull(),
  code_challenge_method: text("code_challenge_method", {
    enum: ["s256, plain"],
  }).notNull(),
  code_challenge: text("code_challenge_method").notNull(),
  provider_type: text("provider_type").notNull(),
  provider_access_token: text("provider_access_token"),
  provider_refresh_token: text("provider_refresh_token"),

  created_at: timestamp("created_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
  updated_at: timestamp("updated_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
});

export const identities = pgTable("identities", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  user_id: uuid("user_id").notNull(),
  identity_data: json("identity_data").notNull(),
  provider: json("provider").notNull(),
  last_sign_in_at: timestamp("last_sign_in_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
  email: text("email"),

  created_at: timestamp("created_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
  updated_at: timestamp("updated_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
});

export const instances = pgTable("instances", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  uuid: uuid("uuid"),
  raw_base_config: text("raw_base_config"),

  created_at: timestamp("created_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
  updated_at: timestamp("updated_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
});

export const mfa_amr_claims = pgTable(
  "mfa_amr_claims_session_id_authentication_method_pkey",
  {
    id: uuid("amr_id_pk").defaultRandom().notNull().primaryKey(),
    sesion_id: uuid("session_id").notNull(),

    created_at: timestamp("created_at", {
      mode: "date",
    }).default(sql`CURRENT_TIMESTAMP(6)`),
    updated_at: timestamp("updated_at", {
      mode: "date",
    }).default(sql`CURRENT_TIMESTAMP(6)`),
  },
);

export const mfa_challenges = pgTable("mfa_challenges", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  factor_id: uuid("factor_id").notNull(),
  ip_address: text("ip_address").notNull(),

  created_at: timestamp("created_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
  verified_at: timestamp("verified_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
});

export const mfa_factors = pgTable("factor_id_created_at_idx", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  user_id: uuid("user_id").notNull(),
  friendly_name: text("friendly_name"),
  factor_type: text("factor_type", {
    enum: ["totp, webauthn"],
  }).notNull(),
  factor_status: text("factor_status", {
    enum: ["unverified, verified"],
  }).notNull(),
  secrets: text("secrets"),

  created_at: timestamp("created_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
  updated_at: timestamp("updated_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
});

export const refresh_tokens = pgTable("refresh_tokens", {
  id: bigserial("id", { mode: "number" }).notNull().primaryKey(),
  instance_id: uuid("instance_id"),
  token: varchar("refresh_tokens_token_unique", { length: 255 }),
  user_id: varchar("user_id", { length: 255 }),
  revoked: boolean("revoked"),
  parent: varchar("parent", { length: 255 }),
  session_id: uuid("session_id"),

  created_at: timestamp("created_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
  updated_at: timestamp("updated_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
});

export const saml_providers = pgTable("saml_providers", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  sso_provider_id: uuid("sso_provider_id"),
  entity_id: text("entity_id").unique(),
  metadata_xml: text("metadata_xml").notNull(),
  metadata_url: text("metadata_url"),
  attribute_mapping: json("attribute_mapping"),

  created_at: timestamp("created_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
  updated_at: timestamp("updated_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
});

export const saml_relay_states = pgTable("saml_relay_states", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  sso_provider_id: uuid("sso_provider_id"),
  request_id: text("request_id").notNull(),
  for_email: text("for_email"),
  redirect_to: text("redirect_to"),
  from_ip_address: text("from_ip_address"),

  created_at: timestamp("created_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
  updated_at: timestamp("updated_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
});

export const schema_migrations = pgTable("schema_migrations", {
  version: varchar("schema_migrations_version_idx", { length: 14 }),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  user_id: uuid("user_id").notNull(),
  factor_id: uuid("factor_id"),
  aal: text("aal", {
    enum: ["aal1, aal2, aal3"],
  }).notNull(),
  not_after: timestamp("not_after", {
    mode: "date",
  }),

  created_at: timestamp("created_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
  updated_at: timestamp("updated_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
});

export const sso_domains = pgTable("sso_domains", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  sso_provider_id: uuid("sso_provider_id").notNull(),
  domain: text("domain").notNull(),

  created_at: timestamp("created_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
  updated_at: timestamp("updated_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
});

export const sso_providers = pgTable("sso_providers", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  resource_id: text("resource_id"),

  created_at: timestamp("created_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
  updated_at: timestamp("updated_at", {
    mode: "date",
  }).default(sql`CURRENT_TIMESTAMP(6)`),
});

// export const usersRelations = relations(users, ({ many }) => ({
//   accounts: many(accounts),
// }));

// export const accounts = pgTable(
//   "accounts",
//   {
//     userId: varchar("userId", { length: 255 }).notNull(),
//     type: varchar("type", { length: 255 })
//       .$type<AdapterAccount["type"]>()
//       .notNull(),
//     provider: varchar("provider", { length: 255 }).notNull(),
//     providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
//     refresh_token: varchar("refresh_token", { length: 255 }),
//     access_token: varchar("access_token", { length: 255 }),
//     expires_at: serial("expires_at"),
//     token_type: varchar("token_type", { length: 255 }),
//     scope: varchar("scope", { length: 255 }),
//     id_token: varchar("id_token", { length: 255 }),
//     session_state: varchar("session_state", { length: 255 }),
//   },
//   (account) => ({
//     compoundKey: primaryKey(account.provider, account.providerAccountId),
//     userIdIdx: index("userId_idx").on(account.userId),
//   }),
// );
//
// export const accountsRelations = relations(accounts, ({ one }) => ({
//   user: one(users, { fields: [accounts.userId], references: [users.id] }),
// }));
//
// export const sessions = pgTable(
//   "sessions",
//   {
//     sessionToken: varchar("sessionToken", { length: 255 })
//       .notNull()
//       .primaryKey(),
//     userId: varchar("userId", { length: 255 }).notNull(),
//     expires: timestamp("expires", { mode: "date" }).notNull(),
//   },
//   (session) => ({
//     userIdIdx: index("userId_idx").on(session.userId),
//   }),
// );
//
// export const sessionsRelations = relations(sessions, ({ one }) => ({
//   user: one(users),
// }));
//
// export const verificationTokens = pgTable(
//   "verificationToken",
//   {
//     identifier: varchar("identifier", { length: 255 }).notNull(),
//     token: varchar("token", { length: 255 }).notNull(),
//     expires: timestamp("expires", { mode: "date" }).notNull(),
//   },
//   (vt) => ({
//     compoundKey: primaryKey(vt.identifier, vt.token),
//   }),
// );
