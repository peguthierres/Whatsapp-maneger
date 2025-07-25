import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { whatsappService } from "./services/whatsappService";
import { flowEngine } from "./services/flowEngine";
import { webhookService } from "./services/webhookService";
import { 
  insertFlowSchema, 
  insertFlowNodeSchema, 
  insertFlowLinkSchema,
  insertWebhookSchema,
  insertWhatsappConfigSchema,
  insertMessageLogSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Flow routes
  app.get("/api/flows", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const flows = await storage.getUserFlows(userId);
      res.json(flows);
    } catch (error) {
      console.error("Error fetching flows:", error);
      res.status(500).json({ message: "Failed to fetch flows" });
    }
  });

  app.post("/api/flows", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const flowData = insertFlowSchema.parse(req.body);
      const flow = await storage.createFlow(userId, flowData);
      res.json(flow);
    } catch (error) {
      console.error("Error creating flow:", error);
      res.status(500).json({ message: "Failed to create flow" });
    }
  });

  app.put("/api/flows/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = insertFlowSchema.partial().parse(req.body);
      const flow = await storage.updateFlow(id, updates);
      res.json(flow);
    } catch (error) {
      console.error("Error updating flow:", error);
      res.status(500).json({ message: "Failed to update flow" });
    }
  });

  app.delete("/api/flows/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteFlow(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting flow:", error);
      res.status(500).json({ message: "Failed to delete flow" });
    }
  });

  // Flow nodes routes
  app.get("/api/flows/:flowId/nodes", isAuthenticated, async (req: any, res) => {
    try {
      const { flowId } = req.params;
      const nodes = await storage.getFlowNodes(flowId);
      res.json(nodes);
    } catch (error) {
      console.error("Error fetching flow nodes:", error);
      res.status(500).json({ message: "Failed to fetch flow nodes" });
    }
  });

  app.post("/api/flows/:flowId/nodes", isAuthenticated, async (req: any, res) => {
    try {
      const { flowId } = req.params;
      const nodeData = insertFlowNodeSchema.parse({ ...req.body, flowId });
      const node = await storage.createFlowNode(nodeData);
      res.json(node);
    } catch (error) {
      console.error("Error creating flow node:", error);
      res.status(500).json({ message: "Failed to create flow node" });
    }
  });

  app.put("/api/flows/:flowId/nodes/:nodeId", isAuthenticated, async (req: any, res) => {
    try {
      const { nodeId } = req.params;
      const updates = insertFlowNodeSchema.partial().parse(req.body);
      const node = await storage.updateFlowNode(nodeId, updates);
      res.json(node);
    } catch (error) {
      console.error("Error updating flow node:", error);
      res.status(500).json({ message: "Failed to update flow node" });
    }
  });

  app.delete("/api/flows/:flowId/nodes/:nodeId", isAuthenticated, async (req: any, res) => {
    try {
      const { nodeId } = req.params;
      await storage.deleteFlowNode(nodeId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting flow node:", error);
      res.status(500).json({ message: "Failed to delete flow node" });
    }
  });

  // Flow links routes
  app.get("/api/flows/:flowId/links", isAuthenticated, async (req: any, res) => {
    try {
      const { flowId } = req.params;
      const links = await storage.getFlowLinks(flowId);
      res.json(links);
    } catch (error) {
      console.error("Error fetching flow links:", error);
      res.status(500).json({ message: "Failed to fetch flow links" });
    }
  });

  app.post("/api/flows/:flowId/links", isAuthenticated, async (req: any, res) => {
    try {
      const { flowId } = req.params;
      const linkData = insertFlowLinkSchema.parse({ ...req.body, flowId });
      const link = await storage.createFlowLink(linkData);
      res.json(link);
    } catch (error) {
      console.error("Error creating flow link:", error);
      res.status(500).json({ message: "Failed to create flow link" });
    }
  });

  app.delete("/api/flows/:flowId/links/:linkId", isAuthenticated, async (req: any, res) => {
    try {
      const { linkId } = req.params;
      await storage.deleteFlowLink(linkId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting flow link:", error);
      res.status(500).json({ message: "Failed to delete flow link" });
    }
  });

  // Message logs routes
  app.get("/api/logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getUserMessageLogs(userId, limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching message logs:", error);
      res.status(500).json({ message: "Failed to fetch message logs" });
    }
  });

  // Webhook routes
  app.get("/api/webhooks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const webhooks = await storage.getUserWebhooks(userId);
      res.json(webhooks);
    } catch (error) {
      console.error("Error fetching webhooks:", error);
      res.status(500).json({ message: "Failed to fetch webhooks" });
    }
  });

  app.post("/api/webhooks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const webhookData = insertWebhookSchema.parse(req.body);
      const webhook = await storage.createWebhook(userId, webhookData);
      res.json(webhook);
    } catch (error) {
      console.error("Error creating webhook:", error);
      res.status(500).json({ message: "Failed to create webhook" });
    }
  });

  app.put("/api/webhooks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = insertWebhookSchema.partial().parse(req.body);
      const webhook = await storage.updateWebhook(id, updates);
      res.json(webhook);
    } catch (error) {
      console.error("Error updating webhook:", error);
      res.status(500).json({ message: "Failed to update webhook" });
    }
  });

  app.delete("/api/webhooks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteWebhook(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting webhook:", error);
      res.status(500).json({ message: "Failed to delete webhook" });
    }
  });

  app.post("/api/webhooks/:id/test", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const testPayload = req.body;
      const result = await webhookService.testWebhook(id, testPayload);
      res.json(result);
    } catch (error) {
      console.error("Error testing webhook:", error);
      res.status(500).json({ message: "Failed to test webhook" });
    }
  });

  // WhatsApp config routes
  app.get("/api/whatsapp/config", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const config = await storage.getUserWhatsappConfig(userId);
      if (config) {
        // Don't expose sensitive data in response
        const { accessToken, ...safeConfig } = config;
        res.json(safeConfig);
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error("Error fetching WhatsApp config:", error);
      res.status(500).json({ message: "Failed to fetch WhatsApp config" });
    }
  });

  app.post("/api/whatsapp/config", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const configData = insertWhatsappConfigSchema.parse(req.body);
      const config = await storage.upsertWhatsappConfig(userId, configData);
      
      // Don't expose sensitive data in response
      const { accessToken, ...safeConfig } = config;
      res.json(safeConfig);
    } catch (error) {
      console.error("Error saving WhatsApp config:", error);
      res.status(500).json({ message: "Failed to save WhatsApp config" });
    }
  });

  app.post("/api/whatsapp/test", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await whatsappService.testConnection(userId);
      res.json(result);
    } catch (error) {
      console.error("Error testing WhatsApp connection:", error);
      res.status(500).json({ message: "Failed to test WhatsApp connection" });
    }
  });

  // Dashboard stats route
  app.get("/api/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Recent messages route
  app.get("/api/messages/recent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      const messages = await storage.getRecentMessages(userId, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching recent messages:", error);
      res.status(500).json({ message: "Failed to fetch recent messages" });
    }
  });

  // WhatsApp webhook endpoint (for receiving messages from Meta)
  app.get("/api/webhook/whatsapp", (req, res) => {
    const verifyToken = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    const mode = req.query["hub.mode"];

    if (mode === "subscribe" && verifyToken === process.env.WHATSAPP_VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.status(403).json({ error: "Invalid verify token" });
    }
  });

  app.post("/api/webhook/whatsapp", async (req, res) => {
    try {
      const body = req.body;
      
      if (body.object === "whatsapp_business_account") {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            if (change.field === "messages") {
              await whatsappService.handleIncomingMessage(change.value);
            }
          }
        }
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error handling WhatsApp webhook:", error);
      res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        console.log('Received WebSocket message:', data);
        
        // Handle different message types
        if (data.type === 'subscribe') {
          // Subscribe to specific channels (flows, logs, etc.)
          ws.send(JSON.stringify({ type: 'subscribed', channel: data.channel }));
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  // Export WebSocket server for use in other services
  (httpServer as any).wss = wss;

  return httpServer;
}
