import { storage } from "../storage";
import { whatsappService } from "./whatsappService";
import { webhookService } from "./webhookService";
import type { Flow, FlowNode, FlowLink, UserSession } from "@shared/schema";

interface FlowExecutionContext {
  phoneNumber: string;
  currentMessage: string;
  sessionData: Record<string, any>;
  userSession: UserSession | null;
}

class FlowEngine {
  async processMessage(
    phoneNumber: string,
    message: string,
    phoneNumberId: string
  ): Promise<void> {
    try {
      // Get or create user session
      let userSession = await storage.getUserSession(phoneNumber);
      
      if (!userSession) {
        // Find matching flow based on trigger keywords
        const matchingFlow = await this.findMatchingFlow(message);
        
        if (matchingFlow) {
          // Create new session
          userSession = await storage.upsertUserSession({
            phoneNumber,
            flowId: matchingFlow.id,
            currentNodeId: null,
            sessionData: {},
            lastActivity: new Date(),
          });
        } else {
          // No matching flow found, send default response
          await this.sendDefaultResponse(phoneNumber, phoneNumberId);
          return;
        }
      }

      // Update session activity
      await storage.updateUserSession(phoneNumber, {
        lastActivity: new Date(),
      });

      if (!userSession.flowId) {
        return;
      }

      // Get flow and current node
      const flow = await storage.getFlow(userSession.flowId);
      if (!flow) {
        console.error("Flow not found:", userSession.flowId);
        return;
      }

      // Log incoming message
      await this.logMessage(
        flow.userId,
        userSession.flowId,
        phoneNumber,
        "incoming",
        message
      );

      // Execute flow
      await this.executeFlow(flow, userSession, {
        phoneNumber,
        currentMessage: message,
        sessionData: userSession.sessionData || {},
        userSession,
      });

    } catch (error) {
      console.error("Error processing message:", error);
    }
  }

  async findMatchingFlow(message: string): Promise<Flow | null> {
    // Get all active flows and check trigger keywords
    // For now, we'll implement a simple keyword matching
    // In a real implementation, this would be more sophisticated
    
    // This is a simplified version - in reality, we'd need to iterate through
    // all users' flows or have a global trigger system
    return null;
  }

  async executeFlow(
    flow: Flow,
    userSession: UserSession,
    context: FlowExecutionContext
  ): Promise<void> {
    const nodes = await storage.getFlowNodes(flow.id);
    const links = await storage.getFlowLinks(flow.id);

    let currentNode: FlowNode | null = null;

    if (userSession.currentNodeId) {
      currentNode = nodes.find(n => n.id === userSession.currentNodeId) || null;
    } else {
      // Find start node (first node or node with no incoming links)
      const nodeIds = new Set(nodes.map(n => n.id));
      const targetNodeIds = new Set(links.map(l => l.targetNodeId));
      const startNodeIds = [...nodeIds].filter(id => !targetNodeIds.has(id));
      
      if (startNodeIds.length > 0) {
        currentNode = nodes.find(n => n.id === startNodeIds[0]) || null;
      }
    }

    if (!currentNode) {
      console.error("No current node found for flow execution");
      return;
    }

    // Execute current node
    const nextNodeId = await this.executeNode(currentNode, context, flow.userId);

    // Update session with next node
    await storage.updateUserSession(context.phoneNumber, {
      currentNodeId: nextNodeId,
      sessionData: context.sessionData,
    });
  }

  async executeNode(
    node: FlowNode,
    context: FlowExecutionContext,
    userId: string
  ): Promise<string | null> {
    const config = node.config as any;

    switch (node.nodeType) {
      case "message":
        return await this.executeMessageNode(node, context, userId);
      
      case "condition":
        return await this.executeConditionNode(node, context);
      
      case "webhook":
        return await this.executeWebhookNode(node, context);
      
      case "delay":
        return await this.executeDelayNode(node, context);
      
      default:
        console.error("Unknown node type:", node.nodeType);
        return null;
    }
  }

