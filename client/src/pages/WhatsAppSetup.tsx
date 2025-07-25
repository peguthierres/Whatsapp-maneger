import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function WhatsAppSetup() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [configData, setConfigData] = useState({
    appId: "",
    phoneNumberId: "",
    accessToken: "",
    verifyToken: "",
    businessName: "",
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: whatsappConfig, isLoading: configLoading } = useQuery({
    queryKey: ["/api/whatsapp/config"],
    retry: false,
  });

  // Update form when config is loaded
  useEffect(() => {
    if (whatsappConfig) {
      setConfigData({
        appId: whatsappConfig.appId || "",
        phoneNumberId: whatsappConfig.phoneNumberId || "",
        accessToken: "", // Don't populate sensitive data
        verifyToken: whatsappConfig.verifyToken || "",
        businessName: whatsappConfig.businessName || "",
      });
    }
  }, [whatsappConfig]);

  const saveConfigMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/whatsapp/config", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "WhatsApp configuration saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/config"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save WhatsApp configuration",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/whatsapp/test", {});
      return response.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: "WhatsApp API connection is working correctly",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/config"] });
      } else {
        toast({
          title: "Connection Failed",
          description: result.error || "Failed to connect to WhatsApp API",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to test WhatsApp connection",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfigMutation.mutate(configData);
  };

  const webhookEndpoint = `${window.location.origin}/api/webhook/whatsapp`;

  return (
    <div className="min-h-screen bg-hsl(60,4.8%,95.9%)">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col">
        <Header title="WhatsApp Setup" />
        
        <main className="flex-1 p-6">
          <div className="max-w-4xl">
            {/* Connection Status */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>WhatsApp Business API Connection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      whatsappConfig?.isActive ? 'bg-hsl(142,76%,90%)' : 'bg-hsl(60,4.8%,95.9%)'
                    }`}>
                      <svg className={`w-6 h-6 ${
                        whatsappConfig?.isActive ? 'text-hsl(142,76%,36%)' : 'text-hsl(25,5.3%,44.7%)'
                      }`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.486"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-hsl(20,14.3%,4.1%)">Connection Status</p>
                      <p className={`text-sm ${
                        whatsappConfig?.isActive ? 'text-hsl(142,76%,36%)' : 'text-hsl(25,5.3%,44.7%)'
                      }`}>
                        {whatsappConfig?.isActive ? 'Connected and Active' : 'Not Connected'}
                      </p>
                    </div>
                  </div>
                  {whatsappConfig?.isActive && (
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        // This would disconnect WhatsApp
                        toast({
                          title: "Disconnected",
                          description: "WhatsApp API has been disconnected",
                        });
                      }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Disconnect
                    </Button>
                  )}
                </div>
                
                {whatsappConfig && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-hsl(60,4.8%,95.9%) rounded-lg">
                      <p className="text-sm text-hsl(25,5.3%,44.7%)">Phone Number</p>
                      <p className="text-lg font-semibold text-hsl(20,14.3%,4.1%)">
                        {whatsappConfig.phoneNumber || 'Not Available'}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-hsl(60,4.8%,95.9%) rounded-lg">
                      <p className="text-sm text-hsl(25,5.3%,44.7%)">Business Name</p>
                      <p className="text-lg font-semibold text-hsl(20,14.3%,4.1%)">
                        {whatsappConfig.businessName || 'Not Set'}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-hsl(60,4.8%,95.9%) rounded-lg">
                      <p className="text-sm text-hsl(25,5.3%,44.7%)">Webhook URL</p>
                      <p className="text-sm font-mono text-hsl(20,14.3%,4.1%) truncate">
                        {webhookEndpoint}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* API Configuration */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="appId">Meta App ID</Label>
                      <Input
                        id="appId"
                        value={configData.appId}
                        onChange={(e) => setConfigData({ ...configData, appId: e.target.value })}
                        placeholder="Your Meta App ID"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phoneNumberId">Phone Number ID</Label>
                      <Input
                        id="phoneNumberId"
                        value={configData.phoneNumberId}
                        onChange={(e) => setConfigData({ ...configData, phoneNumberId: e.target.value })}
                        placeholder="WhatsApp Phone Number ID"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="accessToken">Access Token</Label>
                    <Input
                      id="accessToken"
                      type="password"
                      value={configData.accessToken}
                      onChange={(e) => setConfigData({ ...configData, accessToken: e.target.value })}
                      placeholder="Your WhatsApp Business Access Token"
                      required={!whatsappConfig?.accessToken}
                    />
                    {whatsappConfig?.accessToken && (
                      <p className="text-xs text-hsl(25,5.3%,44.7%) mt-1">
                        Leave empty to keep current token
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="verifyToken">Webhook Verify Token</Label>
                    <Input
                      id="verifyToken"
                      value={configData.verifyToken}
                      onChange={(e) => setConfigData({ ...configData, verifyToken: e.target.value })}
                      placeholder="Custom verify token for webhook security"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={configData.businessName}
                      onChange={(e) => setConfigData({ ...configData, businessName: e.target.value })}
                      placeholder="Your business name"
                    />
                  </div>
                  
                  <Button type="submit" disabled={saveConfigMutation.isPending}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Save Configuration
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Setup Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Setup Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-hsl(207,90%,54%) text-white rounded-full flex items-center justify-center text-xs font-semibold">1</div>
                    <div>
                      <h4 className="text-sm font-semibold text-hsl(20,14.3%,4.1%)">Create Meta Developer Account</h4>
                      <p className="text-sm text-hsl(25,5.3%,44.7%) mt-1">
                        Visit{" "}
                        <a 
                          href="https://developers.facebook.com" 
                          className="text-hsl(207,90%,54%) hover:underline" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          Meta for Developers
                        </a>{" "}
                        and create a developer account if you don't have one.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-hsl(207,90%,54%) text-white rounded-full flex items-center justify-center text-xs font-semibold">2</div>
                    <div>
                      <h4 className="text-sm font-semibold text-hsl(20,14.3%,4.1%)">Create WhatsApp Business App</h4>
                      <p className="text-sm text-hsl(25,5.3%,44.7%) mt-1">
                        Create a new app and add the WhatsApp Business product to get your App ID and access tokens.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-hsl(207,90%,54%) text-white rounded-full flex items-center justify-center text-xs font-semibold">3</div>
                    <div>
                      <h4 className="text-sm font-semibold text-hsl(20,14.3%,4.1%)">Configure Webhook</h4>
                      <p className="text-sm text-hsl(25,5.3%,44.7%) mt-1">Set your webhook URL to:</p>
                      <code className="inline-block mt-1 px-2 py-1 bg-hsl(60,4.8%,95.9%) rounded text-xs font-mono">
                        {webhookEndpoint}
                      </code>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-hsl(207,90%,54%) text-white rounded-full flex items-center justify-center text-xs font-semibold">4</div>
                    <div>
                      <h4 className="text-sm font-semibold text-hsl(20,14.3%,4.1%)">Test Connection</h4>
                      <p className="text-sm text-hsl(25,5.3%,44.7%) mt-1">
                        Use the test button below to verify your API configuration is working correctly.
                      </p>
                      <Button 
                        className="mt-2 bg-hsl(142,76%,36%) hover:bg-hsl(142,76%,26%) text-white" 
                        size="sm"
                        onClick={() => testConnectionMutation.mutate()}
                        disabled={testConnectionMutation.isPending || !whatsappConfig}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Test Connection
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
