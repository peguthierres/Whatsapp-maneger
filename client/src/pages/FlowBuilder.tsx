import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import NodePalette from "@/components/flow/NodePalette";
import FlowCanvas from "@/components/flow/FlowCanvas";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FlowBuilder() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);

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

  const { data: flows } = useQuery({
    queryKey: ["/api/flows"],
    retry: false,
  });

  const { data: nodes } = useQuery({
    queryKey: ["/api/flows", selectedFlowId, "nodes"],
    enabled: !!selectedFlowId,
    retry: false,
  });

  const { data: links } = useQuery({
    queryKey: ["/api/flows", selectedFlowId, "links"],
    enabled: !!selectedFlowId,
    retry: false,
  });

  const saveFlowMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFlowId) return;
      // This would save the current flow state
      await apiRequest("PUT", `/api/flows/${selectedFlowId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Flow saved successfully",
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
        description: "Failed to save flow",
        variant: "destructive",
      });
    },
  });

  const createNodeMutation = useMutation({
    mutationFn: async (nodeData: any) => {
      if (!selectedFlowId) return;
      const response = await apiRequest("POST", `/api/flows/${selectedFlowId}/nodes`, nodeData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flows", selectedFlowId, "nodes"] });
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
        description: "Failed to create node",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  // Set first flow as selected if none selected
  useEffect(() => {
    if (flows?.length && !selectedFlowId) {
      setSelectedFlowId(flows[0].id);
    }
  }, [flows, selectedFlowId]);

  const handleCreateNode = (nodeType: string, position: { x: number; y: number }) => {
    const nodeConfig = {
      nodeType,
      name: `${nodeType.charAt(0).toUpperCase()}${nodeType.slice(1)} Node`,
      config: getDefaultNodeConfig(nodeType),
      position,
    };

    createNodeMutation.mutate(nodeConfig);
  };

  const getDefaultNodeConfig = (nodeType: string) => {
    switch (nodeType) {
      case "message":
        return { message: "Hello! How can I help you?", waitForResponse: false };
      case "condition":
        return { conditions: [], defaultTargetNodeId: null };
      case "webhook":
        return { webhookId: "", payload: {} };
      case "delay":
        return { delayMs: 1000 };
      default:
        return {};
    }
  };

  return (
    <div className="min-h-screen bg-hsl(60,4.8%,95.9%)">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col">
        <Header 
          title="Flow Builder"
          actions={
            <div className="flex items-center space-x-3">
              <Select value={selectedFlowId || ""} onValueChange={setSelectedFlowId}>
                <SelectTrigger className="w-64">
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
              <Button 
                onClick={() => saveFlowMutation.mutate()}
                disabled={saveFlowMutation.isPending || !selectedFlowId}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Save Flow
              </Button>
            </div>
          }
        />
        
        <main className="flex-1 flex">
          {selectedFlowId ? (
            <>
              <NodePalette />
              <FlowCanvas
                nodes={nodes || []}
                links={links || []}
                onCreateNode={handleCreateNode}
                flowId={selectedFlowId}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-24 h-24 mx-auto mb-4 text-hsl(25,5.3%,44.7%)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-medium text-hsl(20,14.3%,4.1%) mb-2">No Flow Selected</h3>
                <p className="text-hsl(25,5.3%,44.7%) mb-4">Create or select a flow to start building your chatbot</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
