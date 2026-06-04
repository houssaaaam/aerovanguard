import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { 
  Briefcase, MapPin, Users, Clock, TrendingUp, Activity, 
  Search, Filter, Plus, X, Wand2, Bell, RefreshCw, Battery
} from 'lucide-react';

// 🗺️ CASABLANCA OPERATIONAL SECTOR COORDINATES MAPPING
const CASABLANCA_ZONES = {
  "Maârif / Twin Center": { lat: 33.587, lng: -7.632 },
  "Sidi Maarouf / Technopark": { lat: 33.542, lng: -7.631 },
  "Anfa / CIL": { lat: 33.596, lng: -7.662 },
  "Ain Diab / Coastline": { lat: 33.595, lng: -7.685 },
  "Roches Noires / Center": { lat: 33.599, lng: -7.592 },
  "Sidi Moumen": { lat: 33.582, lng: -7.531 }
};

const HQ_COORDS = { lat: 33.573, lng: -7.618 }; 

const DEFAULT_TICKETS = [
  {
    id: "TK-1042",
    title: "Core Router Setup & Config",
    client: "Enterprise HQ",
    zone: "Anfa / CIL",
    assignedTo: "Alex Rivera",
    status: "Pending",
    priority: "High",
    requiredSkill: "Network",
    lat: 33.596,
    lng: -7.662,
    description: "Deploy and provision dual-stack edge gateway. Verify BGP routing tables."
  },
  {
    id: "TK-1043",
    title: "Industrial HVAC Intake Repair",
    client: "Apex Manufacturing Plant",
    zone: "Roches Noires / Center",
    assignedTo: "Youssef Amrani",
    status: "In Progress",
    priority: "Critical",
    requiredSkill: "Mechanical",
    lat: 33.599,
    lng: -7.592,
    description: "Compressor unit locked up. Technical emergency overlay required to prevent line shutdown."
  },
  {
    id: "TK-1044",
    title: "Fiber Optic Line Audit",
    client: "Medina Retail Complex",
    zone: "Maârif / Twin Center",
    assignedTo: "Sarah Connor",
    status: "Completed",
    priority: "Medium",
    requiredSkill: "Fiber",
    lat: 33.587,
    lng: -7.632,
    description: "OTDR testing completed on backbone segment. 0.2dB loss recorded."
  }
];

const INITIAL_TECHS = [
  { name: "Alex Rivera", role: "Network Specialist", specialty: "Network", status: "Available", battery: 92 },
  { name: "Youssef Amrani", role: "Mechanical Systems", specialty: "Mechanical", status: "On-Site", battery: 74 },
  { name: "Sarah Connor", role: "Fiber Technician", specialty: "Fiber", status: "En Route", battery: 48 },
  { name: "Amine Bennani", role: "Cybersecurity Analyst", specialty: "Network", status: "Available", battery: 89 },
  { name: "Fatima Zahra", role: "Systems Infrastructure", specialty: "Systems", status: "On-Site", battery: 61 },
  { name: "Karim Idrissi", role: "Telecom Lineman", specialty: "Fiber", status: "En Route", battery: 35 }
];

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

