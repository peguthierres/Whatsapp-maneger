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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Webhooks() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: "",
    flowId: "",
    url: "",
    method: "POST",
    headers: "{}",
    isActive: true,
  });
  
  const [testPayload, setTestPayload] = useState(
    JSON.stringify({
      message: "Test message",
      from: "+5511999999999",
      timestamp: new Date().toISOString(),
    }, null, 2)
  );
  
  const [testResult, setTestResult] = useState<any>(null);

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

  const { data: webhooks, isLoading: webhooksLoading } = useQuery({
    queryKey: ["/api/webhooks"],
    retry: false,
  });

  const { data: flows } = useQuery({
    queryKey: ["/api/flows"],
    retry: false,
  });

  const createWebhookMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/webhooks", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Webhook created successfully",
      });
      setFormData({
        name: "",
        flowId: "",
        url: "",
        method: "POST",
        headers: "{}",
        isActive: true,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
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
        description: "Failed to create webhook",
        variant: "destructive",
      });
    },
  });

  const testWebhookMutation = useMutation({
    mutationFn: async ({ webhookId, payload }: { webhookId: string; payload: any }) => {
      const response = await apiRequest("POST", `/api/webhooks/${webhookId}/test`, payload);
      return response.json();
    },
    onSuccess: (result) => {
      setTestResult(result);
      toast({
        title: "Test Complete",
        description: `Webhook test ${result.success ? 'succeeded' : 'failed'}`,
        variant: result.success ? "default" : "destructive",
      });
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
        description: "Failed to test webhook",
        variant: "destructive",
      });
    },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      await apiRequest("DELETE", `/api/webhooks/${webhookId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Webhook deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
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
        description: "Failed to delete webhook",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const parsedHeaders = JSON.parse(formData.headers);
      createWebhookMutation.mutate({
        ...formData,
        headers: parsedHeaders,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid JSON in headers field",
        variant: "destructive",
      });
    }
  };

  const handleTestWebhook = (webhookId: string) => {
    try {
      const payload = JSON.parse(testPayload);
      testWebhookMutation.mutate({ webhookId, payload });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid JSON in test payload",
        variant: "destructive",
      });
    }
  };

  const getFlowName = (flowId: string) => {
    const flow = flows?.find((f: any) => f.id === flowId);
    return flow?.name || "Unknown Flow";
  };

  return (
    <div className="min-h-screen bg-hsl(60,4.8%,95.9%)">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col">
        <Header title="Webhooks" />
        
        <main className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Webhook Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Webhook Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Webhook name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="flow">Flow</Label>
                    <Select value={formData.flowId} onValueChange={(value) => setFormData({ ...formData, flowId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a flow" />
                      </SelectTrigger>
                      <SelectContent>
                        {flows?.map((flow: any) => (
                          <SelectItem key={flow.id} value={flow.id}>
                            {flow.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="url">Webhook URL</Label>
                    <Input
                      id="url"
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://your-api.com/webhook"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="method">HTTP Method</Label>
                    <Select value={formData.method} onValueChange={(value) => setFormData({ ...formData, method: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="headers">Headers (JSON)</Label>
                    <Textarea
                      id="headers"
                      value={formData.headers}
                      onChange={(e) => setFormData({ ...formData, headers: e.target.value })}
                      placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                      className="h-24"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="active"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                    />
                    <Label htmlFor="active">Active</Label>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={createWebhookMutation.isPending}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Save Webhook
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Webhook Testing */}
            <Card>
              <CardHeader>
                <CardTitle>Test Webhook</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="testPayload">Test Payload</Label>
                    <Textarea
                      id="testPayload"
                      value={testPayload}
                      onChange={(e) => setTestPayload(e.target.value)}
                      className="h-32 font-mono text-xs"
                    />
                  </div>
                  
                  <Button
                    className="w-full bg-hsl(240,50%,60%) hover:bg-hsl(240,50%,50%)"
                    disabled={testWebhookMutation.isPending || !webhooks?.length}
                    onClick={() => webhooks?.length && handleTestWebhook(webhooks[0].id)}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Test Request
                  </Button>
                  
                  {/* Test Results */}
                  {testResult && (
                    <div className="mt-4 p-4 bg-hsl(60,4.8%,95.9%) rounded-lg">
                      <h4 className="text-sm font-medium text-hsl(20,14.3%,4.1%) mb-2">Last Test Result</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-hsl(25,5.3%,44.7%)">Status:</span>
                          <span className={`font-medium ${testResult.success ? 'text-hsl(142,76%,36%)' : 'text-hsl(0,84.2%,60.2%)'}`}>
                            {testResult.status ? `${testResult.status} ${testResult.success ? 'OK' : 'Error'}` : 'Failed'}
                          </span>
                        </div>
                        {testResult.responseTime && (
                          <div className="flex justify-between">
                            <span className="text-hsl(25,5.3%,44.7%)">Response Time:</span>
                            <span className="text-hsl(20,14.3%,4.1%)">{testResult.responseTime}ms</span>
                          </div>
                        )}
                        <div>
                          <span className="text-hsl(25,5.3%,44.7%)">Response:</span>
                          <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                            {JSON.stringify(testResult.response || testResult.error, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Existing Webhooks */}
          <Card>
            <CardHeader>
              <CardTitle>Configured Webhooks</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {webhooksLoading ? (
                <div className="p-6">
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-hsl(60,4.8%,95.9%) rounded animate-pulse"></div>
                    ))}
                  </div>
                </div>
              ) : webhooks?.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Flow</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {webhooks.map((webhook: any) => (
                        <TableRow key={webhook.id}>
                          <TableCell className="font-medium">{webhook.name}</TableCell>
                          <TableCell>{webhook.flowId ? getFlowName(webhook.flowId) : "Global"}</TableCell>
                          <TableCell className="max-w-xs truncate">{webhook.url}</TableCell>
                          <TableCell>{webhook.method}</TableCell>
                          <TableCell>
                            {webhook.isActive ? (
                              <Badge className="bg-hsl(142,76%,36%) text-white">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTestWebhook(webhook.id)}
                                disabled={testWebhookMutation.isPending}
                              >
                                Test
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteWebhookMutation.mutate(webhook.id)}
                                disabled={deleteWebhookMutation.isPending}
                                className="text-hsl(0,84.2%,60.2%) hover:text-hsl(0,84.2%,50.2%)"
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 mx-auto mb-4 text-hsl(25,5.3%,44.7%)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <h3 className="text-lg font-medium text-hsl(20,14.3%,4.1%) mb-2">No Webhooks Configured</h3>
                  <p className="text-hsl(25,5.3%,44.7%)">Create your first webhook to integrate with external services</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
