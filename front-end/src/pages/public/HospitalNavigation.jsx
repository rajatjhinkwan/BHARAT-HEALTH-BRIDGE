import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Compass, Navigation, MapPin, RotateCcw, Volume2, VolumeX, 
  DoorOpen, CheckCircle2, AlertTriangle, Info, Sparkles, Map, 
  RefreshCw, ChevronRight, Activity, ArrowUp
} from 'lucide-react';
import './HospitalNavigation.css';

// --------------------------------------------------------------------------
// 1. PHYSICAL ABSOLUTE GPS DIAGRAM CALIBRATION MATRIX
// --------------------------------------------------------------------------

const CALIBRATION_POINTS = [
  { name: 'A_top_left', lat: 30.410213, lon: 79.316419, x: 80, y: 40 },
  { name: 'A_top_right', lat: 30.410228, lon: 79.316420, x: 520, y: 40 },
  { name: 'A_bottom_left_ext', lat: 30.410191, lon: 79.316426, x: 80, y: 200 },
  { name: 'B_top_left', lat: 30.410208, lon: 79.316411, x: 140, y: 200 },
  { name: 'B_bottom_left', lat: 30.410223, lon: 79.316445, x: 140, y: 360 },
  { name: 'B_top_right', lat: 30.410204, lon: 79.316462, x: 300, y: 200 },
  { name: 'B_bottom_right', lat: 30.410198, lon: 79.316441, x: 300, y: 360 },
  { name: 'C_top_right', lat: 30.410208, lon: 79.316449, x: 520, y: 200 },
  { name: 'C_bottom_right', lat: 30.410159, lon: 79.316428, x: 520, y: 360 }
];

// Multi-point Inverse Distance Weighting (IDW) absolute mapping formula
function mapGPSToScreen(lat, lon) {
  let sumW = 0;
  let sumWX = 0;
  let sumWY = 0;

  for (let i = 0; i < CALIBRATION_POINTS.length; i++) {
    const pt = CALIBRATION_POINTS[i];
    const d = Math.hypot(lat - pt.lat, lon - pt.lon);
    
    if (d < 0.0000001) {
      // Snap exactly if precisely matches coordinate
      return { x: pt.x, y: pt.y };
    }

    const w = 1 / (d * d);
    sumW += w;
    sumWX += w * pt.x;
    sumWY += w * pt.y;
  }

  return {
    x: Math.round(sumWX / sumW),
    y: Math.round(sumWY / sumW)
  };
}

// --------------------------------------------------------------------------
// 2. ROOM & NODE MAP GRAPH STRUCT FOR DIJKSTRA
// --------------------------------------------------------------------------

const ROOMS = {
  room_A: { id: 'room_A', name: 'Room A (Upper)', x: 80, y: 40, w: 440, h: 160, color: 'rgba(139, 92, 246, 0.08)' },
  room_B: { id: 'room_B', name: 'Room B (Lower Left)', x: 140, y: 200, w: 160, h: 160, color: 'rgba(16, 185, 129, 0.08)' },
  room_C: { id: 'room_C', name: 'Room C (Lower Right)', x: 300, y: 200, w: 220, h: 160, color: 'rgba(14, 165, 233, 0.08)' }
};

const DOORS = {
  door_AB: { x: 220, y: 200, name: 'Door A-B' },
  door_AC: { x: 410, y: 200, name: 'Door A-C' },
  door_BC: { x: 300, y: 280, name: 'Door B-C' },
  door_exit: { x: 80, y: 120, name: 'Exit Door' }
};

const NODES = {
  // Center positions for navigation routing
  n_room_A: { x: 300, y: 120 },
  n_room_B: { x: 220, y: 280 },
  n_room_C: { x: 410, y: 280 },

  // Doorways
  n_door_AB: DOORS.door_AB,
  n_door_AC: DOORS.door_AC,
  n_door_BC: DOORS.door_BC,
  n_door_exit: DOORS.door_exit
};

