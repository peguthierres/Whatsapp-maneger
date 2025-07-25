import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { FlowNode as FlowNodeType } from "@shared/schema";

interface FlowNodeProps {
  node: FlowNodeType;
  position: { x: number; y: number };
  flowId: string;
}

const nodeTypeConfig = {
  message: {
    color: "border-hsl(207,90%,54%) bg-hsl(207,90%,97%)",
    icon: (
      <svg className="w-4 h-4 text-hsl(207,90%,54%)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  condition: {
    color: "border-hsl(240,50%,60%) bg-hsl(240,50%,95%)",
    icon: (
      <svg className="w-4 h-4 text-hsl(240,50%,60%)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  webhook: {
    color: "border-hsl(142,76%,36%) bg-hsl(142,76%,90%)",
    icon: (
      <svg className="w-4 h-4 text-hsl(142,76%,36%)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  delay: {
    color: "border-hsl(48,96%,53%) bg-hsl(48,96%,95%)",
    icon: (
      <svg className="w-4 h-4 text-hsl(48,96%,53%)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export default function FlowNode({ node, position, flowId }: FlowNodeProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: node.name,
    config: node.config,
  });

  const config = nodeTypeConfig[node.nodeType as keyof typeof nodeTypeConfig] || nodeTypeConfig.message;

  const updateNodeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/flows/${flowId}/nodes/${node.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Node updated successfully",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/flows", flowId, "nodes"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update node",
        variant: "destructive",
      });
    },
  });

  const deleteNodeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/flows/${flowId}/nodes/${node.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Node deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/flows", flowId, "nodes"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete node",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateNodeMutation.mutate(editData);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this node?")) {
      deleteNodeMutation.mutate();
    }
  };

  const renderNodeConfig = () => {
    const nodeConfig = node.config as any;

    switch (node.nodeType) {
      case "message":
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-hsl(20,14.3%,4.1%) mb-1">
                Message
              </label>
              <Textarea
                value={(editData.config as any)?.message || ""}
                onChange={(e) => setEditData({
                  ...editData,
                  config: { ...editData.config, message: e.target.value }
                })}
                placeholder="Enter message text"
                rows={3}
              />
            </div>
          </div>
        );
      case "delay":
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-hsl(20,14.3%,4.1%) mb-1">
                Delay (milliseconds)
              </label>
              <Input
                type="number"
                value={(editData.config as any)?.delayMs || 1000}
                onChange={(e) => setEditData({
                  ...editData,
                  config: { ...editData.config, delayMs: parseInt(e.target.value) }
                })}
                placeholder="1000"
              />
            </div>
          </div>
        );
      default:
        return (
          <div className="text-sm text-hsl(25,5.3%,44.7%)">
            No configuration options for this node type.
          </div>
        );
    }
  };

  const getNodeDescription = () => {
    const nodeConfig = node.config as any;
    switch (node.nodeType) {
      case "message":
        return nodeConfig?.message?.substring(0, 50) + (nodeConfig?.message?.length > 50 ? "..." : "");
      case "delay":
        return `Wait ${nodeConfig?.delayMs || 1000}ms`;
      default:
        return "Click to configure";
    }
  };

  return (
    <div
      className={`absolute bg-white rounded-lg border-2 ${config.color} p-4 shadow-lg min-w-48 max-w-64`}
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {config.icon}
          <span className="text-sm font-semibold text-hsl(20,14.3%,4.1%)">{node.name}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit {node.nodeType} Node</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-hsl(20,14.3%,4.1%) mb-1">
                    Node Name
                  </label>
                  <Input
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    placeholder="Node name"
                  />
                </div>
                {renderNodeConfig()}
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={updateNodeMutation.isPending}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 text-hsl(0,84.2%,60.2%) hover:text-hsl(0,84.2%,50.2%)"
            onClick={handleDelete}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      </div>
      <p className="text-xs text-hsl(25,5.3%,44.7%) mb-2">{getNodeDescription()}</p>
      
      {/* Connection points */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-hsl(207,90%,54%) rounded-full border-2 border-white"></div>
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-hsl(25,5.3%,44.7%) rounded-full border-2 border-white"></div>
    </div>
  );
}
