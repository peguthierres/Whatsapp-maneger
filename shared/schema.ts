import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chatbot flows
export const flows = pgTable("flows", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(false),
  triggerKeywords: text("trigger_keywords").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Flow nodes (individual steps in a flow)
export const flowNodes = pgTable("flow_nodes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  flowId: uuid("flow_id").notNull().references(() => flows.id, { onDelete: "cascade" }),
  nodeType: varchar("node_type").notNull(), // 'message', 'condition', 'webhook', 'delay'
  name: varchar("name").notNull(),
  config: jsonb("config").notNull(), // Node-specific configuration
  position: jsonb("position").notNull(), // { x: number, y: number }
  createdAt: timestamp("created_at").defaultNow(),
});

// Flow connections (links between nodes)
export const flowLinks = pgTable("flow_links", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  flowId: uuid("flow_id").notNull().references(() => flows.id, { onDelete: "cascade" }),
  sourceNodeId: uuid("source_node_id").notNull().references(() => flowNodes.id, { onDelete: "cascade" }),
  targetNodeId: uuid("target_node_id").notNull().references(() => flowNodes.id, { onDelete: "cascade" }),
  condition: text("condition"), // Optional condition for conditional links
  createdAt: timestamp("created_at").defaultNow(),
});

// Message logs
export const messageLogs = pgTable("message_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  flowId: uuid("flow_id").references(() => flows.id, { onDelete: "set null" }),
  phoneNumber: varchar("phone_number").notNull(),
  direction: varchar("direction").notNull(), // 'incoming', 'outgoing'
  message: text("message").notNull(),
  messageType: varchar("message_type").default('text'), // 'text', 'image', 'audio', etc.
  status: varchar("status").notNull(), // 'sent', 'delivered', 'read', 'failed'
  whatsappMessageId: varchar("whatsapp_message_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Webhooks configuration
export const webhooks = pgTable("webhooks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  flowId: uuid("flow_id").references(() => flows.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  url: text("url").notNull(),
  method: varchar("method").default('POST'),
  headers: jsonb("headers"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WhatsApp Business API configuration
export const whatsappConfig = pgTable("whatsapp_config", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  appId: varchar("app_id").notNull(),
  phoneNumberId: varchar("phone_number_id").notNull(),
  accessToken: text("access_token").notNull(),
  verifyToken: varchar("verify_token").notNull(),
  phoneNumber: varchar("phone_number"),
  businessName: varchar("business_name"),
  webhookUrl: text("webhook_url"),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User sessions for flow execution
export const userSessions = pgTable("user_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: varchar("phone_number").notNull(),
  flowId: uuid("flow_id").references(() => flows.id, { onDelete: "cascade" }),
  currentNodeId: uuid("current_node_id").references(() => flowNodes.id, { onDelete: "set null" }),
  sessionData: jsonb("session_data"),
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Webhook execution logs
export const webhookLogs = pgTable("webhook_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  webhookId: uuid("webhook_id").notNull().references(() => webhooks.id, { onDelete: "cascade" }),
  requestPayload: jsonb("request_payload"),
  responseStatus: integer("response_status"),
  responseBody: text("response_body"),
  responseTime: integer("response_time"), // milliseconds
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertFlowSchema = createInsertSchema(flows).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFlowNodeSchema = createInsertSchema(flowNodes).omit({
  id: true,
  createdAt: true,
});

export const insertFlowLinkSchema = createInsertSchema(flowLinks).omit({
  id: true,
  createdAt: true,
});

export const insertMessageLogSchema = createInsertSchema(messageLogs).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertWebhookSchema = createInsertSchema(webhooks).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWhatsappConfigSchema = createInsertSchema(whatsappConfig).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Flow = typeof flows.$inferSelect;
export type FlowNode = typeof flowNodes.$inferSelect;
export type FlowLink = typeof flowLinks.$inferSelect;
export type MessageLog = typeof messageLogs.$inferSelect;
export type Webhook = typeof webhooks.$inferSelect;
export type WhatsappConfig = typeof whatsappConfig.$inferSelect;
export type UserSession = typeof userSessions.$inferSelect;
export type WebhookLog = typeof webhookLogs.$inferSelect;

export type InsertFlow = z.infer<typeof insertFlowSchema>;
export type InsertFlowNode = z.infer<typeof insertFlowNodeSchema>;
export type InsertFlowLink = z.infer<typeof insertFlowLinkSchema>;
export type InsertMessageLog = z.infer<typeof insertMessageLogSchema>;
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type InsertWhatsappConfig = z.infer<typeof insertWhatsappConfigSchema>;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