const GRAPH = {
  n_room_A: { n_door_AB: 130, n_door_AC: 130, n_door_exit: 220 },
  n_room_B: { n_door_AB: 82, n_door_BC: 80 },
  n_room_C: { n_door_AC: 82, n_door_BC: 110 },
  
  n_door_AB: { n_room_A: 130, n_room_B: 82 },
  n_door_AC: { n_room_A: 130, n_room_C: 82 },
  n_door_BC: { n_room_B: 80, n_room_C: 110 },
  n_door_exit: { n_room_A: 220 }
};

// Dijkstra Routing Engine
function calculateShortestPath(startNodeId, targetNodeId) {
  if (!NODES[startNodeId] || !NODES[targetNodeId]) return null;

  const distances = {};
  const previous = {};
  const queue = [];

  for (const nodeId in NODES) {
    if (nodeId === startNodeId) {
      distances[nodeId] = 0;
      queue.push({ id: nodeId, dist: 0 });
    } else {
      distances[nodeId] = Infinity;
      queue.push({ id: nodeId, dist: Infinity });
    }
    previous[nodeId] = null;
  }

  while (queue.length > 0) {
    queue.sort((a, b) => a.dist - b.dist);
    const current = queue.shift();

    if (current.dist === Infinity) break;
    if (current.id === targetNodeId) break;

    const neighbors = GRAPH[current.id] || {};
    for (const neighborId in neighbors) {
      const alt = distances[current.id] + neighbors[neighborId];
      if (alt < distances[neighborId]) {
        distances[neighborId] = alt;
        previous[neighborId] = current.id;
        
        const qIndex = queue.findIndex(item => item.id === neighborId);
        if (qIndex !== -1) {
          queue[qIndex].dist = alt;
        }
      }
    }
  }

  const path = [];
  let u = targetNodeId;
  if (previous[u] || u === startNodeId) {
    while (u) {
      path.unshift(u);
      u = previous[u];
    }
  }

  return path.length > 0 ? path : null;
}

