// src/components/SpiderwebGraph.tsx
import { useRef, useCallback, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useGraphData } from '../hooks/useGraphData';
import type { GraphNode } from '../hooks/useGraphData';
import { getProjectColor, getNodeRadius, getNodeSize } from '../lib/graph-utils';
import { theme } from '../lib/theme';

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
      fgRef.current.zoom(1, 500);
    }
  }, [hierarchyLevel, parentId]);

  // Handle node click for drill-down navigation
  const handleNodeClick = useCallback((node: any) => {
    if (node.level === hierarchyLevel) return;

    if (node.level === 'company' || node.level === 'project' || node.level === 'sub-unit') {
      onNavigateDown(node.id, node.name, node.level);

      if (fgRef.current) {
        fgRef.current.centerAt(node.x, node.y, 1000);
        fgRef.current.zoom(3, 1000);
      }
    }
  }, [onNavigateDown, hierarchyLevel]);

  const handleBackgroundClick = useCallback(() => {
    onNavigateUp();
  }, [onNavigateUp]);

  const handleEngineStop = useCallback(() => {}, []);

  // Custom node rendering with dark theme colors
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const radius = getNodeRadius(node.level);
    const fontSize = 12 / globalScale;

    // Use brand accent colors based on hierarchy level
    let color: string;
    if (node.level === 'company') color = theme.green;
    else if (node.level === 'project') color = theme.cyan;
    else if (node.level === 'sub-unit') color = theme.purple;
    else color = theme.textSecondary;

    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);

    if (node.status === 'done') {
      ctx.fillStyle = color;
      ctx.fill();
    } else if (node.status === 'in_progress') {
      const pulseRadius = radius + Math.sin(pulsePhase) * 2;
      ctx.beginPath();
      ctx.arc(node.x, node.y, pulseRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2 + Math.sin(pulsePhase) * 0.5;
      ctx.stroke();
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw node name
    ctx.font = `${fontSize}px Sans-Serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = node.status === 'done' ? '#ffffff' : color;
    ctx.fillText(node.name, node.x, node.y);

    // Draw team members below node
    if (node.assignees && node.assignees.length > 0) {
      const assigneeText = node.assignees.join(', ');
      ctx.font = `${fontSize * 0.8}px Sans-Serif`;
      ctx.fillStyle = theme.textMuted;
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
          backgroundColor: theme.bg,
        }}
      >
        <div style={{ width: '80%', maxWidth: '600px' }}>
          <Skeleton height={400} baseColor={theme.bgElevated} highlightColor={theme.bgSurfaceHover} />
          <div style={{ marginTop: '16px' }}>
            <Skeleton count={3} baseColor={theme.bgElevated} highlightColor={theme.bgSurfaceHover} />
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
          backgroundColor: theme.bg,
        }}
      >
        <div
          style={{
            backgroundColor: theme.bgSurface,
            padding: '24px',
            borderRadius: '8px',
            border: `1px solid ${theme.error}33`,
            maxWidth: '500px'
          }}
        >
          <h3 style={{ color: theme.error, marginTop: 0 }}>Error Loading Graph</h3>
          <p style={{ color: theme.textSecondary }}>{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        backgroundColor: theme.bg,
      }}
    >
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        width={window.innerWidth}
        height={window.innerHeight}

        warmupTicks={100}
        cooldownTime={2000}
        d3AlphaDecay={0.05}
        d3VelocityDecay={0.4}

        enableNodeDrag={false}
        enablePanInteraction={true}
        enableZoomInteraction={true}

        d3Force={(forceName) => {
          if (forceName === 'charge') {
            const forceCharge = require('d3-force').forceManyBody();
            forceCharge.strength(-400);
            return forceCharge;
          }
          if (forceName === 'link') {
            const forceLink = require('d3-force').forceLink();
            forceLink.distance(150);
            return forceLink;
          }
          return null;
        }}

        nodeCanvasObject={nodeCanvasObject}
        nodeCanvasObjectMode={() => 'replace'}
        nodeVal={(node: any) => getNodeSize(node.level)}
        nodeLabel={(node: any) => {
          const lastUpdate = node.updated_at
            ? new Date(node.updated_at).toLocaleDateString()
            : 'Never';
          const owner = node.owner || 'Unassigned';
          const team = node.assignees && node.assignees.length > 0
            ? node.assignees.join(', ')
            : 'None';

          return `
            <div style="background: ${theme.bgSurface}; padding: 10px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.4); font-family: sans-serif; border: 1px solid ${theme.border};">
              <strong style="color: ${theme.text}">${node.name}</strong><br/>
              <span style="color: ${theme.textSecondary}; font-size: 12px;">
                Owner: ${owner}<br/>
                Last update: ${lastUpdate}<br/>
                ${node.assignees ? `Team: ${team}` : ''}
              </span>
            </div>
          `;
        }}
        nodePointerAreaPaint={(node: any, color: any, ctx: CanvasRenderingContext2D) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, getNodeRadius(node.level) * 1.5, 0, 2 * Math.PI);
          ctx.fill();
        }}

        linkColor={() => theme.border}
        linkWidth={1}
        linkDirectionalParticles={0}

        onNodeClick={handleNodeClick}
        onBackgroundClick={handleBackgroundClick}
        onEngineStop={handleEngineStop}
      />
    </div>
  );
}
