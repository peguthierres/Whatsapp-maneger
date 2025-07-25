import {
  users,
  flows,
  flowNodes,
  flowLinks,
  messageLogs,
  webhooks,
  whatsappConfig,
  userSessions,
  webhookLogs,
  type User,
  type UpsertUser,
  type Flow,
  type FlowNode,
  type FlowLink,
  type MessageLog,
  type Webhook,
  type WhatsappConfig,
  type UserSession,
  type WebhookLog,
  type InsertFlow,
  type InsertFlowNode,
  type InsertFlowLink,
  type InsertMessageLog,
  type InsertWebhook,
  type InsertWhatsappConfig,
  type InsertUserSession,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Flow operations
  getUserFlows(userId: string): Promise<Flow[]>;
  getFlow(id: string): Promise<Flow | undefined>;
  createFlow(userId: string, flow: InsertFlow): Promise<Flow>;
  updateFlow(id: string, updates: Partial<InsertFlow>): Promise<Flow>;
  deleteFlow(id: string): Promise<void>;
  
  // Flow node operations
  getFlowNodes(flowId: string): Promise<FlowNode[]>;
  createFlowNode(node: InsertFlowNode): Promise<FlowNode>;
  updateFlowNode(id: string, updates: Partial<InsertFlowNode>): Promise<FlowNode>;
  deleteFlowNode(id: string): Promise<void>;
  
  // Flow link operations
  getFlowLinks(flowId: string): Promise<FlowLink[]>;
  createFlowLink(link: InsertFlowLink): Promise<FlowLink>;
  deleteFlowLink(id: string): Promise<void>;
  
  // Message log operations
  getUserMessageLogs(userId: string, limit?: number): Promise<MessageLog[]>;
  createMessageLog(userId: string, log: InsertMessageLog): Promise<MessageLog>;
  getRecentMessages(userId: string, limit?: number): Promise<MessageLog[]>;
  
  // Webhook operations
  getUserWebhooks(userId: string): Promise<Webhook[]>;
  getFlowWebhooks(flowId: string): Promise<Webhook[]>;
  createWebhook(userId: string, webhook: InsertWebhook): Promise<Webhook>;
  updateWebhook(id: string, updates: Partial<InsertWebhook>): Promise<Webhook>;
  deleteWebhook(id: string): Promise<void>;
  
  // WhatsApp config operations
  getUserWhatsappConfig(userId: string): Promise<WhatsappConfig | undefined>;
  upsertWhatsappConfig(userId: string, config: InsertWhatsappConfig): Promise<WhatsappConfig>;
  
  // User session operations
  getUserSession(phoneNumber: string): Promise<UserSession | undefined>;
  upsertUserSession(session: InsertUserSession): Promise<UserSession>;
  updateUserSession(phoneNumber: string, updates: Partial<InsertUserSession>): Promise<void>;
  
  // Analytics operations
  getUserStats(userId: string): Promise<{
    activeFlows: number;
    messagesToday: number;
    activeUsers: number;
    successRate: number;
  }>;
  
  // Webhook logs
  createWebhookLog(log: any): Promise<WebhookLog>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Flow operations
  async getUserFlows(userId: string): Promise<Flow[]> {
    return await db.select().from(flows).where(eq(flows.userId, userId)).orderBy(desc(flows.updatedAt));
  }

  async getFlow(id: string): Promise<Flow | undefined> {
    const [flow] = await db.select().from(flows).where(eq(flows.id, id));
    return flow;
  }

  async createFlow(userId: string, flow: InsertFlow): Promise<Flow> {
    const [newFlow] = await db.insert(flows).values({
      ...flow,
      userId,
    }).returning();
    return newFlow;
  }

  async updateFlow(id: string, updates: Partial<InsertFlow>): Promise<Flow> {
    const [updatedFlow] = await db
      .update(flows)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(flows.id, id))
      .returning();
    return updatedFlow;
  }

  async deleteFlow(id: string): Promise<void> {
    await db.delete(flows).where(eq(flows.id, id));
  }

  // Flow node operations
  async getFlowNodes(flowId: string): Promise<FlowNode[]> {
    return await db.select().from(flowNodes).where(eq(flowNodes.flowId, flowId));
  }

  async createFlowNode(node: InsertFlowNode): Promise<FlowNode> {
    const [newNode] = await db.insert(flowNodes).values(node).returning();
    return newNode;
  }

  async updateFlowNode(id: string, updates: Partial<InsertFlowNode>): Promise<FlowNode> {
    const [updatedNode] = await db
      .update(flowNodes)
      .set(updates)
      .where(eq(flowNodes.id, id))
      .returning();
    return updatedNode;
  }

  async deleteFlowNode(id: string): Promise<void> {
    await db.delete(flowNodes).where(eq(flowNodes.id, id));
  }

  // Flow link operations
  async getFlowLinks(flowId: string): Promise<FlowLink[]> {
    return await db.select().from(flowLinks).where(eq(flowLinks.flowId, flowId));
  }

  async createFlowLink(link: InsertFlowLink): Promise<FlowLink> {
    const [newLink] = await db.insert(flowLinks).values(link).returning();
    return newLink;
  }

  async deleteFlowLink(id: string): Promise<void> {
    await db.delete(flowLinks).where(eq(flowLinks.id, id));
  }

  // Message log operations
  async getUserMessageLogs(userId: string, limit = 50): Promise<MessageLog[]> {
    return await db
      .select()
      .from(messageLogs)
      .where(eq(messageLogs.userId, userId))
      .orderBy(desc(messageLogs.createdAt))
      .limit(limit);
  }

  async createMessageLog(userId: string, log: InsertMessageLog): Promise<MessageLog> {
    const [newLog] = await db.insert(messageLogs).values({
      ...log,
      userId,
    }).returning();
    return newLog;
  }

  async getRecentMessages(userId: string, limit = 10): Promise<MessageLog[]> {
    return await db
      .select()
      .from(messageLogs)
      .where(eq(messageLogs.userId, userId))
      .orderBy(desc(messageLogs.createdAt))
      .limit(limit);
  }

  // Webhook operations
  async getUserWebhooks(userId: string): Promise<Webhook[]> {
    return await db.select().from(webhooks).where(eq(webhooks.userId, userId));
  }

  async getFlowWebhooks(flowId: string): Promise<Webhook[]> {
    return await db.select().from(webhooks).where(eq(webhooks.flowId, flowId));
  }

  async createWebhook(userId: string, webhook: InsertWebhook): Promise<Webhook> {
    const [newWebhook] = await db.insert(webhooks).values({
      ...webhook,
      userId,
    }).returning();
    return newWebhook;
  }

  async updateWebhook(id: string, updates: Partial<InsertWebhook>): Promise<Webhook> {
    const [updatedWebhook] = await db
      .update(webhooks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(webhooks.id, id))
      .returning();
    return updatedWebhook;
  }

  async deleteWebhook(id: string): Promise<void> {
    await db.delete(webhooks).where(eq(webhooks.id, id));
  }

  // WhatsApp config operations
  async getUserWhatsappConfig(userId: string): Promise<WhatsappConfig | undefined> {
    const [config] = await db.select().from(whatsappConfig).where(eq(whatsappConfig.userId, userId));
    return config;
  }

  async upsertWhatsappConfig(userId: string, config: InsertWhatsappConfig): Promise<WhatsappConfig> {
    const [upsertedConfig] = await db
      .insert(whatsappConfig)
      .values({ ...config, userId })
      .onConflictDoUpdate({
        target: whatsappConfig.userId,
        set: { ...config, updatedAt: new Date() },
      })
      .returning();
    return upsertedConfig;
  }

  // User session operations
  async getUserSession(phoneNumber: string): Promise<UserSession | undefined> {
    const [session] = await db.select().from(userSessions).where(eq(userSessions.phoneNumber, phoneNumber));
    return session;
  }

  async upsertUserSession(session: InsertUserSession): Promise<UserSession> {
    const [upsertedSession] = await db
      .insert(userSessions)
      .values(session)
      .onConflictDoUpdate({
        target: userSessions.phoneNumber,
        set: { ...session, lastActivity: new Date() },
      })
      .returning();
    return upsertedSession;
  }

  async updateUserSession(phoneNumber: string, updates: Partial<InsertUserSession>): Promise<void> {
    await db
      .update(userSessions)
      .set({ ...updates, lastActivity: new Date() })
      .where(eq(userSessions.phoneNumber, phoneNumber));
  }

  // Analytics operations
  async getUserStats(userId: string): Promise<{
    activeFlows: number;
    messagesToday: number;
    activeUsers: number;
    successRate: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Active flows count
    const [activeFlowsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(flows)
      .where(and(eq(flows.userId, userId), eq(flows.isActive, true)));

    // Messages today count
    const [messagesTodayResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messageLogs)
      .where(and(
        eq(messageLogs.userId, userId),
        sql`${messageLogs.createdAt} >= ${today}`
      ));

    // Active users (unique phone numbers in last 24 hours)
    const [activeUsersResult] = await db
      .select({ count: sql<number>`count(distinct ${messageLogs.phoneNumber})` })
      .from(messageLogs)
      .where(and(
        eq(messageLogs.userId, userId),
        sql`${messageLogs.createdAt} >= ${today}`
      ));

    // Success rate (delivered/sent messages ratio)
    const [totalMessagesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messageLogs)
      .where(and(
        eq(messageLogs.userId, userId),
        eq(messageLogs.direction, 'outgoing')
      ));

    const [successfulMessagesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messageLogs)
      .where(and(
        eq(messageLogs.userId, userId),
        eq(messageLogs.direction, 'outgoing'),
        or(eq(messageLogs.status, 'delivered'), eq(messageLogs.status, 'read'))
      ));

    const successRate = totalMessagesResult.count > 0 
      ? (successfulMessagesResult.count / totalMessagesResult.count) * 100 
      : 0;

    return {
      activeFlows: activeFlowsResult.count,
      messagesToday: messagesTodayResult.count,
      activeUsers: activeUsersResult.count,
      successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal place
    };
  }

  // Webhook logs
  async createWebhookLog(log: any): Promise<WebhookLog> {
    const [newLog] = await db.insert(webhookLogs).values(log).returning();
    return newLog;
  }
}

export const storage = new DatabaseStorage();
