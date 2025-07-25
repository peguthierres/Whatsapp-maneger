import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  actions?: ReactNode;
}

export default function Header({ title, actions }: HeaderProps) {
  const { data: whatsappConfig } = useQuery({
    queryKey: ["/api/whatsapp/config"],
    retry: false,
  });

  const handleCreateFlow = () => {
    // This would open a modal or navigate to create flow page
    console.log("Create new flow");
  };

  return (
    <header className="bg-white shadow-sm border-b border-hsl(20,5.9%,90%) px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-hsl(20,14.3%,4.1%)">{title}</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-hsl(25,5.3%,44.7%)">
            <div className={`h-2 w-2 rounded-full ${
              whatsappConfig?.isActive ? 'bg-hsl(142,76%,36%)' : 'bg-hsl(0,84.2%,60.2%)'
            }`}></div>
            <span>
              {whatsappConfig?.isActive ? 'WhatsApp Connected' : 'WhatsApp Disconnected'}
            </span>
          </div>
          {actions || (
            <Button onClick={handleCreateFlow}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Flow
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
