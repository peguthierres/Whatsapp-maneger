import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function MessageLogs() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [filter, setFilter] = useState("all");

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

  const { data: logs, isLoading: logsLoading, refetch } = useQuery({
    queryKey: ["/api/logs"],
    retry: false,
  });

  const { data: flows } = useQuery({
    queryKey: ["/api/flows"],
    retry: false,
  });

  if (!isAuthenticated) {
    return null;
  }

  const filteredLogs = logs?.filter((log: any) => {
    if (filter === "all") return true;
    if (filter === "incoming") return log.direction === "incoming";
    if (filter === "outgoing") return log.direction === "outgoing";
    if (filter === "errors") return log.status === "failed";
    return true;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
      case "delivered":
      case "read":
        return (
          <Badge className="bg-hsl(142,76%,36%) text-white">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Processed
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-hsl(48,96%,53%) text-black">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Processing
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDirectionBadge = (direction: string) => {
    return direction === "incoming" ? (
      <Badge className="bg-hsl(207,90%,54%) text-white">
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
        Incoming
      </Badge>
    ) : (
      <Badge className="bg-hsl(142,76%,36%) text-white">
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
        Outgoing
      </Badge>
    );
  };

  const getFlowName = (flowId: string) => {
    const flow = flows?.find((f: any) => f.id === flowId);
    return flow?.name || "Unknown Flow";
  };

  return (
    <div className="min-h-screen bg-hsl(60,4.8%,95.9%)">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col">
        <Header title="Message Logs" />
        
        <main className="flex-1 p-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Message Logs</CardTitle>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-hsl(25,5.3%,44.7%)">Filter:</label>
                    <Select value={filter} onValueChange={setFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Messages</SelectItem>
                        <SelectItem value="incoming">Incoming</SelectItem>
                        <SelectItem value="outgoing">Outgoing</SelectItem>
                        <SelectItem value="errors">Errors</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => refetch()}
                    disabled={logsLoading}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {logsLoading ? (
                <div className="p-6">
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-hsl(60,4.8%,95.9%) rounded animate-pulse"></div>
                    ))}
                  </div>
                </div>
              ) : filteredLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Phone Number</TableHead>
                        <TableHead>Direction</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Flow</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {new Date(log.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm font-medium">
                            {log.phoneNumber}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {getDirectionBadge(log.direction)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-sm">
                            {log.message}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm">
                            {log.flowId ? getFlowName(log.flowId) : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {getStatusBadge(log.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 mx-auto mb-4 text-hsl(25,5.3%,44.7%)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <h3 className="text-lg font-medium text-hsl(20,14.3%,4.1%) mb-2">No Messages Found</h3>
                  <p className="text-hsl(25,5.3%,44.7%)">
                    {filter === "all" 
                      ? "No messages have been logged yet" 
                      : `No ${filter} messages found`
                    }
                  </p>
                </div>
              )}
              
              {filteredLogs.length > 0 && (
                <div className="px-6 py-4 border-t border-hsl(20,5.9%,90%) flex items-center justify-between">
                  <div className="flex items-center text-sm text-hsl(25,5.3%,44.7%)">
                    Showing {filteredLogs.length} of {logs?.length || 0} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" disabled>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" className="bg-hsl(207,90%,54%) text-white">
                      1
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