export default function App() {
  const [tickets, setTickets] = useState(() => {
    const localData = localStorage.getItem('logilink_telemetry_tickets');
    return localData ? JSON.parse(localData) : DEFAULT_TICKETS;
  });

  const [techs, setTechs] = useState(INITIAL_TECHS);
  const [systemEfficiency, setSystemEfficiency] = useState(98.4);
  const [isSyncing, setIsSyncing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedTechFilter, setSelectedTechFilter] = useState(null);
  
  const [activeMobileTab, setActiveMobileTab] = useState('PENDING');
  const [notification, setNotification] = useState(null);

  const [newTitle, setNewTitle] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newZone, setNewZone] = useState('Maârif / Twin Center');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    localStorage.setItem('logilink_telemetry_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    const telemetryInterval = setInterval(() => {
      setSystemEfficiency(prev => {
        const delta = (Math.random() * 0.4 - 0.2);
        return parseFloat(Math.min(99.9, Math.max(96.5, prev + delta)).toFixed(1));
      });

      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 800);

      setTechs(prevTechs => prevTechs.map(t => {
        if (t.status !== "Available" && t.battery > 5) {
          const drain = Math.random() > 0.6 ? 1 : 0;
          return { ...t, battery: t.battery - drain };
        }
        return t;
      }));
    }, 5000);

    return () => clearInterval(telemetryInterval);
  }, []);

  const advanceTicketStatus = (ticketId, currentStatus, techName = null) => {
    const statusMap = {
      'Pending': 'In Progress',
      'In Progress': 'Completed',
      'Completed': 'Pending'
    };
    
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        const nextStatus = statusMap[currentStatus];
        if (currentStatus === 'Pending' && techName) {
          setTechs(curr => curr.map(tech => tech.name === techName ? { ...tech, status: 'On-Site' } : tech));
        }
        return { 
          ...t, 
          status: nextStatus,
          assignedTo: currentStatus === 'Pending' ? (techName || "Alex Rivera") : (currentStatus === 'Completed' ? "Unassigned" : t.assignedTo)
        };
      }
      return t;
    }));
  };

  const suggestBestWithAI = (ticket) => {
    const availableCrew = techs.filter(tech => tech.status === "Available");

    if (availableCrew.length === 0) {
      setNotification({
        type: 'alert',
        title: 'Automation Routing Error',
        message: 'All system operational field personnel are currently assigned to active deployment perimeters.',
        onConfirm: () => setNotification(null)
      });
      return;
    }

    const perfectExpert = availableCrew.find(tech => tech.specialty === (ticket.requiredSkill || "Network"));

    if (perfectExpert) {
      setNotification({
        type: 'confirm',
        title: 'AI Roster Match Found',
        message: `Unit "${perfectExpert.name}" matches the required skill profile [${ticket.requiredSkill || "Network"}] for "${ticket.title}".`,
        actionLabel: 'Approve & Deploy',
        onConfirm: () => {
          setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, assignedTo: perfectExpert.name, status: "In Progress" } : t));
          setTechs(curr => curr.map(tech => tech.name === perfectExpert.name ? { ...tech, status: 'On-Site' } : tech));
          setNotification(null);
        }
      });
      return;
    }

    const highestBatteryUnit = [...availableCrew].sort((a, b) => b.battery - a.battery)[0];

    if (highestBatteryUnit) {
      setNotification({
        type: 'confirm',
        title: 'AI Smart Fallback Suggestion',
        message: `No exact matches online. Deploy "${highestBatteryUnit.name}" based on optimal terminal power parameters (${highestBatteryUnit.battery}% battery remaining).`,
        actionLabel: 'Deploy Fallback Unit',
        onConfirm: () => {
          setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, assignedTo: highestBatteryUnit.name, status: "In Progress" } : t));
          setTechs(curr => curr.map(tech => tech.name === highestBatteryUnit.name ? { ...tech, status: 'On-Site' } : tech));
          setNotification(null);
        }
      });
    }
  };

  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!newTitle || !newClient) return;

    const targetCoords = CASABLANCA_ZONES[newZone];
    const nextId = `TK-${1000 + Math.floor(Math.random() * 9000)}`;

    let mappedSkill = "Network";
    if (newTitle.toLowerCase().includes('fiber') || newDesc.toLowerCase().includes('fiber')) mappedSkill = "Fiber";
    if (newTitle.toLowerCase().includes('hvac') || newTitle.toLowerCase().includes('repair')) mappedSkill = "Mechanical";
    if (newTitle.toLowerCase().includes('system') || newTitle.toLowerCase().includes('infra')) mappedSkill = "Systems";

    const newTicket = {
      id: nextId,
      title: newTitle,
      client: newClient,
      zone: newZone,
      assignedTo: "Unassigned",
      status: "Pending",
      priority: newPriority,
      requiredSkill: mappedSkill,
      lat: targetCoords.lat,
      lng: targetCoords.lng,
      description: newDesc || "No additional description protocols filed."
    };

    setTickets([newTicket, ...tickets]);
    setNewTitle('');
    setNewClient('');
    setNewZone('Maârif / Twin Center');
    setNewPriority('Medium');
    setNewDesc('');
    setIsModalOpen(false);
  };

  const deleteTicketLog = (id) => {
    setNotification({
      type: 'confirm',
      title: 'Scrub Telemetry Archive',
      message: `Are you absolutely sure you want to permanently erase incident record ${id} from live console metrics?`,
      actionLabel: 'Erase Record',
      onConfirm: () => {
        setTickets(prev => prev.filter(t => t.id !== id));
        setNotification(null);
      }
    });
  };

  const triggerHardConsoleReset = () => {
    setNotification({
      type: 'confirm',
      title: 'Emergency Console Reset Sequence',
      message: 'This protocol will wipe local modifications, restore core database records, and reset tactical roster parameters.',
      actionLabel: 'Execute Hard Reset',
      onConfirm: () => {
        localStorage.removeItem('logilink_telemetry_tickets');
        setTickets(DEFAULT_TICKETS);
        setTechs(INITIAL_TECHS);
        setSelectedTechFilter(null);
        setPriorityFilter('ALL');
        setSearchQuery('');
        setNotification(null);
      }
    });
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    const matchesTech = !selectedTechFilter || t.assignedTo === selectedTechFilter;
    return matchesSearch && matchesPriority && matchesTech;
  });

  const pendingTickets = filteredTickets.filter(t => t.status === 'Pending');
  const inProgressTickets = filteredTickets.filter(t => t.status === 'In Progress');
  const completedTickets = filteredTickets.filter(t => t.status === 'Completed');

  const getPriorityStyle = (priority) => {
    switch(priority) {
      case 'Critical': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'High': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Medium': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-white/5';
    }
  };

  const renderTelemetryMap = () => (
    <MapContainer 
      center={[33.585, -7.62]} 
      zoom={12} 
      style={{ height: '100%', width: '100%' }} 
      zoomControl={false} 
      dragging={true}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap &copy; CARTO'
      />
      
      <Marker position={[HQ_COORDS.lat, HQ_COORDS.lng]} icon={L.divIcon({
        className: 'bg-blue-500 h-3 w-3 rounded-full border-2 border-white animate-pulse shadow-md shadow-blue-500/80',
        iconSize: [12, 12]
      })}/>

      {filteredTickets.map(t => {
        const isTargetActive = t.status === 'In Progress';
        return (
          <React.Fragment key={t.id}>
            <Polyline 
              positions={[[HQ_COORDS.lat, HQ_COORDS.lng], [t.lat, t.lng]]}
              pathOptions={{
                color: isTargetActive ? '#f59e0b' : '#3b82f6',
                weight: isTargetActive ? 2 : 1,
                dashArray: isTargetActive ? '6, 6' : '3, 6',
                opacity: isTargetActive ? 0.7 : 0.3
              }}
            />
            <Marker position={[t.lat, t.lng]}>
              <Popup>
                <div className="w-56 p-0.5 font-sans text-slate-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-md">
                      {t.id}
                    </span>
                    <span className={`text-[8px] font-bold uppercase tracking-wider font-mono px-1.5 py-0.5 rounded border ${getPriorityStyle(t.priority)}`}>
                      {t.priority}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 mb-0.5 leading-snug">{t.title}</h4>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 font-medium mb-1">
                    <Briefcase className="h-3 w-3 text-slate-500 shrink-0" /> {t.client}
                  </p>
                  <p className="text-[10px] text-blue-400 font-mono flex items-center gap-1 mb-2">
                    <MapPin className="h-3 w-3 text-blue-500/70" /> {t.zone}
                  </p>
                  <div className="bg-slate-950/80 border border-white/5 rounded-lg p-2 mb-2">
                    <p className="text-[10px] text-slate-400 italic leading-relaxed">"{t.description}"</p>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex flex-col gap-1 font-mono text-[10px]">
                    <div className="flex justify-between items-center">
                      <span>Status:</span>
                      <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                        t.status === 'Pending' ? 'text-blue-400 bg-blue-500/5' :
                        t.status === 'In Progress' ? 'text-amber-400 bg-amber-500/5' : 'text-emerald-400 bg-emerald-500/5'
                      }`}>{t.status}</span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <span className="text-slate-400">Assigned:</span>
                      <span className="text-blue-400 font-sans font-semibold text-xs">{t.assignedTo}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}
    </MapContainer>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-blue-500/30 font-sans tracking-tight">
      
      {/* 📡 PREMIUM OVERHAULED HIGH-END HEADER CONTAINER */}
      <header className="border-b border-white/10 bg-slate-900/40 backdrop-blur-xl px-6 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between sticky top-0 z-40 shadow-xl shadow-slate-950/40">
        <div className="flex items-center space-x-4 self-start sm:self-auto">
          
          {/* PREMIUM BRAND LOGO (CUSTOM VECTOR NETWORK ARCHITECTURE) */}
          <div className="relative flex items-center justify-center h-10 w-10 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 border border-white/15 rounded-xl shadow-inner group shrink-0">
            <div className="absolute inset-0 bg-blue-500/10 rounded-xl blur-md opacity-70 group-hover:opacity-100 transition-opacity" />
            <svg className="h-5 w-5 text-blue-400 transition-transform duration-700 group-hover:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 22 8.5 12 15 2 8.5 12 2" className="text-blue-500 fill-blue-500/10" />
              <path d="M2 12.5l10 6.5 10-6.5" strokeWidth="1.5" strokeOpacity="0.6" />
              <path d="M2 16.5l10 6.5 10-6.5" strokeWidth="1.5" strokeOpacity="0.3" />
              <circle cx="12" cy="8.5" r="1.5" fill="currentColor" className="text-white animate-pulse" />
            </svg>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-black tracking-wider uppercase text-white font-sans">
                Aero<span className="text-blue-500 font-extrabold tracking-tight">Vanguard</span>
              </h1>
              <span className="hidden sm:inline-block font-mono text-[9px] font-semibold text-slate-400 border border-white/10 bg-white/5 px-2 py-0.5 rounded-md uppercase tracking-widest backdrop-blur-xs">
                [Node // CMN-05]
              </span>
            </div>
            <p className="text-[10px] font-mono font-medium text-slate-500 tracking-wider mt-0.5 uppercase">
              Tactical Fleet Dispatch Engine
            </p>
          </div>
        </div>

        {/* CONTROLS SUB-PANEL */}
        <div className="flex items-center justify-between sm:justify-end space-x-4 w-full sm:w-auto font-mono text-[11px] pt-3 sm:pt-0 border-t border-white/5 sm:border-0">
          <div className="flex items-center space-x-2 border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 rounded-xl text-emerald-400 font-bold tracking-wider text-[9px] shadow-sm">
            <span className={`h-2 w-2 rounded-full bg-emerald-400 ${isSyncing ? 'scale-125 bg-emerald-300' : 'animate-pulse'}`} />
            <span>SYSTEM_LIVE</span>
          </div>
          
          <button 
            onClick={triggerHardConsoleReset}
            className="bg-slate-900 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-xl px-3.5 py-1.5 transition-all flex items-center gap-2 font-bold cursor-pointer hover:bg-slate-950 shadow-md min-h-[32px] active:scale-98"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Reset Matrix</span>
          </button>
        </div>
      </header>

      {/* 📊 RUNTIME SYSTEM PERFORMANCE METRICS */}
      <section className="bg-slate-900/20 border-b border-white/5 px-6 py-3.5 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 shrink-0">
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-3 flex items-center space-x-3.5 hover:border-white/10 transition-colors">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 shrink-0"><Activity className="h-4 w-4" /></div>
          <div className="min-w-0">
            <p className="text-[9px] uppercase font-mono tracking-widest text-slate-500 truncate">Telemetry Performance</p>
            <p className="text-sm font-black text-slate-200 tracking-tight">{systemEfficiency}% Efficiency</p>
          </div>
        </div>
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-3 flex items-center space-x-3.5 hover:border-white/10 transition-colors">
          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 shrink-0"><Users className="h-4 w-4" /></div>
          <div className="min-w-0">
            <p className="text-[9px] uppercase font-mono tracking-widest text-slate-500 truncate">Roster Allocation</p>
            <p className="text-sm font-black text-slate-200 tracking-tight">{techs.length} Active Units</p>
          </div>
        </div>
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-3 flex items-center space-x-3.5 hover:border-white/10 transition-colors">
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 shrink-0"><Clock className="h-4 w-4" /></div>
          <div className="min-w-0">
            <p className="text-[9px] uppercase font-mono tracking-widest text-slate-500 truncate">Active Filter Boundary</p>
            <p className="text-sm font-black text-amber-400 font-mono truncate">
              {selectedTechFilter ? selectedTechFilter.split(' ')[0] : "Global Stream"}
            </p>
          </div>
        </div>
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-3 flex items-center space-x-3.5 hover:border-white/10 transition-colors">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 shrink-0"><TrendingUp className="h-4 w-4" /></div>
          <div className="min-w-0">
            <p className="text-[9px] uppercase font-mono tracking-widest text-slate-500 truncate">Database Safeguard</p>
            <p className="text-sm font-black text-emerald-400 tracking-tight">LocalStorage ON</p>
          </div>
        </div>
      </section>

      {/* 🔍 OPERATIONAL FILTER SUB-NAVBAR (PREMIUM REMODEL) */}
      <section className="bg-slate-900/60 border-b border-white/10 px-6 py-3 flex flex-col md:flex-row gap-3 justify-between items-center shrink-0 shadow-lg relative z-20">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input 
            type="text"
            placeholder="Search routing registry by client, ticket ID, or task..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {selectedTechFilter && (
            <button 
              onClick={() => setSelectedTechFilter(null)}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer h-9 shadow-md"
            >
              <span>Clear Lock</span> <X className="h-3 w-3" />
            </button>
          )}

          {/* CHROME / FIREFOX DROPBOX FIX LAYER */}
          <div className="relative flex items-center bg-slate-950/80 border border-white/10 rounded-xl px-3 h-9 group hover:border-white/20 transition-all w-full sm:w-auto">
            <Filter className="h-3.5 w-3.5 text-slate-500 mr-2 shrink-0" />
            <select 
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-300 focus:outline-none cursor-pointer pr-6 appearance-none relative z-10 h-full w-full outline-none border-0"
              style={{ colorScheme: 'dark' }}
            >
              <option value="ALL" className="bg-slate-950 text-slate-300">Show All Priorities</option>
              <option value="Critical" className="bg-slate-950 text-red-400">🔴 Critical Operations</option>
              <option value="High" className="bg-slate-950 text-amber-400">🟡 High Urgency</option>
              <option value="Medium" className="bg-slate-950 text-blue-400">🔵 Medium Routine</option>
              <option value="Low" className="bg-slate-950 text-slate-400">⚪ Low Monitoring</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[9px] font-sans font-bold">▼</div>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 rounded-xl transition-all flex items-center space-x-2 h-9 shadow-md shadow-blue-900/20 active:scale-98 cursor-pointer w-full sm:w-auto justify-center shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Log Ticket</span>
          </button>
        </div>
      </section>

      {/* 📊 MAIN CONSOLE MATRIX CONTAINER */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-5 p-3 sm:p-6 gap-4 sm:gap-6 overflow-y-auto xl:overflow-hidden">
        
        {/* LEFT PANEL: INTERACTIVE MAP & ACTIVE ROSTER */}
        <div className="xl:col-span-2 flex flex-col space-y-4 sm:space-y-6 xl:h-full">
          <div className="bg-indigo-950/10 border border-white/5 rounded-2xl p-3 sm:p-5 flex flex-col h-[280px] sm:h-[340px] xl:h-1/2 shrink-0 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <MapPin className="h-3.5 w-3.5 text-blue-400" />
                <h2 className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-slate-400">Live Telemetry Mapping</h2>
              </div>
              <button 
                onClick={() => setIsMapExpanded(true)}
                className="p-1 rounded bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all text-[10px] font-mono px-2 py-1 min-h-[28px] cursor-pointer"
              >
                Fullscreen
              </button>
            </div>
            
            <div className="flex-1 rounded-xl overflow-hidden border border-white/10 shadow-inner relative z-10">
              {renderTelemetryMap()}
            </div>
          </div>

          {/* ACTIVE FIELD PERSONNEL ROSTER */}
          <div className="bg-indigo-950/10 border border-white/5 rounded-2xl p-3 sm:p-5 flex-1 shadow-xl flex flex-col overflow-hidden max-h-[300px] xl:max-h-none xl:h-1/2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Users className="h-3.5 w-3.5 text-blue-400" />
                <h2 className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-slate-400">Field Personnel Roster ({techs.length})</h2>
              </div>
            </div>
            <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
              {techs.map(tech => {
                const isSelected = selectedTechFilter === tech.name;
                return (
                  <div 
                    key={tech.name} 
                    onClick={() => setSelectedTechFilter(isSelected ? null : tech.name)}
                    className={`p-2 border rounded-xl flex items-center justify-between transition-all cursor-pointer min-h-[48px] ${
                      isSelected ? 'bg-blue-950/40 border-blue-500/50' : 'bg-slate-950/40 border-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 text-white shadow ${isSelected ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-blue-600 to-indigo-600'}`}>
                        {tech.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-slate-200 truncate">{tech.name}</h4>
                        <p className="text-[9px] text-slate-500 font-mono truncate">{tech.role}</p>
                      </div>
                    </div>
                    <div className="text-right font-mono text-[9px] shrink-0 pl-1">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold ${
                        tech.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>{tech.status}</span>
                      <p className="text-slate-500 mt-0.5 flex items-center justify-end gap-0.5"><Battery className="h-2.5 w-2.5" /> {tech.battery}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN PANEL */}
        <div className="xl:col-span-3 bg-indigo-950/5 border border-white/5 rounded-2xl p-3 sm:p-5 flex flex-col shadow-2xl relative overflow-hidden xl:h-full">
          <div className="flex xl:hidden bg-slate-950 p-1 border border-white/5 rounded-xl mb-3 gap-1 shrink-0 min-h-[40px]">
            <button onClick={() => setActiveMobileTab('PENDING')} className={`flex-1 text-center py-1.5 text-[11px] font-mono font-bold rounded-lg transition-all ${activeMobileTab === 'PENDING' ? 'bg-blue-600 text-white shadow' : 'text-slate-400'}`}>
              Queue ({pendingTickets.length})
            </button>
            <button onClick={() => setActiveMobileTab('PROGRESS')} className={`flex-1 text-center py-1.5 text-[11px] font-mono font-bold rounded-lg transition-all ${activeMobileTab === 'PROGRESS' ? 'bg-amber-600 text-white shadow' : 'text-slate-400'}`}>
              Active ({inProgressTickets.length})
            </button>
            <button onClick={() => setActiveMobileTab('COMPLETED')} className={`flex-1 text-center py-1.5 text-[11px] font-mono font-bold rounded-lg transition-all ${activeMobileTab === 'COMPLETED' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400'}`}>
              Done ({completedTickets.length})
            </button>
          </div>

          <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-4 overflow-hidden h-full">
            
            {/* COLUMN 1: PENDING CONTROL REGISTRY */}
            <div className={`bg-slate-950/40 border border-white/5 rounded-xl p-3 flex flex-col h-full overflow-hidden ${activeMobileTab === 'PENDING' ? 'flex' : 'hidden xl:flex'}`}>
              <div className="hidden xl:flex justify-between items-center mb-2 pb-1 border-b border-white/5">
                <span className="text-[11px] font-bold uppercase font-mono tracking-wider text-slate-400">Queue / Intake</span>
                <span className="bg-white/5 text-slate-300 rounded-full px-2 py-0.5 text-xs font-mono">{pendingTickets.length}</span>
              </div>
              <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                {pendingTickets.map(ticket => (
                  <div key={ticket.id} className="bg-slate-900/60 border border-white/5 rounded-xl p-3.5 hover:border-blue-500/30 transition-all relative group">
                    <button onClick={() => deleteTicketLog(ticket.id)} className="absolute top-3 right-3 opacity-100 xl:opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 min-h-[32px] min-w-[32px] cursor-pointer">
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex justify-between items-start mb-1.5 pr-5">
                      <span className="text-xs font-mono text-blue-400 font-bold">{ticket.id} <span className="text-[8px] text-slate-500 font-normal">({ticket.requiredSkill})</span></span>
                      <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded border ${getPriorityStyle(ticket.priority)}`}>{ticket.priority}</span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-200 mb-1 truncate">{ticket.title}</h3>
                    <p className="text-[11px] text-slate-400 flex items-center mb-0.5 truncate"><Briefcase className="h-3 w-3 mr-1 text-slate-500 shrink-0" /> {ticket.client}</p>
                    <p className="text-[10px] text-blue-400 font-mono mb-2 flex items-center gap-1"><MapPin className="h-3 w-3 text-blue-500/60" /> {ticket.zone}</p>
                    
                    <div className="mb-2.5">
                      <div className="relative flex items-center bg-slate-950 border border-white/5 rounded-lg min-h-[36px]">
                        <select id={`select-tech-${ticket.id}`} className="w-full bg-transparent px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer font-medium appearance-none relative z-10 pr-6 border-0 outline-none" style={{ colorScheme: 'dark' }} defaultValue="">
                          <option value="" disabled className="bg-slate-950">-- Choose Personnel --</option>
                          {techs.map(tech => (
                            <option key={tech.name} value={tech.name} className="bg-slate-950">{tech.name} ({tech.status})</option>
                          ))}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[8px]">▼</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[11px] font-mono">
                      <button onClick={() => suggestBestWithAI(ticket)} className="text-blue-400/80 text-[10px] font-bold transition-colors flex items-center gap-0.5 bg-blue-500/5 border border-blue-500/10 px-2 py-1 rounded min-h-[28px] cursor-pointer">
                        <Wand2 className="h-3 w-3" /> <span>Suggest</span>
                      </button>
                      <button 
                        onClick={() => {
                          const selectEl = document.getElementById(`select-tech-${ticket.id}`);
                          if (!selectEl.value) {
                            setNotification({
                              type: 'alert',
                              title: 'Dispatch Order Rejected',
                              message: 'Please select a field technician from the roster before launching tracking updates.',
                              onConfirm: () => setNotification(null)
                            });
                            return;
                          }
                          advanceTicketStatus(ticket.id, 'Pending', selectEl.value);
                        }} 
                        className="text-slate-300 hover:text-white font-bold text-[10px] min-h-[28px] cursor-pointer"
                      >
                        Deploy Order ➔
                      </button>
                    </div>
                  </div>
                ))}
                {pendingTickets.length === 0 && <p className="text-[11px] font-mono text-slate-600 text-center py-6">No pending tickets.</p>}
              </div>
            </div>

            {/* COLUMN 2: IN PROGRESS RUNTIME MATRIX */}
            <div className={`bg-slate-950/40 border border-white/5 rounded-xl p-3 flex flex-col h-full overflow-hidden ${activeMobileTab === 'PROGRESS' ? 'flex' : 'hidden xl:flex'}`}>
              <div className="hidden xl:flex justify-between items-center mb-2 pb-1 border-b border-white/5">
                <span className="text-[11px] font-bold uppercase font-mono tracking-wider text-amber-400">Running Active</span>
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5 text-xs font-mono">{inProgressTickets.length}</span>
              </div>
              <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                {inProgressTickets.map(ticket => (
                  <div key={ticket.id} className="bg-slate-900/60 border border-amber-500/10 rounded-xl p-3.5 shadow">
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-xs font-mono text-amber-400 font-bold">{ticket.id}</span>
                      <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded border ${getPriorityStyle(ticket.priority)}`}>{ticket.priority}</span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-200 mb-1 truncate">{ticket.title}</h3>
                    <p className="text-[11px] text-slate-400 flex items-center mb-0.5 truncate"><Briefcase className="h-3 w-3 mr-1 text-slate-500 shrink-0" /> {ticket.client}</p>
                    <p className="text-[10px] text-blue-400 font-mono mb-2.5 flex items-center gap-1"><MapPin className="h-3 w-3 text-blue-500/60" /> {ticket.zone}</p>
                    <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-300 truncate max-w-[110px]">Crew: <span className="text-blue-400 font-sans font-semibold">{ticket.assignedTo.split(' ')[0]}</span></span>
                      <button 
                        onClick={() => {
                          advanceTicketStatus(ticket.id, 'In Progress');
                          setTechs(curr => curr.map(tech => tech.name === ticket.assignedTo ? { ...tech, status: 'Available' } : tech));
                        }} 
                        className="text-amber-400 font-bold min-h-[28px] cursor-pointer"
                      >
                        Complete ✓
                      </button>
                    </div>
                  </div>
                ))}
                {inProgressTickets.length === 0 && <p className="text-[11px] font-mono text-slate-600 text-center py-6">No active tickets.</p>}
              </div>
            </div>

            {/* COLUMN 3: COMPLETED ACTION REGISTRY LOGS */}
            <div className={`bg-slate-950/40 border border-white/5 rounded-xl p-3 flex flex-col h-full overflow-hidden ${activeMobileTab === 'COMPLETED' ? 'flex' : 'hidden xl:flex'}`}>
              <div className="hidden xl:flex justify-between items-center mb-2 pb-1 border-b border-white/5">
                <span className="text-[11px] font-bold uppercase font-mono tracking-wider text-emerald-400">Archived Logs</span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5 text-xs font-mono">{completedTickets.length}</span>
              </div>
              <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                {completedTickets.map(ticket => (
                  <div key={ticket.id} className="bg-slate-900/30 border border-emerald-500/5 rounded-xl p-3.5 opacity-70 shadow">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-mono text-emerald-400 font-bold">{ticket.id}</span>
                    </div>
                    <h3 className="text-xs font-bold line-through text-slate-400 truncate mb-1">{ticket.title}</h3>
                    <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-500 truncate">Tech: {ticket.assignedTo.split(' ')[0]}</span>
                      <button onClick={() => advanceTicketStatus(ticket.id, 'Completed')} className="text-slate-400 hover:text-slate-200 min-h-[24px] cursor-pointer">Reset ↺</button>
                    </div>
                  </div>
                ))}
                {completedTickets.length === 0 && <p className="text-[11px] font-mono text-slate-600 text-center py-6">No logs archived.</p>}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 🔮 FULL-SCREEN MAP MODAL */}
      {isMapExpanded && (
        <div className="fixed inset-0 bg-slate-950/95 z-50 flex flex-col p-3 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 mb-3 bg-slate-900 border border-white/5 rounded-xl p-3 shadow-xl shrink-0">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-100">Geospatial Telemetry Matrix</h3>
              <p className="text-[9px] text-slate-500 font-mono">Sector: Casablanca Perimeter</p>
            </div>
            <button onClick={() => setIsMapExpanded(false)} className="bg-white/5 border border-white/10 text-slate-300 px-3 py-1.5 rounded-xl text-[11px] font-mono min-h-[32px] cursor-pointer">
              Exit ✕
            </button>
          </div>
          <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
            {renderTelemetryMap()}
          </div>
        </div>
      )}

      {/* 📝 NEW INCIDENT PACKET MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto">
            <div className="px-5 py-3.5 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-100">Log Operation Incident Packet</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200 p-2 min-h-[36px] cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTicket} className="p-4 sm:p-6 space-y-3.5">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Operational Objective *</label>
                <input type="text" required placeholder="e.g. Node Rectification" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/40 min-h-[36px]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Client Identity *</label>
                  <input type="text" required placeholder="Corporate handle" value={newClient} onChange={(e) => setNewClient(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/40 min-h-[36px]" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Classification Priority</label>
                  <div className="relative flex items-center bg-slate-950 border border-white/5 rounded-xl px-3 py-2 min-h-[36px]">
                    <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer w-full pr-4 appearance-none relative z-10 border-0 outline-none" style={{ colorScheme: 'dark' }}>
                      <option value="Critical" className="bg-slate-950">🔴 Critical Emergency</option>
                      <option value="High" className="bg-slate-950">🟡 High Priority</option>
                      <option value="Medium" className="bg-slate-950">🔵 Medium Normal</option>
                      <option value="Low" className="bg-slate-950">⚪ Low Telemetry</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[8px]">▼</div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Target Perimeter Zone</label>
                <div className="relative flex items-center bg-slate-950 border border-white/5 rounded-xl px-3 py-2 min-h-[36px]">
                  <select value={newZone} onChange={(e) => setNewZone(e.target.value)} className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer w-full pr-4 appearance-none relative z-10 border-0 outline-none" style={{ colorScheme: 'dark' }}>
                    {Object.keys(CASABLANCA_ZONES).map(zone => (
                      <option key={zone} value={zone} className="bg-slate-950">{zone}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[8px]">▼</div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Task Diagnostic Notes</label>
                <textarea rows="2" placeholder="Optional diagnostics protocols..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/40 resize-none" />
              </div>
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-white/5 text-slate-400 px-4 py-2 rounded-xl text-xs font-semibold min-h-[36px] cursor-pointer">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold min-h-[36px] shadow-md cursor-pointer">Confirm Allocation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🚀 CUSTOM TELEMETRY NOTIFICATION MODAL */}
      {notification && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-4 overflow-hidden border-t-4 border-t-blue-500 my-auto">
            <div className="flex items-start space-x-3">
              <Bell className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-slate-100 tracking-tight mb-1">{notification.title}</h3>
                <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">{notification.message}</p>
              </div>
            </div>
            
            <div className="mt-4 pt-2.5 border-t border-white/5 flex items-center justify-end gap-2 text-xs font-mono">
              {notification.type === 'confirm' && (
                <button onClick={() => setNotification(null)} className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 bg-white/5 min-h-[32px] cursor-pointer">
                  Dismiss
                </button>
              )}
              <button onClick={notification.onConfirm} className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white min-h-[32px] font-bold shadow-md cursor-pointer">
                {notification.actionLabel || 'Acknowledge'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}