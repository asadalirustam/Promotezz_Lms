import React, { useState } from 'react';
import { Navigation, MapPin, Search, ArrowRight, Route, Compass, Info } from 'lucide-react';

// Graph configuration representing campus nodes and distances
const campusGraph = {
  'Main Gate': { 'Admin Block': 4, 'Parking Lot': 2 },
  'Admin Block': { 'Main Gate': 4, 'Library': 3, 'Faculty Offices': 2 },
  'Parking Lot': { 'Main Gate': 2, 'Cafeteria': 5, 'Mosque': 6 },
  'Library': { 'Admin Block': 3, 'CS Lab 1': 2, 'CS Lab 2': 4 },
  'Faculty Offices': { 'Admin Block': 2, 'CS Lab 2': 3, 'Cafeteria': 3 },
  'Cafeteria': { 'Parking Lot': 5, 'Faculty Offices': 3, 'Mosque': 2 },
  'Mosque': { 'Parking Lot': 6, 'Cafeteria': 2, 'CS Lab 1': 4 },
  'CS Lab 1': { 'Library': 2, 'Mosque': 4, 'CS Lab 2': 1 },
  'CS Lab 2': { 'Library': 4, 'Faculty Offices': 3, 'CS Lab 1': 1 }
};

// Node coordinates on a mock map canvas for drawing SVG paths
const nodeCoords = {
  'Main Gate': { x: 50, y: 350 },
  'Parking Lot': { x: 50, y: 150 },
  'Admin Block': { x: 250, y: 350 },
  'Library': { x: 450, y: 350 },
  'Faculty Offices': { x: 250, y: 200 },
  'Cafeteria': { x: 250, y: 50 },
  'Mosque': { x: 450, y: 50 },
  'CS Lab 1': { x: 650, y: 250 },
  'CS Lab 2': { x: 450, y: 200 }
};

const Dijkstra = (graph, start, end) => {
  const distances = {};
  const prev = {};
  const pq = new Set();

  Object.keys(graph).forEach(node => {
    distances[node] = Infinity;
    prev[node] = null;
    pq.add(node);
  });

  distances[start] = 0;

  while (pq.size > 0) {
    // Find node with minimum distance in priority queue
    let minNode = null;
    pq.forEach(node => {
      if (minNode === null || distances[node] < distances[minNode]) {
        minNode = node;
      }
    });

    if (minNode === null || distances[minNode] === Infinity) break;
    if (minNode === end) break;

    pq.delete(minNode);

    // Update distances of neighbors
    const neighbors = graph[minNode];
    Object.keys(neighbors).forEach(neighbor => {
      const alt = distances[minNode] + neighbors[neighbor];
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        prev[neighbor] = minNode;
      }
    });
  }

  // Build path
  const path = [];
  let curr = end;
  while (curr !== null) {
    path.unshift(curr);
    curr = prev[curr];
  }

  return {
    path: path[0] === start ? path : [],
    distance: distances[end] !== Infinity ? distances[end] : 0
  };
};

