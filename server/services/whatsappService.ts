import { storage } from "../storage";
import { flowEngine } from "./flowEngine";

interface WhatsAppMessage {
  from: string;
  text?: { body: string };
  type: string;
  id: string;
  timestamp: string;
}

interface WhatsAppWebhookValue {
  messaging_product: string;
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: Array<{
    profile: { name: string };
    wa_id: string;
  }>;
  messages?: WhatsAppMessage[];
  statuses?: Array<{
    id: string;
    status: string;
    timestamp: string;
    recipient_id: string;
  }>;
}

class WhatsAppService {
  private readonly baseUrl = "https://graph.facebook.com/v18.0";

  async sendMessage(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const url = `${this.baseUrl}/${phoneNumberId}/messages`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to,
          type: "text",
          text: { body: message },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          messageId: data.messages[0].id,
        };
      } else {
        return {
          success: false,
          error: data.error?.message || "Failed to send message",
        };
      }
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      return {
        success: false,
        error: "Network error or invalid configuration",
      };
    }
  }

  async testConnection(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const config = await storage.getUserWhatsappConfig(userId);
      
      if (!config) {
        return { success: false, error: "WhatsApp configuration not found" };
      }

      // Test by getting business phone number info
      const url = `${this.baseUrl}/${config.phoneNumberId}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${config.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update config with fetched data
        await storage.upsertWhatsappConfig(userId, {
          ...config,
          phoneNumber: data.display_phone_number,
          isActive: true,
        });

        return { success: true };
      } else {
        const error = await response.json();
        return {
          success: false,
          error: error.error?.message || "Failed to connect to WhatsApp API",
        };
      }
    } catch (error) {
      console.error("Error testing WhatsApp connection:", error);
      return {
        success: false,
        error: "Network error or invalid configuration",
      };
    }
  }

  async handleIncomingMessage(webhookValue: WhatsAppWebhookValue): Promise<void> {
    try {
      if (!webhookValue.messages) {
        // Handle status updates
        if (webhookValue.statuses) {
          await this.handleMessageStatuses(webhookValue.statuses);
        }
        return;
      }

      const phoneNumberId = webhookValue.metadata.phone_number_id;
      
      // Find user with this phone number ID
      // For now, we'll need to implement a way to map phone number IDs to users
      // This is a simplified implementation
      
      for (const message of webhookValue.messages) {
        const phoneNumber = message.from;
        const messageText = message.text?.body || "";

        // Log incoming message
        // We need to find the user associated with this phone number ID
        // For now, we'll skip this step and implement it later
        
        // Process message through flow engine
        await flowEngine.processMessage(phoneNumber, messageText, phoneNumberId);
      }
    } catch (error) {
      console.error("Error handling incoming WhatsApp message:", error);
    }
  }

  async handleMessageStatuses(statuses: Array<{
    id: string;
    status: string;
    timestamp: string;
    recipient_id: string;
  }>): Promise<void> {
    // Update message status in database
    // This would require matching message IDs with our logged messages
    console.log("Handling message statuses:", statuses);
  }

  async getUserByPhoneNumberId(phoneNumberId: string): Promise<string | null> {
    // This would require a way to map phone number IDs to user IDs
    // For now, return null
    return null;
  }
}

export const whatsappService = new WhatsAppService();
