import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    retry: false,
  });

  const { data: recentMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/messages/recent"],
    retry: false,
  });

  const { data: flows } = useQuery({
    queryKey: ["/api/flows"],
    retry: false,
  });

  if (!isAuthenticated) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
      case "delivered":
      case "read":
        return <Badge className="bg-hsl(142,76%,36%) text-white">Delivered</Badge>;
      case "processing":
        return <Badge className="bg-hsl(207,90%,54%) text-white">Processing</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
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

  const topFlows = flows?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-hsl(60,4.8%,95.9%)">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col">
        <Header title="Dashboard" />
        
        <main className="flex-1 p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Active Flows"
              value={statsLoading ? "..." : stats?.activeFlows?.toString() || "0"}
              icon="robot"
              color="blue"
            />
            <StatsCard
              title="Messages Today"
              value={statsLoading ? "..." : stats?.messagesToday?.toString() || "0"}
              icon="messages"
              color="green"
            />
            <StatsCard
              title="Active Users"
              value={statsLoading ? "..." : stats?.activeUsers?.toString() || "0"}
              icon="users"
              color="purple"
            />
            <StatsCard
              title="Success Rate"
              value={statsLoading ? "..." : `${stats?.successRate || 0}%`}
              icon="chart"
              color="amber"
            />
          </div>

          {/* Recent Activity and Flow Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Messages */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Messages</CardTitle>
              </CardHeader>
              <CardContent>
                {messagesLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-start space-x-3 py-3 border-b border-hsl(20,5.9%,90%) last:border-b-0">
                        <div className="h-8 w-8 bg-hsl(60,4.8%,95.9%) rounded-full animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-hsl(60,4.8%,95.9%) rounded animate-pulse"></div>
                          <div className="h-3 bg-hsl(60,4.8%,95.9%) rounded w-3/4 animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentMessages?.length ? (
                  <div className="space-y-0">
                    {recentMessages.map((message: any) => (
                      <div key={message.id} className="flex items-start space-x-3 py-3 border-b border-hsl(20,5.9%,90%) last:border-b-0">
                        <div className="h-8 w-8 bg-hsl(60,4.8%,95.9%) rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-hsl(25,5.3%,44.7%)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-hsl(20,14.3%,4.1%)">{message.phoneNumber}</p>
                          <p className="text-sm text-hsl(25,5.3%,44.7%) truncate">{message.message}</p>
                          <p className="text-xs text-hsl(25,5.3%,44.7%)">
                            {new Date(message.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex-shrink-0 space-y-1">
                          {getDirectionBadge(message.direction)}
                          {getStatusBadge(message.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-hsl(25,5.3%,44.7%)">
                    <svg className="w-12 h-12 mx-auto mb-4 text-hsl(25,5.3%,44.7%)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p>No recent messages</p>
                    <p className="text-xs">Messages will appear here when users interact with your chatbots</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Performing Flows */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Flows</CardTitle>
              </CardHeader>
              <CardContent>
                {topFlows.length ? (
                  <div className="space-y-0">
                    {topFlows.map((flow: any, index: number) => (
                      <div key={flow.id} className="flex items-center justify-between py-3 border-b border-hsl(20,5.9%,90%) last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                            index === 0 ? 'bg-hsl(207,90%,54%)' : 
                            index === 1 ? 'bg-hsl(240,50%,60%)' : 'bg-hsl(142,76%,36%)'
                          }`}>
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12l5 5L20 7" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-hsl(20,14.3%,4.1%)">{flow.name}</p>
                            <p className="text-xs text-hsl(25,5.3%,44.7%)">
                              {flow.isActive ? 'Active' : 'Inactive'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-hsl(142,76%,36%)">
                            {flow.isActive ? '95%' : '0%'}
                          </p>
                          <p className="text-xs text-hsl(25,5.3%,44.7%)">Success rate</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-hsl(25,5.3%,44.7%)">
                    <svg className="w-12 h-12 mx-auto mb-4 text-hsl(25,5.3%,44.7%)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p>No flows created yet</p>
                    <p className="text-xs">Create your first chatbot flow to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
