// src/components/SpiderwebGraph.tsx
import { useRef, useCallback, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useGraphData } from '../hooks/useGraphData';
import type { GraphNode } from '../hooks/useGraphData';
import { getProjectColor, getNodeRadius, getNodeSize } from '../lib/graph-utils';

interface SpiderwebGraphProps {
  hierarchyLevel: 'company' | 'project' | 'sub-unit' | 'task';
  parentId: string | null;
  onNavigateDown: (nodeId: string, nodeName: string, nodeLevel: string) => void;
  onNavigateUp: () => void;
}

export function SpiderwebGraph({ hierarchyLevel, parentId, onNavigateDown, onNavigateUp }: SpiderwebGraphProps) {
  const fgRef = useRef<any>();
  const { data, loading, error } = useGraphData(hierarchyLevel, parentId);
  const [pulsePhase, setPulsePhase] = useState(0);

  // Pulsing animation for active tasks (separate from force simulation)
  useEffect(() => {
    let animationId: number;
    const animate = () => {
      setPulsePhase(prev => (prev + 0.05) % (2 * Math.PI));
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Reset zoom when hierarchy changes
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.zoom(1, 500); // Reset to default zoom with smooth transition
    }
  }, [hierarchyLevel, parentId]);

  // Handle node click for drill-down navigation
  const handleNodeClick = useCallback((node: any) => {
    // Only drill down if node has children (not at task level)
    if (node.level === 'company' || node.level === 'project' || node.level === 'sub-unit') {
      // Notify parent component to change hierarchy
      onNavigateDown(node.id, node.name, node.level);

      // Smooth zoom transition (camera zooms toward clicked node)
      if (fgRef.current) {
        fgRef.current.centerAt(node.x, node.y, 1000); // 1000ms transition
        fgRef.current.zoom(3, 1000);                   // Zoom level 3
      }
    }
  }, [onNavigateDown]);

  // Handle background click to navigate up
  const handleBackgroundClick = useCallback(() => {
    // Navigate up one level (click empty background to go up)
    onNavigateUp();
  }, [onNavigateUp]);

  // Configure force simulation for expansive layout
  const handleEngineStop = useCallback(() => {
    // Graph has settled - no further action needed for static layout
  }, []);

  // Custom node rendering with status-based styling
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const radius = getNodeRadius(node.level);
    const color = getProjectColor(node.projectId);
    const fontSize = 12 / globalScale;

    // Draw node based on status (per user requirement)
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);

    if (node.status === 'done') {
      // Solid fill for complete
      ctx.fillStyle = color;
      ctx.fill();
    } else if (node.status === 'in_progress') {
      // Pulsing outline for active
      const pulseRadius = radius + Math.sin(pulsePhase) * 2;
      ctx.beginPath();
      ctx.arc(node.x, node.y, pulseRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2 + Math.sin(pulsePhase) * 0.5;
      ctx.stroke();
    } else {
      // Outline only for pending/backlog
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw node name inside circle
    ctx.font = `${fontSize}px Sans-Serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = node.status === 'done' ? 'white' : color;
    ctx.fillText(node.name, node.x, node.y);

    // Draw team members below node (per user requirement: first names, comma-separated)
    if (node.assignees && node.assignees.length > 0) {
      const assigneeText = node.assignees.join(', ');
      ctx.font = `${fontSize * 0.8}px Sans-Serif`;
      ctx.fillStyle = '#666';
      ctx.fillText(assigneeText, node.x, node.y + radius + 12);
    }
  }, [pulsePhase]);

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb'
        }}
      >
        <div style={{ width: '80%', maxWidth: '600px' }}>
          <Skeleton height={400} />
          <div style={{ marginTop: '16px' }}>
            <Skeleton count={3} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fef2f2'
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            maxWidth: '500px'
          }}
        >
          <h3 style={{ color: '#dc2626', marginTop: 0 }}>Error Loading Graph</h3>
          <p style={{ color: '#6b7280' }}>{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        backgroundColor: '#ffffff'
      }}
    >
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        width={window.innerWidth}
        height={window.innerHeight}

        // Static layout configuration
        warmupTicks={100}
        cooldownTime={2000}
        d3AlphaDecay={0.05}
        d3VelocityDecay={0.4}

        // Interaction configuration
        enableNodeDrag={false}
        enablePanInteraction={true}
        enableZoomInteraction={true}

        // Force configuration for expansive layout
        d3Force={(forceName) => {
          if (forceName === 'charge') {
            // Strong repulsion for sparse feel
            const forceCharge = require('d3-force').forceManyBody();
            forceCharge.strength(-400);
            return forceCharge;
          }
          if (forceName === 'link') {
            // Long links for expansive layout
            const forceLink = require('d3-force').forceLink();
            forceLink.distance(150);
            return forceLink;
          }
          return null;
        }}

        // Node styling with custom canvas rendering
        nodeCanvasObject={nodeCanvasObject}
        nodeCanvasObjectMode={() => 'replace'}
        nodeVal={(node: any) => getNodeSize(node.level)}
        nodeLabel={(node: GraphNode) => node.name}

        // Link styling (thin lines per requirement)
        linkColor={() => '#cccccc'}
        linkWidth={1}
        linkDirectionalParticles={0}

        // Event handlers for navigation
        onNodeClick={handleNodeClick}
        onBackgroundClick={handleBackgroundClick}
        onEngineStop={handleEngineStop}
      />
    </div>
  );
}