  async executeMessageNode(
    node: FlowNode,
    context: FlowExecutionContext,
    userId: string
  ): Promise<string | null> {
    const config = node.config as { message: string; waitForResponse?: boolean };
    
    // Get user's WhatsApp config
    const whatsappConfig = await storage.getUserWhatsappConfig(userId);
    if (!whatsappConfig) {
      console.error("WhatsApp config not found for user:", userId);
      return null;
    }

    // Send message
    const result = await whatsappService.sendMessage(
      whatsappConfig.phoneNumberId,
      whatsappConfig.accessToken,
      context.phoneNumber,
      config.message
    );

    // Log outgoing message
    await this.logMessage(
      userId,
      context.userSession?.flowId || null,
      context.phoneNumber,
      "outgoing",
      config.message,
      result.success ? "sent" : "failed"
    );

    if (config.waitForResponse) {
      // Stay on current node, waiting for user response
      return node.id;
    } else {
      // Move to next node
      return await this.getNextNodeId(node.flowId, node.id);
    }
  }

  async executeConditionNode(
    node: FlowNode,
    context: FlowExecutionContext
  ): Promise<string | null> {
    const config = node.config as {
      conditions: Array<{
        field: string;
        operator: string;
        value: string;
        targetNodeId: string;
      }>;
      defaultTargetNodeId?: string;
    };

    // Evaluate conditions against current message or session data
    for (const condition of config.conditions) {
      if (this.evaluateCondition(condition, context)) {
        return condition.targetNodeId;
      }
    }

    // Return default target or next node
    return config.defaultTargetNodeId || await this.getNextNodeId(node.flowId, node.id);
  }

  async executeWebhookNode(
    node: FlowNode,
    context: FlowExecutionContext
  ): Promise<string | null> {
    const config = node.config as {
      webhookId: string;
      payload?: Record<string, any>;
    };

    // Execute webhook
    const payload = {
      ...config.payload,
      phoneNumber: context.phoneNumber,
      message: context.currentMessage,
      sessionData: context.sessionData,
    };

    await webhookService.executeWebhook(config.webhookId, payload);

    // Move to next node
    return await this.getNextNodeId(node.flowId, node.id);
  }

  async executeDelayNode(
    node: FlowNode,
    context: FlowExecutionContext
  ): Promise<string | null> {
    const config = node.config as { delayMs: number };

    // In a real implementation, this would use a job queue
    // For now, we'll just add a delay
    setTimeout(async () => {
      const nextNodeId = await this.getNextNodeId(node.flowId, node.id);
      if (nextNodeId) {
        await storage.updateUserSession(context.phoneNumber, {
          currentNodeId: nextNodeId,
        });
        
        // Continue execution
        const flow = await storage.getFlow(node.flowId);
        if (flow && context.userSession) {
          await this.executeFlow(flow, context.userSession, context);
        }
      }
    }, config.delayMs);

    // Return current node ID to wait
    return node.id;
  }

  evaluateCondition(
    condition: { field: string; operator: string; value: string },
    context: FlowExecutionContext
  ): boolean {
    let fieldValue: string;

    switch (condition.field) {
      case "message":
        fieldValue = context.currentMessage.toLowerCase();
        break;
      default:
        fieldValue = context.sessionData[condition.field] || "";
    }

    switch (condition.operator) {
      case "equals":
        return fieldValue === condition.value.toLowerCase();
      case "contains":
        return fieldValue.includes(condition.value.toLowerCase());
      case "starts_with":
        return fieldValue.startsWith(condition.value.toLowerCase());
      default:
        return false;
    }
  }

  async getNextNodeId(flowId: string, currentNodeId: string): Promise<string | null> {
    const links = await storage.getFlowLinks(flowId);
    const nextLink = links.find(l => l.sourceNodeId === currentNodeId);
    return nextLink?.targetNodeId || null;
  }

  async logMessage(
    userId: string,
    flowId: string | null,
    phoneNumber: string,
    direction: "incoming" | "outgoing",
    message: string,
    status: string = "processed"
  ): Promise<void> {
    await storage.createMessageLog(userId, {
      flowId,
      phoneNumber,
      direction,
      message,
      messageType: "text",
      status,
      metadata: {},
    });
  }

  async sendDefaultResponse(phoneNumber: string, phoneNumberId: string): Promise<void> {
    // This would need to find the appropriate user and send a default response
    // For now, we'll skip this implementation
    console.log("Sending default response to:", phoneNumber);
  }
}

export const flowEngine = new FlowEngine();
