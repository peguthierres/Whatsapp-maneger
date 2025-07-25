const nodeTypes = [
  {
    type: "message",
    name: "Message",
    description: "Send text message",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: "text-hsl(207,90%,54%)",
  },
  {
    type: "condition",
    name: "Condition",
    description: "Branch conversation",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "text-hsl(240,50%,60%)",
  },
  {
    type: "webhook",
    name: "Webhook",
    description: "External API call",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    color: "text-hsl(142,76%,36%)",
  },
  {
    type: "delay",
    name: "Delay",
    description: "Wait before next action",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "text-hsl(48,96%,53%)",
  },
];

export default function NodePalette() {
  const handleDragStart = (e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData("application/node-type", nodeType);
  };

  return (
    <div className="w-64 border-r border-hsl(20,5.9%,90%) p-4 bg-hsl(60,4.8%,95.9%)">
      <h4 className="text-sm font-semibold text-hsl(20,14.3%,4.1%) mb-4">Flow Components</h4>
      <div className="space-y-3">
        {nodeTypes.map((nodeType) => (
          <div
            key={nodeType.type}
            draggable
            onDragStart={(e) => handleDragStart(e, nodeType.type)}
            className="bg-white p-3 rounded-lg border border-hsl(20,5.9%,90%) cursor-pointer hover:border-hsl(207,90%,54%) transition duration-200"
          >
            <div className="flex items-center space-x-2">
              <div className={nodeType.color}>
                {nodeType.icon}
              </div>
              <span className="text-sm font-medium text-hsl(20,14.3%,4.1%)">{nodeType.name}</span>
            </div>
            <p className="text-xs text-hsl(25,5.3%,44.7%) mt-1">{nodeType.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
