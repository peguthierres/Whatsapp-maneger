import { useState, useCallback } from "react";
import FlowNode from "./FlowNode";
import type { FlowNode as FlowNodeType, FlowLink } from "@shared/schema";

interface FlowCanvasProps {
  nodes: FlowNodeType[];
  links: FlowLink[];
  onCreateNode: (nodeType: string, position: { x: number; y: number }) => void;
  flowId: string;
}

export default function FlowCanvas({ nodes, links, onCreateNode, flowId }: FlowCanvasProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const nodeType = e.dataTransfer.getData("application/node-type");
    if (nodeType) {
      const rect = e.currentTarget.getBoundingClientRect();
      const position = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      onCreateNode(nodeType, position);
    }
  }, [onCreateNode]);

  // Create connections between nodes
  const renderConnections = () => {
    return links.map((link) => {
      const sourceNode = nodes.find(n => n.id === link.sourceNodeId);
      const targetNode = nodes.find(n => n.id === link.targetNodeId);
      
      if (!sourceNode || !targetNode) return null;

      const sourcePos = sourceNode.position as { x: number; y: number };
      const targetPos = targetNode.position as { x: number; y: number };

      return (
        <line
          key={link.id}
          x1={sourcePos.x + 100} // Adjust for node width
          y1={sourcePos.y + 50}  // Adjust for node height
          x2={targetPos.x + 100}
          y2={targetPos.y + 50}
          stroke="hsl(207, 90%, 54%)"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
      );
    });
  };

  return (
    <div
      className={`flex-1 relative bg-hsl(60,4.8%,95.9%) overflow-hidden ${
        dragOver ? 'border-2 border-dashed border-hsl(207,90%,54%)' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="absolute inset-0 p-8">
        {nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="w-24 h-24 mx-auto mb-4 text-hsl(25,5.3%,44.7%)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-hsl(20,14.3%,4.1%) mb-2">Empty Flow Canvas</h3>
              <p className="text-hsl(25,5.3%,44.7%) mb-4">Drag components from the left panel to start building your flow</p>
              <div className="inline-flex items-center px-3 py-2 bg-hsl(207,90%,97%) text-hsl(207,90%,54%) rounded-lg text-sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Drag & Drop to Add Nodes
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* SVG for connections */}
            <svg className="absolute inset-0 pointer-events-none w-full h-full">
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="hsl(207, 90%, 54%)"
                  />
                </marker>
              </defs>
              {renderConnections()}
            </svg>

            {/* Render nodes */}
            {nodes.map((node) => {
              const position = node.position as { x: number; y: number };
              return (
                <FlowNode
                  key={node.id}
                  node={node}
                  position={position}
                  flowId={flowId}
                />
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