const CampusNavigation = () => {
  const [startNode, setStartNode] = useState('Main Gate');
  const [endNode, setEndNode] = useState('CS Lab 1');
  const [routeInfo, setRouteInfo] = useState(null);

  const calculateRoute = () => {
    if (startNode === endNode) {
      alert('Start and Destination cannot be the same room.');
      return;
    }
    const result = Dijkstra(campusGraph, startNode, endNode);
    setRouteInfo(result);
  };

  const allNodes = Object.keys(campusGraph);

  return (
    <div className="space-y-8 animate-soft">
      {/* Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-border-base bg-gradient-to-r from-white to-primary/5 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <Compass className="w-3.5 h-3.5" />
            Campus Navigation
          </span>
          <h1 className="text-3xl font-extrabold text-text-base leading-tight">Shortest Route Pathfinder</h1>
          <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
            Navigate through university department classrooms, laboratories, parking areas, faculty blocks, and libraries using Dijkstra's shortest path algorithm.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Navigation configuration selectors */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card-light p-6 space-y-5">
            <h3 className="font-bold text-text-base text-sm uppercase tracking-wider flex items-center gap-2">
              <Navigation className="w-4 h-4 text-primary" />
              Route Planner
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-primary mb-2 uppercase tracking-wide">Starting Location</label>
                <select
                  value={startNode}
                  onChange={(e) => setStartNode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-base border border-border-base rounded-xl text-xs outline-none focus:border-primary text-text-base font-semibold"
                >
                  {allNodes.map(node => (
                    <option key={node} value={node}>{node}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-primary mb-2 uppercase tracking-wide">Destination Office/Room</label>
                <select
                  value={endNode}
                  onChange={(e) => setEndNode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-base border border-border-base rounded-xl text-xs outline-none focus:border-primary text-text-base font-semibold"
                >
                  {allNodes.map(node => (
                    <option key={node} value={node}>{node}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={calculateRoute}
                className="w-full py-2.5 bg-gradient-to-r from-primary to-secondary hover:opacity-95 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/10"
              >
                <Route className="w-4 h-4" />
                <span>Calculate Shortest Path</span>
              </button>
            </div>
          </div>

          {/* Path Details info card */}
          {routeInfo && routeInfo.path.length > 0 && (
            <div className="card-light p-6 space-y-4 animate-scale">
              <h3 className="font-bold text-text-base text-sm uppercase tracking-wider flex items-center gap-2 text-success">
                <Route className="w-4 h-4 text-success" />
                Calculated Path Details
              </h3>
              <div className="space-y-3 font-semibold text-xs text-text-base">
                <div className="bg-slate-50 p-3 rounded-lg border border-border-base">
                  <p className="text-slate-400 text-[9px] uppercase font-bold">Total Estimated Distance</p>
                  <p className="text-text-base mt-1 text-sm font-extrabold">{routeInfo.distance * 100} Meters</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 text-[9px] uppercase font-bold">Step-by-step Nodes sequence</p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    {routeInfo.path.map((node, i) => (
                      <React.Fragment key={i}>
                        <span className={`px-2 py-0.5 rounded text-[10px] ${node === startNode || node === endNode ? 'bg-primary text-white font-bold' : 'bg-slate-100 text-slate-650'}`}>
                          {node}
                        </span>
                        {i < routeInfo.path.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Graph node connectivity legend */}
          <div className="card-light p-6 space-y-3">
            <h4 className="font-bold text-text-base text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 text-primary" />
              Navigation Nodes Legend
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Hover nodes or select rooms to view structural paths. Lines represent walkways between department wings.
            </p>
          </div>
        </div>

        {/* Map Canvas SVG Rendering */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-light p-6 space-y-4">
            <h3 className="font-bold text-text-base text-sm uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Interactive Campus SVG Map Layout
            </h3>

            <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-4 relative" style={{ height: '420px' }}>
              <svg width="100%" height="100%" viewBox="0 0 750 400" className="w-full h-full">
                {/* 1. Walkways Connections */}
                {Object.keys(campusGraph).map(start => {
                  return Object.keys(campusGraph[start]).map(end => {
                    const from = nodeCoords[start];
                    const to = nodeCoords[end];
                    if (!from || !to) return null;
                    
                    // Check if walkway belongs to active path
                    let isHighlighted = false;
                    if (routeInfo && routeInfo.path.length > 0) {
                      const idx1 = routeInfo.path.indexOf(start);
                      const idx2 = routeInfo.path.indexOf(end);
                      if (idx1 !== -1 && idx2 !== -1 && Math.abs(idx1 - idx2) === 1) {
                        isHighlighted = true;
                      }
                    }

                    return (
                      <line
                        key={`${start}-${end}`}
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke={isHighlighted ? '#10B981' : '#334155'}
                        strokeWidth={isHighlighted ? 4 : 2}
                        strokeDasharray={isHighlighted ? '0' : '5,5'}
                        className="transition-all duration-300"
                      />
                    );
                  });
                })}

                {/* 2. Room Nodes Circle Marks */}
                {Object.keys(nodeCoords).map(node => {
                  const coord = nodeCoords[node];
                  const isActive = routeInfo?.path.includes(node);
                  const isStart = node === startNode;
                  const isEnd = node === endNode;

                  let color = '#1E293B';
                  let stroke = '#475569';
                  if (isActive) {
                    color = '#10B981';
                    stroke = '#34D399';
                  }
                  if (isStart) {
                    color = '#2563EB';
                    stroke = '#60A5FA';
                  }
                  if (isEnd) {
                    color = '#8B5CF6';
                    stroke = '#A78BFA';
                  }

                  return (
                    <g key={node} className="cursor-pointer group">
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r={isStart || isEnd ? 12 : 9}
                        fill={color}
                        stroke={stroke}
                        strokeWidth={2}
                        className="transition-all duration-300 group-hover:scale-125"
                      />
                      <text
                        x={coord.x}
                        y={coord.y - 18}
                        fill="#F8FAFC"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="bg-slate-950 p-1 opacity-80 group-hover:opacity-100 transition-all pointer-events-none"
                      >
                        {node}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Map Floating Badges Legend */}
              <div className="absolute bottom-4 left-4 flex gap-4 text-[10px] font-bold text-white bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 backdrop-blur">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
                  <span>Start</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block"></span>
                  <span>Destination</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-success inline-block"></span>
                  <span>Shortest Route Path</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusNavigation;
