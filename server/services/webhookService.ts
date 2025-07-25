import { storage } from "../storage";

class WebhookService {
  async executeWebhook(webhookId: string, payload: Record<string, any>): Promise<{
    success: boolean;
    status?: number;
    response?: any;
    error?: string;
    responseTime?: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Get webhook configuration
      const webhooks = await storage.getUserWebhooks(""); // This needs to be improved
      const webhook = webhooks.find(w => w.id === webhookId);
      
      if (!webhook) {
        throw new Error("Webhook not found");
      }

      if (!webhook.isActive) {
        throw new Error("Webhook is not active");
      }

      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (webhook.headers) {
        Object.assign(headers, webhook.headers);
      }

      // Make HTTP request
      const response = await fetch(webhook.url, {
        method: webhook.method || "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const responseTime = Date.now() - startTime;
      const responseBody = await response.text();

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseBody);
      } catch {
        parsedResponse = responseBody;
      }

      // Log webhook execution
      await storage.createWebhookLog({
        webhookId: webhook.id,
        requestPayload: payload,
        responseStatus: response.status,
        responseBody: responseBody,
        responseTime,
        error: null,
      });

      return {
        success: response.ok,
        status: response.status,
        response: parsedResponse,
        responseTime,
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Log webhook error
      await storage.createWebhookLog({
        webhookId,
        requestPayload: payload,
        responseStatus: null,
        responseBody: null,
        responseTime,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
        responseTime,
      };
    }
  }

  async testWebhook(webhookId: string, testPayload: Record<string, any>): Promise<{
    success: boolean;
    status?: number;
    response?: any;
    error?: string;
    responseTime?: number;
  }> {
    return await this.executeWebhook(webhookId, testPayload);
  }
}

export const webhookService = new WebhookService();
