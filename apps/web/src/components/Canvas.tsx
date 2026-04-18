'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import * as Y from 'yjs';
import '@xyflow/react/dist/style.css';

export type CanvasProps = {
  doc: Y.Doc;
  readOnly?: boolean;
  onChange?: (delta: { nodes: number; edges: number }) => void;
};

/**
 * React Flow canvas backed by two Y.Maps (`canvas_nodes` and `canvas_edges`),
 * matching the structure the realtime server expects when serializing the
 * snapshot for the AI orchestrator. Keys are the node/edge ids.
 */
export function Canvas({ doc, readOnly = false, onChange }: CanvasProps) {
  const yNodes = useMemo(() => doc.getMap<Node>('canvas_nodes'), [doc]);
  const yEdges = useMemo(() => doc.getMap<Edge>('canvas_edges'), [doc]);
  const [nodes, setNodes] = useState<Node[]>(() => Array.from(yNodes.values()));
  const [edges, setEdges] = useState<Edge[]>(() => Array.from(yEdges.values()));

  useEffect(() => {
    const nodeObs = () => setNodes(Array.from(yNodes.values()));
    const edgeObs = () => setEdges(Array.from(yEdges.values()));
    yNodes.observeDeep(nodeObs);
    yEdges.observeDeep(edgeObs);
    return () => {
      yNodes.unobserveDeep(nodeObs);
      yEdges.unobserveDeep(edgeObs);
    };
  }, [yNodes, yEdges]);

  const writeNodes = useCallback(
    (next: Node[]) => {
      doc.transact(() => {
        const seen = new Set<string>();
        for (const n of next) {
          seen.add(n.id);
          yNodes.set(n.id, n);
        }
        for (const id of Array.from(yNodes.keys())) {
          if (!seen.has(id)) yNodes.delete(id);
        }
      });
    },
    [doc, yNodes],
  );

  const writeEdges = useCallback(
    (next: Edge[]) => {
      doc.transact(() => {
        const seen = new Set<string>();
        for (const e of next) {
          seen.add(e.id);
          yEdges.set(e.id, e);
        }
        for (const id of Array.from(yEdges.keys())) {
          if (!seen.has(id)) yEdges.delete(id);
        }
      });
    },
    [doc, yEdges],
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      const next = applyNodeChanges(changes, nodes);
      writeNodes(next);
      onChange?.({ nodes: changes.length, edges: 0 });
    },
    [nodes, writeNodes, onChange],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      const next = applyEdgeChanges(changes, edges);
      writeEdges(next);
      onChange?.({ nodes: 0, edges: changes.length });
    },
    [edges, writeEdges, onChange],
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      const next = addEdge(connection, edges);
      writeEdges(next);
      onChange?.({ nodes: 0, edges: 1 });
    },
    [edges, writeEdges, onChange],
  );

  const addBlankNode = () => {
    const id = `node_${Date.now()}`;
    const n: Node = {
      id,
      type: 'default',
      position: { x: 120 + Math.random() * 200, y: 120 + Math.random() * 200 },
      data: { label: 'New box' },
    };
    yNodes.set(id, n);
    onChange?.({ nodes: 1, edges: 0 });
  };

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} />
        <Controls showInteractive={!readOnly} />
      </ReactFlow>
      {!readOnly && (
        <button
          onClick={addBlankNode}
          className="absolute right-3 top-3 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-blue-500"
        >
          + Node
        </button>
      )}
    </div>
  );
}