export default function HospitalNavigation() {
  const [searchParams] = useSearchParams();
  const [startRoom, setStartRoom] = useState('room_B');
  const [targetRoom, setTargetRoom] = useState('room_C');
  const [detectedRoom, setDetectedRoom] = useState(null);
  
  const [computedPath, setComputedPath] = useState([]);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [lastSpokenText, setLastSpokenText] = useState('');

  // Location dot screen pixel positions
  const [userX, setUserX] = useState(NODES.n_room_B.x);
  const [userY, setUserY] = useState(NODES.n_room_B.y);
  const [userHeading, setUserHeading] = useState(0); 
  const [pathStepIndex, setPathStepIndex] = useState(0);

  // REAL ABSOLUTE GEOLOCATION tracking
  const [isGPSTracking, setIsGPSTracking] = useState(false);
  const [currentGPS, setCurrentGPS] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  
  const watchIdRef = useRef(null);

  const departmentToRoom = {
    laboratory: 'room_B',
    radiology: 'room_C',
    emergency: 'room_A',
    opd: 'room_A',
    cardiology: 'room_A',
    neurology: 'room_A',
    orthopedics: 'room_B',
  };

  // Compute route when rooms change
  useEffect(() => {
    const requestedDepartment = (searchParams.get('department') || '').toLowerCase();
    const mappedRoom = departmentToRoom[requestedDepartment];
    if (mappedRoom && ROOMS[mappedRoom]) {
      setTargetRoom(mappedRoom);
    }
  }, [searchParams]);

  const resolveRoomFromScreen = (x, y) => {
    const room = Object.values(ROOMS).find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
    return room?.id || null;
  };

  useEffect(() => {
    const startNode = `n_${startRoom}`;
    const targetNode = `n_${targetRoom}`;
    const path = calculateShortestPath(startNode, targetNode);
    if (path) {
      setComputedPath(path);
      setUserX(NODES[path[0]].x);
      setUserY(NODES[path[0]].y);
      setPathStepIndex(0);
    }
  }, [startRoom, targetRoom]);

  // Hook DeviceOrientation API for standard mobile rotational compass
  useEffect(() => {
    const handleOrientation = (e) => {
      let heading = e.webkitCompassHeading;
      if (heading === undefined) {
        heading = e.alpha ? (360 - e.alpha) % 360 : 0;
      }
      if (heading !== null && heading !== undefined) {
        setUserHeading(Math.round(heading));
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  // START / STOP REAL GPS WALKING GEOLOCATION WATCHER
  useEffect(() => {
    if (isGPSTracking) {
      if ('geolocation' in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude, heading, accuracy } = position.coords;
            
            setCurrentGPS({ lat: latitude, lon: longitude });
            setGpsAccuracy(Math.round(accuracy));
            setGpsError(null);

            // 1. ABSOLUTE MAP MATRIX CONVERSION:
            // Weight input coordinates against the 9 calibration diagram dots
            const screenPos = mapGPSToScreen(latitude, longitude);
            const roomId = resolveRoomFromScreen(screenPos.x, screenPos.y);
            setDetectedRoom(roomId);
            
            // 2. Trajectory Orientation calculation (if walking)
            const prevX = userX;
            const prevY = userY;
            const dx = screenPos.x - prevX;
            const dy = screenPos.y - prevY;
            
            if (Math.hypot(dx, dy) > 1.5) {
              let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
              if (angle < 0) angle += 360;
              setUserHeading(Math.round(angle));
            } else if (heading !== null && heading !== undefined && !isNaN(heading)) {
              setUserHeading(Math.round(heading));
            }
            
            setUserX(screenPos.x);
            setUserY(screenPos.y);
            if (roomId && roomId !== startRoom) {
              setStartRoom(roomId);
            }

            // Snap step index to nearest graph node in route
            const routeCoords = computedPath.map(nodeId => NODES[nodeId]).filter(Boolean);
            if (routeCoords.length > 0) {
              let closestIdx = pathStepIndex;
              let minDist = Infinity;
              routeCoords.forEach((node, idx) => {
                const dist = Math.hypot(node.x - screenPos.x, node.y - screenPos.y);
                if (dist < minDist) {
                  minDist = dist;
                  closestIdx = idx;
                }
              });
              setPathStepIndex(closestIdx);
            }
          },
          (err) => {
            console.error(err);
            setGpsError(err.message);
            setIsGPSTracking(false);
          },
          { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );
      } else {
        setGpsError('Geolocation is not supported by your browser.');
        setIsGPSTracking(false);
      }
    } else {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isGPSTracking, pathStepIndex, startRoom, computedPath]);

  // Request high-accuracy geolocation permissions explicitly
  const requestGPSAccess = () => {
    if (isGPSTracking) {
      setIsGPSTracking(false);
    } else {
      setIsGPSTracking(true);
      // Fire single probe to prompt permission popup immediately
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const screenPos = mapGPSToScreen(pos.coords.latitude, pos.coords.longitude);
          setUserX(screenPos.x);
          setUserY(screenPos.y);
        },
        (err) => {
          setGpsError(err.message);
        }
      );
    }
  };

  const getPathCoords = () => {
    return computedPath.map(nodeId => NODES[nodeId]);
  };

  const pathCoords = getPathCoords();

  const getNextTargetNode = () => {
    if (pathCoords.length === 0) return null;
    
    for (let i = pathStepIndex + 1; i < pathCoords.length; i++) {
      const node = pathCoords[i];
      const dist = Math.hypot(node.x - userX, node.y - userY);
      if (dist > 12) {
        return { node, index: i };
      }
    }
    
    const lastIdx = pathCoords.length - 1;
    return { node: pathCoords[lastIdx], index: lastIdx };
  };

  const nextTargetInfo = getNextTargetNode();
  const nextTarget = nextTargetInfo ? nextTargetInfo.node : null;
  const nextTargetIndex = nextTargetInfo ? nextTargetInfo.index : 0;

  const calculateBearing = () => {
    if (!nextTarget) return 0;
    const dx = nextTarget.x - userX;
    const dy = nextTarget.y - userY;
    
    let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    return Math.round(angle);
  };

  const targetHeading = calculateBearing();

  const getHeadingDiff = () => {
    let diff = targetHeading - userHeading;
    diff = ((diff + 180) % 360) - 180;
    if (diff < -180) diff += 360;
    return Math.round(diff);
  };

  const headingDiff = getHeadingDiff();

  // Evaluate Direction Alignment
  const getNavigationStatus = () => {
    if (pathCoords.length === 0) return { status: 'UNKNOWN', text: 'Select departure and destination.', classStr: 'status-on-track' };
    
    const finalNode = pathCoords[pathCoords.length - 1];
    const distanceToDest = Math.hypot(finalNode.x - userX, finalNode.y - userY);
    if (distanceToDest <= 12) {
      return { 
        status: 'ARRIVED', 
        text: `🎉 You have arrived at your destination!`, 
        classStr: 'status-on-track',
        voiceText: 'You have arrived.'
      };
    }

    const absDiff = Math.abs(headingDiff);

    if (absDiff <= 35) {
      return { 
        status: 'ON_TRACK', 
        text: 'PROCEED STRAIGHT: You are going in the right direction! 🧭', 
        classStr: 'status-on-track',
        voiceText: 'Proceed straight.'
      };
    } else if (absDiff > 35 && absDiff <= 90) {
      if (headingDiff > 0) {
        return { 
          status: 'DRIFT_RIGHT', 
          text: 'TURN RIGHT: Correct your heading to the right. ➡️', 
          classStr: 'status-drift',
          voiceText: 'Turn right.'
        };
      } else {
        return { 
          status: 'DRIFT_LEFT', 
          text: 'TURN LEFT: Correct your heading to the left. ⬅️', 
          classStr: 'status-drift',
          voiceText: 'Turn left.'
        };
      }
    } else {
      return { 
        status: 'WRONG_WAY', 
        text: '🚨 WRONG DIRECTION! Turn back immediately.', 
        classStr: 'status-wrong-way',
        voiceText: 'Wrong direction. Turn back.'
      };
    }
  };

  const navStatus = getNavigationStatus();

  // Voice Guidance Speech
  useEffect(() => {
    if (speechEnabled && navStatus.voiceText && navStatus.voiceText !== lastSpokenText) {
      window.speechSynthesis?.cancel();
      const utterance = new SpeechSynthesisUtterance(navStatus.voiceText);
      window.speechSynthesis?.speak(utterance);
      setLastSpokenText(navStatus.voiceText);
    }
  }, [navStatus.voiceText, speechEnabled, lastSpokenText]);

  // Simulate manual walk step (for validation)
  const handleSimulateStep = () => {
    if (!nextTarget) return;

    const stepSize = 10;
    const dx = nextTarget.x - userX;
    const dy = nextTarget.y - userY;
    const distance = Math.hypot(dx, dy);

    if (distance <= stepSize) {
      setUserX(nextTarget.x);
      setUserY(nextTarget.y);
      setPathStepIndex(nextTargetIndex);
    } else {
      const ratio = stepSize / distance;
      setUserX(prevX => prevX + dx * ratio);
      setUserY(prevY => prevY + dy * ratio);
    }
  };

  const handleResetNavigation = () => {
    setUserX(NODES[`n_${startRoom}`].x);
    setUserY(NODES[`n_${startRoom}`].y);
    setPathStepIndex(0);
  };

  return (
    <div className="nav-panel-container">
      
      {/* 2D HIGH-FIDELITY VECTOR FLOOR MAP (SVG) */}
      <div className="nav-glass-card">
        <div className="navigation-header-section no-print">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Navigation className="text-primary" size={24} /> Three Room Wayfinder
            </h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Live zone: {detectedRoom ? ROOMS[detectedRoom]?.name : 'Unknown'} · Destination: {ROOMS[targetRoom]?.name}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className={`btn-secondary ${isGPSTracking ? 'text-primary' : ''}`} 
              onClick={requestGPSAccess}
            >
              <Activity size={16} />
              <span>{isGPSTracking ? 'Disable GPS' : 'Enable Real GPS Walk'}</span>
            </button>
            <button 
              className={`btn-secondary ${speechEnabled ? 'text-primary' : ''}`} 
              onClick={() => setSpeechEnabled(!speechEnabled)}
            >
              {speechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span>Voice</span>
            </button>
          </div>
        </div>

        {/* Live GPS Telemetry Dashboard */}
        {isGPSTracking && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', background: 'var(--primary-light)', border: '1px solid var(--primary)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>GPS Tracking: <strong className="text-success">ACTIVE</strong> (Accuracy: {gpsAccuracy || 0}m)</div>
            </div>
            {currentGPS && (
              <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                LATITUDE: {currentGPS.lat.toFixed(6)} | LONGITUDE: {currentGPS.lon.toFixed(6)}
              </div>
            )}
          </div>
        )}

        {gpsError && (
          <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            GPS Status Error: {gpsError}
          </div>
        )}

        {/* 2D Room vector canvas */}
        <div className="map-viewport-wrapper">
          <svg viewBox="0 0 600 400" className="map-svg-container">
            <defs>
              <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--divider)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" opacity="0.3" rx="8" />

            {/* Render all rooms */}
            {Object.values(ROOMS).map((room) => {
              const isStart = startRoom === room.id;
              const isDest = targetRoom === room.id;
              let rectClass = "map-room-rect";
              if (isStart) rectClass += " is-start";
              if (isDest) rectClass += " is-destination";

              return (
                <g key={room.id} onClick={() => setTargetRoom(room.id)} style={{ cursor: 'pointer' }}>
                  <rect
                    x={room.x}
                    y={room.y}
                    width={room.w}
                    height={room.h}
                    className={rectClass}
                    rx="8"
                    style={{ fill: isStart ? 'rgba(16, 185, 129, 0.08)' : isDest ? 'rgba(14, 165, 233, 0.08)' : room.color }}
                  />
                  {/* Room labels */}
                  <text x={room.x + room.w/2} y={room.y + room.h/2} className="map-label" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {room.name.split(' ')[0]} {room.name.split(' ')[1]}
                  </text>
                  <text x={room.x + room.w/2} y={room.y + room.h/2 + 20} className="map-label-muted">
                    {room.name.split(' ').slice(2).join(' ')}
                  </text>
                </g>
              );
            })}

            {/* RENDER DOORS WITH SWING ARCS */}
            {Object.entries(DOORS).map(([doorId, door]) => {
              const isOpenLeft = ['door_exit'].includes(doorId);
              const isVertical = ['door_BC'].includes(doorId);
              const xStart = door.x;
              const yStart = door.y;
              
              return (
                <g key={doorId}>
                  <line 
                    x1={xStart} 
                    y1={yStart} 
                    x2={isVertical ? xStart : xStart + 20} 
                    y2={isVertical ? yStart + 20 : yStart} 
                    className="door-line" 
                  />
                  <path 
                    d={isVertical 
                      ? `M ${xStart} ${yStart} A 20 20 0 0 0 ${xStart - 20} ${yStart + 20}` 
                      : isOpenLeft
                        ? `M ${xStart} ${yStart} A 20 20 0 0 0 ${xStart} ${yStart + 20}`
                        : `M ${xStart + 20} ${yStart} A 20 20 0 0 1 ${xStart + 20} ${yStart + 20}`
                    } 
                    className="door-arc" 
                  />
                  <text x={xStart + (isVertical ? -25 : 10)} y={yStart - 8} className="map-label-muted" style={{ fontSize: '9px' }}>
                    {door.name}
                  </text>
                </g>
              );
            })}

            {/* EXIT SIGN beacon */}
            <circle cx="80" cy="120" r="4" fill="var(--danger)" className="exit-door-node" />

            {/* ROUTE DISPLAY glow-path */}
            {pathCoords.length > 1 && (
              <path
                d={`M ${pathCoords.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                className="glowing-route-line"
              />
            )}

            {/* USER LOCATION DOT */}
            <g>
              <circle cx={userX} cy={userY} className="user-pulse-ring" />
              <circle cx={userX} cy={userY} r="8" className="user-position-dot" />
              <polygon
                points={`${userX},${userY - 14} ${userX - 6},${userY - 4} ${userX + 6},${userY - 4}`}
                className="user-direction-pointer"
                transform={`rotate(${userHeading}, ${userX}, ${userY})`}
              />
            </g>
          </svg>
        </div>
      </div>

      {/* GLASSMORPHIC GUIDANCE CARD & CONTROLS */}
      <div className="nav-glass-card">
        <h3 style={{ borderBottom: '1px solid var(--divider)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Compass size={20} className="text-primary" /> Direction Guidance
        </h3>

        {/* Search controls */}
        <div className="search-controls-wrapper">
          <div className="search-select-box">
            <label htmlFor="start-room-select">Start Place</label>
            <select 
              id="start-room-select"
              value={startRoom}
              onChange={(e) => {
                setStartRoom(e.target.value);
                handleResetNavigation();
              }}
            >
              {Object.values(ROOMS).map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="search-select-box">
            <label htmlFor="target-room-select">Destination Place</label>
            <select 
              id="target-room-select"
              value={targetRoom}
              onChange={(e) => {
                setTargetRoom(e.target.value);
                handleResetNavigation();
              }}
            >
              {Object.values(ROOMS).map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* DIRECTION STATUS INDICATOR DISPLAY CARD */}
        <div className={`direction-indicator-card ${navStatus.classStr}`}>
          {navStatus.status === 'ON_TRACK' && <CheckCircle2 size={24} />}
          {navStatus.status === 'ARRIVED' && <Sparkles size={24} />}
          {navStatus.status === 'WRONG_WAY' && <AlertTriangle size={24} />}
          {['DRIFT_LEFT', 'DRIFT_RIGHT'].includes(navStatus.status) && <Info size={24} />}
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.85 }}>
              Direction Alignment
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              {navStatus.text}
            </span>
          </div>
        </div>

        {/* 3D Compass */}
        <div className="compass-wrapper">
          <div className="guidance-compass" style={{ transform: `rotate(${-userHeading}deg)` }}>
            <div className="compass-rose">
              <span className="compass-card-label compass-label-n">N</span>
              <span className="compass-card-label compass-label-e">E</span>
              <span className="compass-card-label compass-label-s">S</span>
              <span className="compass-card-label compass-label-w">W</span>
            </div>

            <div className="guidance-needle" style={{ transform: `rotate(${headingDiff}deg)` }}>
              <div className="guidance-needle-north"></div>
              <div className="guidance-needle-south"></div>
              <div className="compass-center-cap"></div>
            </div>
          </div>
          
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Compass Angle: <strong>{userHeading}°</strong> | Target Angle: <strong>{targetHeading}°</strong>
          </div>
        </div>

        {/* Step list narrative */}
        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '1rem', marginBottom: '0.5rem' }}>
          Path Instructions
        </h4>
        
        <div className="directions-list">
          {computedPath.map((nodeId, idx) => {
            const isCompleted = idx < pathStepIndex;
            const isActive = idx === pathStepIndex;
            
            let desc = '';
            if (nodeId.startsWith('n_')) {
              const rId = nodeId.substring(2);
              if (ROOMS[rId]) {
                desc = idx === 0 
                  ? `Start inside ${ROOMS[rId].name}` 
                  : `Enter doorway into ${ROOMS[rId].name}`;
              } else if (DOORS[rId]) {
                desc = `Go through ${DOORS[rId].name}`;
              }
            }

            if (!desc) return null;

            return (
              <div 
                key={nodeId} 
                className={`direction-step-card ${isActive ? 'step-active' : ''} ${isCompleted ? 'step-completed' : ''}`}
              >
                <div style={{ marginTop: '2px' }}>
                  {isCompleted ? (
                    <CheckCircle2 size={16} className="text-success" />
                  ) : isActive ? (
                    <ArrowUp size={16} className="text-primary" />
                  ) : (
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--border-strong)', margin: '5px' }}></span>
                  )}
                </div>
                <div>{desc}</div>
              </div>
            );
          })}
        </div>

        {/* Walk Simulator Controls & Calibration */}
        <div className="sim-controls-panel no-print">
          <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Simulation Adjustments
          </h4>

          {/* Compass Slider */}
          <div className="sim-slider-row">
            <div style={{ display: 'flex', justifyContent: 'between', fontSize: '0.75rem' }}>
              <span>Facing Heading (Slider)</span>
              <span className="text-primary font-semibold">{userHeading}°</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="359" 
              value={userHeading} 
              onChange={(e) => setUserHeading(parseInt(e.target.value))} 
              className="sim-slider-input"
            />
          </div>

          <div className="sim-button-group">
            <button className="btn-secondary sim-btn" onClick={handleResetNavigation}>
              <RotateCcw size={14} /> Reset Pos
            </button>
            <button className="btn-primary sim-btn" onClick={handleSimulateStep} disabled={navStatus.status === 'ARRIVED'}>
              <ArrowUp size={14} /> Step Walk
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
