import React, { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  collection, 
  collectionGroup,
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  getDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { 
  Leaf, 
  Plus, 
  LogOut, 
  Calendar, 
  Droplets, 
  Thermometer, 
  Sun, 
  Wind, 
  History, 
  MessageCircle, 
  AlertCircle, 
  ChevronRight,
  ChevronDown,
  Home,
  Settings,
  Bell,
  Trash2,
  Camera,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  User as UserIcon,
  TrendingUp,
  TrendingDown,
  Brain,
  Sparkles,
  AlertTriangle,
  ChevronLeft,
  Scissors,
  Sprout,
  Info,
  LayoutDashboard,
  RefreshCw,
  Lightbulb,
  Activity,
  BookOpen,
  Zap,
  DollarSign,
  Package,
  Edit,
  CloudRain,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, differenceInDays, addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import { Toaster, toast } from 'sonner';
import { Plant, PlantEvent, FarmerLog, Land, LandAIReport, UserProfile } from './types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { generatePlantProfile, diagnosePlantIssue, chatExpert, generateFarmerInsights, generateLandReport } from './services/geminiService';
import ReactMarkdown from 'react-markdown';

const isValidDate = (date: any) => {
  if (!date) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

const calculateHealth = (events: PlantEvent[]) => {
  let health = 90;
  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  sortedEvents.forEach(e => {
    if (e.type === 'health_issue') health -= 20;
    else if (e.status === 'completed') health += 5;
  });
  return Math.min(100, Math.max(0, health));
};

const calculateHealthHistory = (events: PlantEvent[], plantationDate: string) => {
  const history: { date: string, health: number }[] = [];
  let health = 90;
  
  const startDate = plantationDate ? plantationDate.split('T')[0] : new Date().toISOString().split('T')[0];
  
  history.push({
    date: startDate,
    health: health
  });

  const sortedEvents = [...events]
    .filter(e => e.status !== 'pending')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sortedEvents.forEach(e => {
    if (e.type === 'health_issue') health -= 20;
    else if (e.status === 'completed') health += 5;
    
    health = Math.min(100, Math.max(0, health));
    
    history.push({
      date: e.date.split('T')[0],
      health: health
    });
  });

  return history;
};

const getHealthStatus = (health: number) => {
  if (health >= 80) return { label: 'Optimal', color: 'bg-green-500', text: 'text-white' };
  if (health >= 50) return { label: 'Needs Attention', color: 'bg-amber-500', text: 'text-white' };
  return { label: 'Critical', color: 'bg-red-500', text: 'text-white' };
};

const PlantCard = ({ plant, onClick }: { plant: Plant, onClick: () => void }) => {
  const [events, setEvents] = useState<PlantEvent[]>([]);
  
  useEffect(() => {
    const q = query(collection(db, `plants/${plant.id}/events`), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlantEvent));
      setEvents(eList);
    }, (error) => {
      console.error("Error fetching events for plant card:", error);
    });
    return () => unsubscribe();
  }, [plant.id]);

  const health = calculateHealth(events);
  const status = getHealthStatus(health);

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="group cursor-pointer overflow-hidden rounded-3xl bg-surface-container-lowest shadow-2xl shadow-green-900/5 transition-all hover:shadow-primary/10"
      onClick={onClick}
    >
      <div className="relative h-64 overflow-hidden">
        <img 
          src={plant.imageUrl || `https://picsum.photos/seed/${plant.species}/600/400`} 
          alt={plant.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-4 right-4">
          <Badge className={`${status.color} ${status.text} border-none font-bold uppercase text-[10px] tracking-widest shadow-lg px-3 py-1`}>
            {status.label}
          </Badge>
        </div>
        <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
          <Button className="w-full organic-gradient text-white font-bold rounded-full">View Profile</Button>
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-black text-green-900">{plant.name}</h3>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${status.color} animate-pulse`} />
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{health}%</span>
          </div>
        </div>
        <p className="text-sm font-medium text-green-800/60 mb-4">{plant.species}</p>
        <div className="flex items-center gap-4 text-xs font-bold text-green-800/40 uppercase tracking-widest">
          <div className="flex items-center gap-1">
            <Droplets className="h-3 w-3" />
            {plant.careRequirements?.wateringFrequency.split(' ')[0] || "N/A"}
          </div>
          <div className="flex items-center gap-1">
            <Sun className="h-3 w-3" />
            {plant.careRequirements?.sunlightRequirement.split(' ')[0] || "N/A"}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const safeFormat = (date: any, formatStr: string) => {
  if (!isValidDate(date)) return 'Invalid Date';
  return format(new Date(date), formatStr);
};

const formatCareValue = (value: string | undefined) => {
  if (!value) return 'Not specified';
  
  // Handle short codes like 7d, 3w, 1m
  const match = value.match(/^(\d+)([dwm])$/i);
  if (match) {
    const num = match[1];
    const unit = match[2].toLowerCase();
    const unitStr = unit === 'd' ? 'days' : unit === 'w' ? 'weeks' : 'months';
    return `Every ${num} ${unitStr}`;
  }
  
  // Handle cases like "7 days" -> "Every 7 days" if it doesn't already start with "Every" or "Once"
  if (/^\d+\s+(days?|weeks?|months?)$/i.test(value)) {
    return `Every ${value}`;
  }

  return value;
};

const getFrequencyInDays = (freq: string | undefined): number => {
  if (!freq) return 7;
  const numMatch = freq.match(/\d+/);
  const num = numMatch ? parseInt(numMatch[0]) : 7;
  
  const lower = freq.toLowerCase();
  if (lower.includes('week')) return num * 7;
  if (lower.includes('month')) return num * 30;
  if (lower.includes('day')) return num;
  
  return 7;
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const DailyTip = () => {
  const [tip, setTip] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/tips')
      .then(res => res.json())
      .then(data => setTip(data.tip))
      .catch(err => console.error(err));
  }, []);

  if (!tip) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-primary/5 border border-primary/10 p-6 rounded-3xl flex items-start gap-4"
    >
      <div className="bg-primary/10 p-2 rounded-xl">
        <Lightbulb className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-1">Daily Botanical Tip</h4>
        <p className="text-sm text-green-800/70 leading-relaxed">{tip}</p>
      </div>
    </motion.div>
  );
};

const FarmerLogForm = ({ onAdd, onCancel, isLoading }: { onAdd: (data: any) => void, onCancel: () => void, isLoading: boolean }) => {
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'general' as any,
    title: '',
    expense: '',
    income: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      ...formData,
      expense: formData.expense ? parseFloat(formData.expense) : 0,
      income: formData.income ? parseFloat(formData.income) : 0
    });
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'general',
      title: '',
      expense: '',
      income: '',
      notes: ''
    });
  };

  return (
    <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
      <CardHeader className="pb-4 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold text-slate-800">New Entry</CardTitle>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <Plus className="h-5 w-5 rotate-45" />
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Input 
                placeholder="What did you do? e.g., Planted rice seedlings" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="rounded-xl border-slate-200 bg-slate-50/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v as any})}>
                <SelectTrigger className="rounded-xl border-slate-200 bg-slate-50/50">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">📝 General</SelectItem>
                  <SelectItem value="planting">🌱 Planting</SelectItem>
                  <SelectItem value="fertilizing">💧 Fertilizing</SelectItem>
                  <SelectItem value="harvesting">✂️ Harvesting</SelectItem>
                  <SelectItem value="expense">🏷️ Expense</SelectItem>
                  <SelectItem value="irrigation">🚿 Irrigation</SelectItem>
                  <SelectItem value="pest_control">🛡️ Pest Control</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Input 
                type="date" 
                value={formData.date} 
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="rounded-xl border-slate-200 bg-slate-50/50"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Expense ₹</span>
                <Input 
                  type="number"
                  placeholder="0" 
                  value={formData.expense} 
                  onChange={e => setFormData({...formData, expense: e.target.value})}
                  className="pl-20 rounded-xl border-slate-200 bg-slate-50/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Income ₹</span>
                <Input 
                  type="number"
                  placeholder="0" 
                  value={formData.income} 
                  onChange={e => setFormData({...formData, income: e.target.value})}
                  className="pl-20 rounded-xl border-slate-200 bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Textarea 
              placeholder="Add details... (optional)" 
              value={formData.notes} 
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="rounded-xl border-slate-200 bg-slate-50/50 min-h-[100px]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onCancel} className="rounded-xl font-bold text-slate-600">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="rounded-xl organic-gradient text-white font-bold px-8">
              {isLoading ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const FarmPlanner = ({ lands, onAddLand, onDeleteLand }: { lands: Land[], onAddLand: (data: any) => void, onDeleteLand: (id: string) => void }) => {
  const [isAddingLand, setIsAddingLand] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    area: '',
    areaUnit: 'acres' as const,
    cropType: '',
    treesPlanted: '',
    soilType: '',
    location: ''
  });
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const handleGenerateReport = async (land: Land) => {
    setIsGenerating(land.id);
    try {
      const report = await generateLandReport(land);
      await updateDoc(doc(db, 'lands', land.id), {
        aiReport: report
      });
      toast.success("AI Future Report Generated & Saved!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate AI report.");
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-black text-slate-800">AI Farm Planner</h2>
          </div>
          <p className="text-slate-500 text-sm font-medium">Manage your land and get AI-powered future insights</p>
        </div>
        <Button 
          onClick={() => setIsAddingLand(true)} 
          className="organic-gradient rounded-xl text-white font-bold flex items-center gap-2 px-6"
        >
          <Plus className="h-5 w-5" /> Add Land
        </Button>
      </div>

      {isAddingLand && (
        <Card className="rounded-2xl border-slate-100 shadow-xl overflow-hidden">
          <div className="organic-gradient p-6 text-white">
            <h3 className="text-xl font-bold">Register New Land</h3>
            <p className="text-green-50/80 text-sm">Tell us about your land to get started with AI planning.</p>
          </div>
          <CardContent className="p-8">
            <form onSubmit={(e) => { e.preventDefault(); onAddLand(formData); setIsAddingLand(false); }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold">Land Name</Label>
                  <Input 
                    placeholder="e.g. North Field" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Crop Type</Label>
                  <Input 
                    placeholder="e.g. Wheat, Rice, Cotton" 
                    value={formData.cropType} 
                    onChange={e => setFormData({...formData, cropType: e.target.value})}
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Area</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      placeholder="Size" 
                      value={formData.area} 
                      onChange={e => setFormData({...formData, area: e.target.value})}
                      required
                      className="rounded-xl flex-1"
                    />
                    <Select value={formData.areaUnit} onValueChange={(val: any) => setFormData({...formData, areaUnit: val})}>
                      <SelectTrigger className="w-32 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="acres">Acres</SelectItem>
                        <SelectItem value="hectares">Hectares</SelectItem>
                        <SelectItem value="sq_meters">Sq Meters</SelectItem>
                        <SelectItem value="bigha">Bigha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="font-bold">Trees/Plants Already Planted</Label>
                  <Input 
                    placeholder="e.g. 50 Mango trees, 20 Neem trees" 
                    value={formData.treesPlanted} 
                    onChange={e => setFormData({...formData, treesPlanted: e.target.value})}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Soil Type (Optional)</Label>
                  <Input 
                    placeholder="e.g. Clay, Sandy, Loam" 
                    value={formData.soilType} 
                    onChange={e => setFormData({...formData, soilType: e.target.value})}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Location (Optional)</Label>
                  <Input 
                    placeholder="e.g. Village Name, District" 
                    value={formData.location} 
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsAddingLand(false)} className="rounded-xl font-bold">Cancel</Button>
                <Button type="submit" className="organic-gradient rounded-xl text-white font-bold px-8">Register Land</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-8">
        {lands.map(land => (
          <Card key={land.id} className="rounded-2xl border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
            <div className="p-6 bg-slate-50/50 border-b flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Sprout className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{land.name}</h3>
                  <p className="text-sm text-slate-500 font-medium">{land.area} {land.areaUnit} • Growing {land.cropType}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleGenerateReport(land)} 
                  disabled={isGenerating === land.id}
                  className="organic-gradient rounded-xl text-white font-bold flex items-center gap-2"
                >
                  {isGenerating === land.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {land.aiReport ? "Regenerate AI Report" : "Generate AI Report"}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDeleteLand(land.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <CardContent className="p-8">
              {land.aiReport ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-blue-600 font-bold">
                      <Droplets className="h-5 w-5" />
                      <h4>Watering Schedule</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{land.aiReport.wateringSchedule}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-orange-600 font-bold">
                      <Package className="h-5 w-5" />
                      <h4>Fertilizer Needs</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{land.aiReport.fertilizerNeeds}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-red-600 font-bold">
                      <AlertTriangle className="h-5 w-5" />
                      <h4>Pest Alerts</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{land.aiReport.pestAlerts}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-700 font-bold">
                      <Calendar className="h-5 w-5" />
                      <h4>Harvest Prediction</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{land.aiReport.harvestPrediction}</p>
                  </div>
                  <div className="md:col-span-2 space-y-3 bg-primary/5 p-6 rounded-2xl border border-primary/10">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <Lightbulb className="h-5 w-5" />
                      <h4>AI Strategic Advice</h4>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed italic">"{land.aiReport.generalAdvice}"</p>
                  </div>
                  
                  <div className="md:col-span-3 space-y-6 mt-4">
                    <div className="flex items-center gap-2 text-slate-800 font-black text-lg">
                      <History className="h-6 w-6 text-primary" />
                      <h4>12-Month Care Roadmap</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {land.aiReport.roadmap.map((step, idx) => (
                        <div key={idx} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-xs font-black text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full">
                              {step.month}
                            </span>
                          </div>
                          <h5 className="font-bold text-slate-800 mb-2">{step.action}</h5>
                          <p className="text-xs text-slate-500 leading-relaxed">{step.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50/30 rounded-2xl border-2 border-dashed border-slate-100">
                  <Brain className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-slate-400">No AI Report Ready</h4>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto mt-2">Click the button above to generate a future-focused AI report for this land.</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {lands.length === 0 && !isAddingLand && (
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="h-10 w-10 text-slate-200" />
            </div>
            <h3 className="text-2xl font-black text-slate-800">No lands registered</h3>
            <p className="text-slate-500 max-w-xs mx-auto mt-2">Register your farming land to start receiving AI-powered future reports and planning.</p>
            <Button 
              onClick={() => setIsAddingLand(true)}
              className="mt-8 organic-gradient h-14 px-10 rounded-full text-white font-bold shadow-lg"
            >
              Register Your First Land
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const FarmerDiary = ({ logs, onAdd, onDelete }: { logs: FarmerLog[], onAdd: (data: any) => void, onDelete: (id: string) => void }) => {
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const totalExpenses = logs.reduce((acc, l) => acc + (l.expense || 0), 0);
  const totalIncome = logs.reduce((acc, l) => acc + (l.income || 0), 0);
  const totalProfit = totalIncome - totalExpenses;

  const filteredLogs = logs.filter(log => {
    if (!isValidDate(log.date)) return false;
    const matchesType = filterType === 'all' || log.type === filterType;
    const matchesFrom = !dateFrom || isAfter(new Date(log.date), startOfDay(new Date(dateFrom))) || format(new Date(log.date), 'yyyy-MM-dd') === dateFrom;
    const matchesTo = !dateTo || isBefore(new Date(log.date), startOfDay(addDays(new Date(dateTo), 1)));
    return matchesType && matchesFrom && matchesTo;
  });

  const expenseBreakdown = [
    { name: 'Planting', value: logs.filter(l => l.type === 'planting').reduce((acc, l) => acc + (l.expense || 0), 0), color: '#166534' },
    { name: 'Pest Control', value: logs.filter(l => l.type === 'pest_control').reduce((acc, l) => acc + (l.expense || 0), 0), color: '#991b1b' },
    { name: 'Harvesting', value: logs.filter(l => l.type === 'harvesting').reduce((acc, l) => acc + (l.expense || 0), 0), color: '#eab308' },
    { name: 'General', value: logs.filter(l => l.type === 'general').reduce((acc, l) => acc + (l.expense || 0), 0), color: '#64748b' },
  ].filter(d => d.value > 0);

  const incomeVsExpenseData = logs.reduce((acc: any[], log) => {
    if (!log.date || !isValidDate(log.date)) return acc;
    const date = safeFormat(log.date, 'MMM dd');
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.income += (log.income || 0);
      existing.expense += (log.expense || 0);
    } else {
      acc.push({ date, income: log.income || 0, expense: log.expense || 0 });
    }
    return acc;
  }, []).sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateA - dateB;
  }).slice(-7);

  const categories = [
    { id: 'all', label: 'All', icon: null },
    { id: 'planting', label: 'Planting', icon: <Sprout className="h-3 w-3" /> },
    { id: 'fertilizing', label: 'Fertilizing', icon: <Droplets className="h-3 w-3" /> },
    { id: 'harvesting', label: 'Harvesting', icon: <Scissors className="h-3 w-3" /> },
    { id: 'expense', label: 'Expense', icon: <DollarSign className="h-3 w-3" /> },
    { id: 'irrigation', label: 'Irrigation', icon: <Wind className="h-3 w-3" /> },
    { id: 'pest_control', label: 'Pest Control', icon: <AlertTriangle className="h-3 w-3" /> },
    { id: 'general', label: 'General', icon: <BookOpen className="h-3 w-3" /> },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-6 w-6 text-green-800" />
            <h2 className="text-2xl font-black text-slate-800">Farm Diary</h2>
          </div>
          <p className="text-slate-500 text-sm font-medium">Log your daily farming activities</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 font-bold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 rotate-180" /> Export
          </Button>
          <Button 
            onClick={() => setIsAddingLog(true)} 
            className="organic-gradient rounded-xl text-white font-bold flex items-center gap-2 px-6"
          >
            <Plus className="h-5 w-5" /> Add Entry
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-100 shadow-sm bg-white/50 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-black text-slate-800">{logs.length}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Entries</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-100 shadow-sm bg-white/50 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <p className="text-3xl font-black text-slate-800">₹{totalExpenses.toLocaleString()}</p>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Expenses</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-100 shadow-sm bg-white/50 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <p className="text-3xl font-black text-slate-800">₹{totalIncome.toLocaleString()}</p>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Income</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-100 shadow-sm bg-white/50 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <p className="text-3xl font-black text-slate-800">{totalProfit >= 0 ? '+' : ''}₹{totalProfit.toLocaleString()}</p>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Profit</p>
          </CardContent>
        </Card>
      </div>

      {/* New Entry Form */}
      <AnimatePresence>
        {isAddingLog && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <FarmerLogForm 
              onAdd={(data) => { onAdd(data); setIsAddingLog(false); }} 
              onCancel={() => setIsAddingLog(false)}
              isLoading={false} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
              <TrendingUp className="h-4 w-4 text-green-600" /> Income vs Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeVsExpenseData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(v) => [`₹${v}`, '']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                <Bar dataKey="income" fill="#166534" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
              <Activity className="h-4 w-4 text-blue-500" /> Expense Breakdown
            </CardTitle>
            <span className="text-xs font-bold text-slate-400">Total: ₹{totalExpenses.toLocaleString()}</span>
          </CardHeader>
          <CardContent className="h-64 flex flex-col items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `₹${v}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
              {expenseBreakdown.map((entry, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-[10px] font-bold text-slate-500">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & List */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
              <Calendar className="h-4 w-4 text-slate-400" />
              <Input 
                type="date" 
                value={dateFrom} 
                onChange={e => setDateFrom(e.target.value)}
                className="border-none bg-transparent h-auto p-0 text-xs font-bold focus-visible:ring-0 w-28"
                placeholder="From"
              />
              <span className="text-slate-300">→</span>
              <Input 
                type="date" 
                value={dateTo} 
                onChange={e => setDateTo(e.target.value)}
                className="border-none bg-transparent h-auto p-0 text-xs font-bold focus-visible:ring-0 w-28"
                placeholder="To"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterType(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                filterType === cat.id 
                ? 'bg-green-800 text-white shadow-md' 
                : 'bg-white text-slate-500 border border-slate-200 hover:border-green-800/30'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredLogs.map(log => (
            <div key={log.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 group hover:shadow-md transition-all">
              <div className={`p-3 rounded-xl shrink-0 ${
                log.type === 'planting' ? 'bg-green-50 text-green-600' :
                log.type === 'pest_control' ? 'bg-red-50 text-red-600' :
                log.type === 'harvesting' ? 'bg-yellow-50 text-yellow-600' :
                log.type === 'expense' ? 'bg-orange-50 text-orange-600' :
                log.type === 'irrigation' ? 'bg-blue-50 text-blue-600' :
                'bg-slate-50 text-slate-600'
              }`}>
                {log.type === 'planting' ? <Sprout className="h-6 w-6" /> :
                 log.type === 'pest_control' ? <AlertTriangle className="h-6 w-6" /> :
                 log.type === 'harvesting' ? <Scissors className="h-6 w-6" /> :
                 log.type === 'expense' ? <DollarSign className="h-6 w-6" /> :
                 log.type === 'irrigation' ? <Wind className="h-6 w-6" /> :
                 <BookOpen className="h-6 w-6" />}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 capitalize">{log.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {safeFormat(log.date, 'dd MMM yyyy')}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    {categories.find(c => c.id === log.type)?.icon}
                    {categories.find(c => c.id === log.type)?.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  {log.expense > 0 && (
                    <span className="text-xs font-black text-red-500 flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" /> ₹{log.expense.toLocaleString()}
                    </span>
                  )}
                  {log.income > 0 && (
                    <span className="text-xs font-black text-green-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> ₹{log.income.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 text-slate-300 hover:text-blue-500 transition-colors">
                  <Edit className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => onDelete(log.id)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {filteredLogs.length === 0 && (
            <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
              <BookOpen className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No entries found for the selected filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Components ---

const Navbar = ({ user, profile, onSignOut }: { user: User | null, profile: UserProfile | null, onSignOut: () => void }) => (
  <nav className="fixed top-0 z-50 flex w-full items-center justify-between px-6 py-4 glass-nav">
    <div className="flex items-center gap-8">
      <span className="brand text-2xl font-extrabold tracking-tighter text-green-800">GrowMate</span>
      <div className="hidden md:flex relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input 
          className="w-64 rounded-full border-none bg-surface-container-low py-2 pl-10 pr-4 transition-all focus:ring-2 focus:ring-primary/20" 
          placeholder="Search conservatory..." 
          type="text"
        />
      </div>
    </div>
    <div className="flex items-center gap-4">
      {user && (
        <>
          <button className="rounded-full p-2 text-green-700 transition-colors hover:bg-green-50 active:scale-95 duration-200">
            <Plus className="h-6 w-6" />
          </button>
          <div className="group relative">
            <button className="rounded-full p-2 text-green-700 transition-colors hover:bg-green-50 active:scale-95 duration-200">
              <UserIcon className="h-6 w-6" />
            </button>
            <div className="absolute right-0 mt-2 hidden w-48 rounded-xl bg-white p-2 shadow-xl group-hover:block">
              <div className="px-4 py-2 border-b mb-2">
                <p className="text-sm font-bold text-gray-900 truncate">{profile?.displayName || user.displayName || 'Farmer'}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <button 
                onClick={onSignOut}
                className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  </nav>
);

const FarmerProfile = ({ profile, onUpdate }: { profile: UserProfile | null, onUpdate: (data: Partial<UserProfile>) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        farmName: profile.farmName || '',
        location: profile.location || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    setIsEditing(false);
  };

  if (!profile) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-black text-green-900">Farmer Profile</h2>
        <Button 
          onClick={() => setIsEditing(!isEditing)} 
          variant={isEditing ? "ghost" : "outline"}
          className="rounded-full px-6"
        >
          {isEditing ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-green-900/5 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 organic-gradient opacity-10"></div>
            <div className="relative pt-4">
              <div className="w-32 h-32 rounded-full bg-primary/10 mx-auto flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                {profile.profileImageUrl ? (
                  <img src={profile.profileImageUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="h-16 w-16 text-primary" />
                )}
              </div>
              <h3 className="mt-4 text-2xl font-black text-green-900">{profile.displayName || "Anonymous Farmer"}</h3>
              <p className="text-sm font-medium text-green-800/60">{profile.email}</p>
              <div className="mt-6 flex justify-center gap-2">
                <Badge variant="outline" className="rounded-full border-primary/20 text-primary">Master Gardener</Badge>
                <Badge variant="outline" className="rounded-full border-primary/20 text-primary">Verified</Badge>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-green-900/5 space-y-4">
            <h4 className="font-black text-green-900 uppercase tracking-widest text-xs">Quick Stats</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-800/60 font-medium">Member Since</span>
                <span className="text-sm font-bold text-green-900">{profile.createdAt ? safeFormat(profile.createdAt, 'MMM yyyy') : 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-800/60 font-medium">Farm Location</span>
                <span className="text-sm font-bold text-green-900">{profile.location || 'Not set'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-green-900/5 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="font-bold">Full Name</Label>
                  <Input 
                    value={formData.displayName} 
                    onChange={e => setFormData({...formData, displayName: e.target.value})}
                    placeholder="Your Name"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Farm Name</Label>
                  <Input 
                    value={formData.farmName} 
                    onChange={e => setFormData({...formData, farmName: e.target.value})}
                    placeholder="Green Valley Farm"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Location</Label>
                  <Input 
                    value={formData.location} 
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    placeholder="City, Country"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Phone Number</Label>
                  <Input 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="+1 234 567 890"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Bio / Farm Description</Label>
                <Textarea 
                  value={formData.bio} 
                  onChange={e => setFormData({...formData, bio: e.target.value})}
                  placeholder="Tell us about your botanical journey..."
                  className="rounded-xl min-h-[120px]"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="rounded-xl font-bold">Cancel</Button>
                <Button type="submit" className="organic-gradient text-white font-bold rounded-xl px-10 shadow-lg">Save Changes</Button>
              </div>
            </form>
          ) : (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-green-900/5 space-y-8">
              <div className="space-y-4">
                <h4 className="font-black text-green-900 uppercase tracking-widest text-xs">About the Farm</h4>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Farm Name</p>
                    <p className="font-bold text-slate-800">{profile.farmName || "Unnamed Farm"}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Contact</p>
                    <p className="font-bold text-slate-800">{profile.phone || "No phone added"}</p>
                  </div>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Biography</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{profile.bio || "No biography added yet. Share your story!"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-black text-green-900 uppercase tracking-widest text-xs">Account Settings</h4>
                <div className="flex items-center justify-between p-6 bg-surface rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Push Notifications</p>
                      <p className="text-xs text-slate-500">Get alerts for watering and fertilizing</p>
                    </div>
                  </div>
                  <Switch 
                    checked={"Notification" in window && Notification.permission === "granted"}
                    onCheckedChange={() => {
                      if ("Notification" in window) {
                        Notification.requestPermission().then(permission => {
                          if (permission === "granted") {
                            toast.success("Notifications enabled!");
                          } else {
                            toast.error("Notifications were denied.");
                          }
                        });
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ activeTab, onTabChange, onAskAI }: { activeTab: string, onTabChange: (tab: string) => void, onAskAI?: () => void }) => (
  <aside className="sticky top-24 hidden h-[calc(100vh-8rem)] w-64 flex-col rounded-r-xl bg-surface-container-low py-8 shadow-2xl shadow-green-900/5 md:flex">
    <div className="mb-8 px-8">
      <h3 className="text-xl font-black tracking-tight text-green-800">GrowMate</h3>
      <p className="text-sm text-green-800/60">Premium Gardener</p>
    </div>
    <nav className="flex-1 space-y-2">
      <button 
        onClick={() => onTabChange('conservatory')}
        className={`flex w-[calc(100%-2rem)] items-center gap-4 mx-4 px-8 py-3 rounded-full transition-transform hover:translate-x-1 ${
          activeTab === 'conservatory' ? 'organic-gradient text-white shadow-lg shadow-primary/20' : 'text-green-800/60'
        }`}
      >
        <LayoutDashboard className="h-5 w-5" />
        <span className="font-medium">Conservatory</span>
      </button>
      <button 
        onClick={() => onTabChange('growth')}
        className={`flex w-[calc(100%-2rem)] items-center gap-4 mx-4 px-8 py-3 rounded-full transition-transform hover:translate-x-1 ${
          activeTab === 'growth' ? 'organic-gradient text-white shadow-lg shadow-primary/20' : 'text-green-800/60'
        }`}
      >
        <TrendingUp className="h-5 w-5" />
        <span className="font-medium">Growth</span>
      </button>
      <button 
        onClick={() => onTabChange('schedule')}
        className={`flex w-[calc(100%-2rem)] items-center gap-4 mx-4 px-8 py-3 rounded-full transition-transform hover:translate-x-1 ${
          activeTab === 'schedule' ? 'organic-gradient text-white shadow-lg shadow-primary/20' : 'text-green-800/60'
        }`}
      >
        <Calendar className="h-5 w-5" />
        <span className="font-medium">Schedule</span>
      </button>
      <button 
        onClick={() => onTabChange('planner')}
        className={`flex w-[calc(100%-2rem)] items-center gap-4 mx-4 px-8 py-3 rounded-full transition-transform hover:translate-x-1 ${
          activeTab === 'planner' ? 'organic-gradient text-white shadow-lg shadow-primary/20' : 'text-green-800/60'
        }`}
      >
        <Brain className="h-5 w-5" />
        <span className="font-medium">Farm Planner</span>
      </button>
      <button 
        onClick={() => onTabChange('diary')}
        className={`flex w-[calc(100%-2rem)] items-center gap-4 mx-4 px-8 py-3 rounded-full transition-transform hover:translate-x-1 ${
          activeTab === 'diary' ? 'organic-gradient text-white shadow-lg shadow-primary/20' : 'text-green-800/60'
        }`}
      >
        <BookOpen className="h-5 w-5" />
        <span className="font-medium">Farmer Diary</span>
      </button>
      <button 
        onClick={() => onTabChange('profile')}
        className={`flex w-[calc(100%-2rem)] items-center gap-4 mx-4 px-8 py-3 rounded-full transition-transform hover:translate-x-1 ${
          activeTab === 'profile' ? 'organic-gradient text-white shadow-lg shadow-primary/20' : 'text-green-800/60'
        }`}
      >
        <UserIcon className="h-5 w-5" />
        <span className="font-medium">Profile</span>
      </button>
    </nav>
    <div className="px-6 mt-auto">
      <button 
        onClick={onAskAI}
        className="organic-gradient w-full py-4 rounded-full font-bold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl"
      >
        Ask AI Expert
      </button>
    </div>
  </aside>
);

const PlantForm = ({ onAdd, isLoading }: { onAdd: (data: any) => void, isLoading: boolean }) => {
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    isIndoor: true,
    plantationDate: format(new Date(), 'yyyy-MM-dd'),
    location: '',
    potSize: '',
    imageUrl: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100 space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-green-900 font-bold flex items-center gap-2">
              <Leaf className="h-4 w-4 text-green-600" />
              Plant Name
            </Label>
            <Input 
              id="name" 
              placeholder="e.g. Lily, Spike" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
              className="bg-white border-green-200 focus:border-green-500 focus:ring-green-500 rounded-xl h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="species" className="text-green-900 font-bold flex items-center gap-2">
              <Search className="h-4 w-4 text-green-600" />
              Species / Type
            </Label>
            <Input 
              id="species" 
              placeholder="e.g. Monstera Deliciosa" 
              value={formData.species} 
              onChange={e => setFormData({...formData, species: e.target.value})}
              required
              className="bg-white border-green-200 focus:border-green-500 focus:ring-green-500 rounded-xl h-12"
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="location" className="text-green-900 font-bold flex items-center gap-2">
              <Home className="h-4 w-4 text-green-600" />
              Location
            </Label>
            <Input 
              id="location" 
              placeholder="e.g. Balcony, Living Room" 
              value={formData.location} 
              onChange={e => setFormData({...formData, location: e.target.value})}
              required
              className="bg-white border-green-200 focus:border-green-500 focus:ring-green-500 rounded-xl h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plantationDate" className="text-green-900 font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600" />
              Plantation Date
            </Label>
            <Input 
              id="plantationDate" 
              type="date" 
              value={formData.plantationDate} 
              onChange={e => setFormData({...formData, plantationDate: e.target.value})}
              required
              className="bg-white border-green-200 focus:border-green-500 focus:ring-green-500 rounded-xl h-12"
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="isIndoor" className="text-green-900 font-bold flex items-center gap-2">
              <Sun className="h-4 w-4 text-green-600" />
              Environment
            </Label>
            <Select 
              value={formData.isIndoor ? "indoor" : "outdoor"} 
              onValueChange={val => setFormData({...formData, isIndoor: val === "indoor"})}
            >
              <SelectTrigger className="bg-white border-green-200 focus:border-green-500 focus:ring-green-500 rounded-xl h-12">
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="indoor">Indoor</SelectItem>
                <SelectItem value="outdoor">Outdoor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="potSize" className="text-green-900 font-bold flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-green-600" />
              Pot Size (Optional)
            </Label>
            <Input 
              id="potSize" 
              placeholder="e.g. 12 inch, Large" 
              value={formData.potSize} 
              onChange={e => setFormData({...formData, potSize: e.target.value})}
              className="bg-white border-green-200 focus:border-green-500 focus:ring-green-500 rounded-xl h-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl" className="text-green-900 font-bold flex items-center gap-2">
            <Camera className="h-4 w-4 text-green-600" />
            Photo URL (Optional)
          </Label>
          <Input 
            id="imageUrl" 
            placeholder="https://..." 
            value={formData.imageUrl} 
            onChange={e => setFormData({...formData, imageUrl: e.target.value})}
            className="bg-white border-green-200 focus:border-green-500 focus:ring-green-500 rounded-xl h-12"
          />
        </div>
      </div>

      <Button type="submit" className="w-full organic-gradient h-14 rounded-2xl text-white font-black text-lg shadow-xl shadow-green-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all" disabled={isLoading}>
        {isLoading ? (
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Generating AI Profile...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Onboard New Specimen
          </div>
        )}
      </Button>
    </form>
  );
};

const GrowthChart = ({ plant, events }: { plant: Plant, events: PlantEvent[] }) => {
  const plantationDate = new Date(plant.plantationDate);
  const data = [];
  const now = new Date();
  
  // Generate data points from plantation date to now
  let currentDate = new Date(plantationDate);
  let growthValue = 10; // Starting growth value
  let healthValue = 90; // Starting health value
  
  while (currentDate <= now) {
    const dateStr = format(currentDate, 'MMM dd');
    
    // Find events on this day to boost growth and health
    const dayEvents = events.filter(e => 
      e.status === 'completed' && 
      format(new Date(e.date), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
    );

    const healthIssues = events.filter(e => 
      e.type === 'health_issue' && 
      format(new Date(e.date), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
    );
    
    growthValue += dayEvents.length * 2 + 0.5; // Natural growth + event boost
    
    // Health logic: drops on issues, recovers slowly, boosted by care
    if (healthIssues.length > 0) {
      healthValue -= 20 * healthIssues.length;
    } else {
      healthValue += dayEvents.length * 5 + 1; // Care boost + natural recovery
    }
    
    healthValue = Math.min(100, Math.max(0, healthValue));
    
    data.push({
      date: dateStr,
      growth: Math.round(growthValue),
      health: Math.round(healthValue)
    });
    
    currentDate = addDays(currentDate, 7); // Weekly data points
  }

  // Ensure at least some data if plant is new
  if (data.length < 2) {
    data.push({ date: format(now, 'MMM dd'), growth: 12, health: 90 });
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#166534" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#166534" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#888' }}
            minTickGap={30}
          />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            labelStyle={{ fontWeight: 'bold', color: '#166534' }}
          />
          <Area 
            type="monotone" 
            dataKey="growth" 
            name="Growth Velocity"
            stroke="#166534" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorGrowth)" 
          />
          <Area 
            type="monotone" 
            dataKey="health" 
            name="Health Index"
            stroke="#ef4444" 
            strokeWidth={2}
            strokeDasharray="5 5"
            fillOpacity={1} 
            fill="url(#colorHealth)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const PlantDashboard = ({ plant, events, onUpdateEvent, onAddEvent, setIsChatOpen }: { 
  plant: Plant, 
  events: PlantEvent[], 
  onUpdateEvent: (eventId: string, status: string) => void,
  onAddEvent: (type: string, notes: string, date?: string) => void,
  setIsChatOpen: (open: boolean) => void
}) => {
  const [issueInput, setIssueInput] = useState("");
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isAddingUpdate, setIsAddingUpdate] = useState(false);
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isTipsOpen, setIsTipsOpen] = useState(true);
  const [isEditingFertilizer, setIsEditingFertilizer] = useState(false);
  const [fertForm, setFertForm] = useState({
    fertilizerType: '',
    springSummer: '',
    monsoon: '',
    winter: '',
    quantityGuidance: ''
  });

  const openFertilizerDialog = () => {
    setFertForm({
      fertilizerType: plant.fertilizerSchedule?.fertilizerType || '',
      springSummer: plant.fertilizerSchedule?.seasonalSchedule?.springSummer || '',
      monsoon: plant.fertilizerSchedule?.seasonalSchedule?.monsoon || '',
      winter: plant.fertilizerSchedule?.seasonalSchedule?.winter || '',
      quantityGuidance: plant.fertilizerSchedule?.quantityGuidance || ''
    });
    setIsEditingFertilizer(true);
  };

  const handleUpdateFertilizer = async () => {
    try {
      await updateDoc(doc(db, 'plants', plant.id), {
        fertilizerSchedule: {
          fertilizerType: fertForm.fertilizerType,
          seasonalSchedule: {
            springSummer: fertForm.springSummer,
            monsoon: fertForm.monsoon,
            winter: fertForm.winter
          },
          quantityGuidance: fertForm.quantityGuidance
        }
      });
      setIsEditingFertilizer(false);
      toast.success("Fertilizer schedule updated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update fertilizer schedule.");
    }
  };
  const [updateType, setUpdateType] = useState<string>("watering");

  const handleRefreshProfile = async () => {
    setIsRefreshingProfile(true);
    try {
      const aiProfile = await generatePlantProfile(plant);
      await updateDoc(doc(db, 'plants', plant.id), {
        ...aiProfile
      });
      toast.success("AI Profile refreshed successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to refresh AI profile.");
    } finally {
      setIsRefreshingProfile(false);
    }
  };
  const [updateNotes, setUpdateNotes] = useState("");
  const [updateDate, setUpdateDate] = useState(new Date().toISOString().split('T')[0]);

  const plantationDate = plant.plantationDate ? new Date(plant.plantationDate) : new Date();
  const isValidDate = !isNaN(plantationDate.getTime());
  const ageInDays = isValidDate ? differenceInDays(new Date(), plantationDate) : 0;
  const ageDisplay = ageInDays < 30 ? `${ageInDays} days old` : `${Math.floor(ageInDays / 30)} months old`;

  const handleDiagnose = async () => {
    if (!issueInput.trim()) return;
    setIsDiagnosing(true);
    try {
      const result = await diagnosePlantIssue(plant, issueInput);
      await onAddEvent('health_issue', `Issue: ${issueInput}\n\nDiagnosis: ${result.diagnosis}\n\nSolution: ${result.solution}`);
      setIssueInput("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleAddUpdate = async () => {
    await onAddEvent(updateType, updateNotes, new Date(updateDate).toISOString());
    setIsAddingUpdate(false);
    setUpdateNotes("");
  };

  const upcomingEvents = events
    .filter(e => e.status === 'pending')
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB);
    });

  const historyEvents = events
    .filter(e => e.status !== 'pending')
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
    });

  const milestones = events.filter(e => e.type === 'milestone' || e.type === 'health_issue').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const currentHealth = calculateHealth(events);
  const healthStatus = getHealthStatus(currentHealth);

  const healthTrend = (() => {
    if (events.length < 2) return 'stable';
    const recent = events.slice(0, 5);
    const issues = recent.filter(e => e.type === 'health_issue').length;
    const care = recent.filter(e => e.status === 'completed').length;
    if (issues > 0) return 'down';
    if (care > 2) return 'up';
    return 'stable';
  })();

  return (
    <div className="flex-1 space-y-10">
      {/* Header Section: Plant Overview */}
      <section className="bg-surface-container-lowest rounded-xl p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        {!plant.careRequirements && (
          <div className="absolute top-0 left-0 w-full bg-amber-500/10 border-b border-amber-500/20 py-2 px-4 flex items-center justify-center gap-2 z-10">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">AI Profile missing. Click "Refresh AI Profile" to generate.</span>
          </div>
        )}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="relative">
          <div className="w-48 h-48 rounded-full overflow-hidden ring-8 ring-surface-container p-1 bg-white">
            <img 
              alt={plant.name} 
              className="w-full h-full object-cover rounded-full" 
              src={plant.imageUrl || `https://picsum.photos/seed/${plant.species}/400/400`}
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute bottom-2 right-2 bg-primary text-white p-2 rounded-full shadow-lg">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface">{plant.name}</h1>
              <h2 className="text-lg text-on-surface-variant font-medium">{plant.species}</h2>
            </div>
            <div className="flex flex-col items-center md:items-end gap-1">
              <div className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Vitality Score</div>
              <div className="flex items-center gap-3">
                <div className="text-4xl font-black text-green-800">{currentHealth}%</div>
                <div className="w-32 h-3 bg-surface-container rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${currentHealth}%` }}
                    className={`h-full ${currentHealth > 70 ? 'bg-green-500' : currentHealth > 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <span className="px-4 py-1.5 bg-surface-container rounded-full text-xs font-bold text-primary uppercase tracking-wider">{ageDisplay}</span>
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              currentHealth > 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              Condition: {currentHealth > 70 ? "Optimal" : currentHealth > 40 ? "Needs Attention" : "Critical"}
            </span>
            {healthTrend !== 'stable' && (
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                healthTrend === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {healthTrend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {healthTrend === 'up' ? 'Improving' : 'Declining'}
              </span>
            )}
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
            <Button variant="outline" className="px-6 py-2.5 rounded-full font-bold">Edit Plant</Button>
            <Button 
              variant="outline" 
              onClick={handleRefreshProfile}
              disabled={isRefreshingProfile}
              className="px-6 py-2.5 rounded-full font-bold flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5"
            >
              {isRefreshingProfile ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Refresh AI Profile
            </Button>
            <Dialog open={isAddingUpdate} onOpenChange={setIsAddingUpdate}>
              <DialogTrigger render={
                <Button className="organic-gradient px-6 py-2.5 text-white font-bold rounded-full shadow-md">Add Update</Button>
              } />
              <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                <div className="organic-gradient p-6 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Log Care Event</DialogTitle>
                    <p className="text-green-50/80 text-sm mt-1">Record a manual care activity for this specimen.</p>
                  </DialogHeader>
                </div>
                <div className="p-6 bg-white space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Event Type</Label>
                    <Select value={updateType} onValueChange={setUpdateType}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="watering">Watering</SelectItem>
                        <SelectItem value="fertilizing">Fertilizing</SelectItem>
                        <SelectItem value="repotting">Repotting</SelectItem>
                        <SelectItem value="pruning">Pruning</SelectItem>
                        <SelectItem value="milestone">Milestone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Date of Event</Label>
                    <Input 
                      type="date" 
                      value={updateDate} 
                      onChange={e => setUpdateDate(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Notes (Optional)</Label>
                    <Textarea 
                      placeholder="Add any specific details..." 
                      value={updateNotes}
                      onChange={e => setUpdateNotes(e.target.value)}
                      className="rounded-xl min-h-[80px]"
                    />
                  </div>
                  <Button onClick={handleAddUpdate} className="w-full organic-gradient h-12 rounded-xl text-white font-bold shadow-lg">
                    Save Event
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Health Snapshot Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-between border-l-8 border-green-500 shadow-xl shadow-green-900/5">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-black text-on-surface">Vitality Snapshot</h3>
              <p className="text-sm text-on-surface-variant">Real-time health monitoring based on care events</p>
            </div>
            <div className={`p-3 rounded-2xl ${currentHealth > 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <Activity className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-8 flex items-end gap-6">
            <div className="text-6xl font-black text-green-900">{currentHealth}%</div>
            <div className="flex flex-col pb-2">
              <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Health Trend</div>
              {healthTrend === 'up' ? (
                <div className="flex items-center text-green-600 font-bold">
                  <TrendingUp className="h-5 w-5 mr-1" /> Improving
                </div>
              ) : healthTrend === 'down' ? (
                <div className="flex items-center text-red-600 font-bold">
                  <TrendingDown className="h-5 w-5 mr-1" /> Declining
                </div>
              ) : (
                <div className="flex items-center text-slate-400 font-bold">
                  Stable
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${currentHealth}%` }}
                className={`h-full transition-all duration-1000 ${currentHealth > 70 ? 'bg-green-500' : currentHealth > 40 ? 'bg-amber-500' : 'bg-red-500'}`}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              <span>Critical</span>
              <span>Optimal</span>
            </div>
          </div>
        </div>
        
        <div className="bg-primary-container/20 p-8 rounded-xl flex flex-col justify-center items-center text-center space-y-4 border-2 border-primary/10">
          <div className="w-16 h-16 rounded-full organic-gradient flex items-center justify-center text-white shadow-lg">
            <Sparkles className="h-8 w-8" />
          </div>
          <h4 className="font-black text-primary">AI Health Grade</h4>
          <div className="text-5xl font-black text-primary">
            {currentHealth > 90 ? 'A+' : currentHealth > 80 ? 'A' : currentHealth > 70 ? 'B+' : currentHealth > 60 ? 'B' : currentHealth > 50 ? 'C' : 'D'}
          </div>
          <p className="text-xs text-on-primary-container font-medium px-4">
            {currentHealth > 70 
              ? "Your specimen is thriving! Keep up the current care routine." 
              : "Some attention required. Check the care scheduler for pending tasks."}
          </p>
        </div>
      </div>

      {/* Vitality & Growth Chart */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-green-900/5">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-black text-green-900">Vitality & Growth</h3>
            <p className="text-sm text-green-800/60 font-medium">Health index development since plantation</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary"></div>
              <span className="text-xs font-bold text-green-900">Health Index</span>
            </div>
          </div>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={calculateHealthHistory(events, plant.plantationDate)}>
              <defs>
                <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#166534" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#166534" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#888' }}
                minTickGap={30}
              />
              <YAxis 
                domain={[0, 100]} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#888' }} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#166534' }}
              />
              <Area 
                type="monotone" 
                dataKey="health" 
                stroke="#166534" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorHealth)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Bento Grid: Care Requirements & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Care Requirements */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant/30 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <Droplets className="h-5 w-5 text-blue-500" />
              <h4 className="font-bold text-sm">Watering</h4>
            </div>
            <p className="text-xs text-on-surface-variant font-medium">{formatCareValue(plant.careRequirements?.wateringFrequency)}</p>
          </div>
          
          <div className="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant/30 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <Sun className="h-5 w-5 text-orange-400" />
              <h4 className="font-bold text-sm">Sunlight</h4>
            </div>
            <p className="text-xs text-on-surface-variant font-medium">{formatCareValue(plant.careRequirements?.sunlightRequirement)}</p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant/30 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <Thermometer className="h-5 w-5 text-red-400" />
              <h4 className="font-bold text-sm">Temperature</h4>
            </div>
            <p className="text-xs text-on-surface-variant font-medium">{formatCareValue(plant.careRequirements?.idealTemperatureRange)}</p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant/30 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <CloudRain className="h-5 w-5 text-cyan-400" />
              <h4 className="font-bold text-sm">Humidity</h4>
            </div>
            <p className="text-xs text-on-surface-variant font-medium">{formatCareValue(plant.careRequirements?.humidityRequirement)}</p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant/30 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <Sprout className="h-5 w-5 text-green-600" />
              <h4 className="font-bold text-sm">Soil Type</h4>
            </div>
            <p className="text-xs text-on-surface-variant font-medium">{formatCareValue(plant.careRequirements?.soilType)}</p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant/30 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="h-5 w-5 text-purple-400" />
              <h4 className="font-bold text-sm">Repotting</h4>
            </div>
            <p className="text-xs text-on-surface-variant font-medium">{formatCareValue(plant.careRequirements?.repottingFrequency)}</p>
          </div>
        </div>

        {/* AI Insights */}
        <section className="bg-primary-container/20 rounded-xl p-8 relative overflow-hidden flex flex-col">
          <Brain className="h-10 w-10 text-primary mb-4" />
          <h3 className="text-xl font-bold text-primary mb-4">Future Predictions</h3>
          <div className="space-y-4 flex-1">
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm text-on-primary-container">{(plant as any).futurePredictions?.growthExpectations || "AI is calculating growth patterns..."}</p>
            </div>
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-sm text-on-primary-container">{(plant as any).futurePredictions?.riskAlerts || "No immediate risks detected."}</p>
            </div>
            <div className="flex gap-3">
              <Lightbulb className="h-5 w-5 text-amber-500 shrink-0" />
              <div className="space-y-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Smart Care Tip</p>
                <p className="text-sm text-on-primary-container">{(plant as any).futurePredictions?.seasonalTips || "AI is preparing seasonal care tips..."}</p>
              </div>
            </div>
          </div>
          <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
            <DialogTrigger render={
              <button className="mt-6 text-primary font-bold text-sm flex items-center gap-2 hover:translate-x-1 transition-transform">
                View Detail Report <ArrowRight className="h-4 w-4" />
              </button>
            } />
            <DialogContent className="max-w-3xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
              <div className="organic-gradient p-8 text-white relative">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-black flex items-center gap-3">
                    <Brain className="h-8 w-8" />
                    AI Botanical Report
                  </DialogTitle>
                  <p className="text-green-50/80 font-medium mt-2">Comprehensive lifetime analysis and future roadmap for {plant.name}.</p>
                </DialogHeader>
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Leaf className="h-32 w-32 rotate-12" />
                </div>
              </div>
              
              <div className="p-8 bg-white max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Lifespan & Health */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs">
                      <Activity className="h-4 w-4" />
                      Vitality Overview
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl space-y-3">
                      <div>
                        <Label className="text-[10px] font-black text-slate-400 uppercase">Expected Lifespan</Label>
                        <p className="font-bold text-slate-800">{plant.expectedLifespan || "Calculating..."}</p>
                      </div>
                      <div>
                        <Label className="text-[10px] font-black text-slate-400 uppercase">Current AI Status</Label>
                        <p className="font-bold text-slate-800">{plant.healthStatus || "Analyzing..."}</p>
                      </div>
                    </div>
                  </div>

                  {/* Growth Predictions */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs">
                      <TrendingUp className="h-4 w-4" />
                      Growth Expectations
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl">
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {plant.futurePredictions?.growthExpectations || "AI is modeling growth patterns based on current care and environment."}
                      </p>
                    </div>
                  </div>

                  {/* Seasonal Roadmap */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs">
                      <Calendar className="h-4 w-4" />
                      Seasonal Care Roadmap
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100">
                        <h5 className="font-black text-green-800 text-[10px] uppercase mb-2">Spring & Summer</h5>
                        <p className="text-xs text-slate-600 leading-relaxed">{plant.fertilizerSchedule?.seasonalSchedule?.springSummer || "Standard growth care."}</p>
                      </div>
                      <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                        <h5 className="font-black text-blue-800 text-[10px] uppercase mb-2">Monsoon</h5>
                        <p className="text-xs text-slate-600 leading-relaxed">{plant.fertilizerSchedule?.seasonalSchedule?.monsoon || "Humidity management."}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <h5 className="font-black text-slate-800 text-[10px] uppercase mb-2">Winter</h5>
                        <p className="text-xs text-slate-600 leading-relaxed">{plant.fertilizerSchedule?.seasonalSchedule?.winter || "Dormancy care."}</p>
                      </div>
                    </div>
                  </div>

                  {/* Future Milestones */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs">
                      <History className="h-4 w-4" />
                      Future Milestones
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl space-y-4">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Next Repotting</p>
                          <p className="text-sm font-bold text-slate-800">{plant.futurePredictions?.nextRepotting || "TBD"}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                          <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Seasonal Tip</p>
                          <p className="text-sm font-bold text-slate-800">{plant.futurePredictions?.seasonalTips || "Keep environment stable."}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Risk Analysis */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-red-600 font-black uppercase tracking-widest text-xs">
                      <AlertTriangle className="h-4 w-4" />
                      Risk Analysis
                    </div>
                    <div className="bg-red-50/50 p-5 rounded-2xl border border-red-100">
                      <p className="text-sm text-red-800 leading-relaxed font-medium">
                        {plant.futurePredictions?.riskAlerts || "No immediate risks detected. Continue current care routine."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
                      <Lightbulb className="h-5 w-5" />
                    </div>
                    <h4 className="font-black text-slate-800">Expert Guidance</h4>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed italic">
                    "This report is generated using advanced botanical modeling. For the best results, ensure your manual logs (watering, fertilizing) are kept up to date, as the AI uses this history to refine its predictions."
                  </p>
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 flex justify-end">
                <Button onClick={() => setIsReportOpen(false)} className="organic-gradient text-white font-bold rounded-full px-8">
                  Close Report
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </section>
      </div>

      {/* Smart Care Tips Section */}
      {plant.smartCareTips && plant.smartCareTips.length > 0 && (
        <section className="bg-white rounded-3xl p-8 shadow-xl shadow-green-900/5 border border-green-100 overflow-hidden">
          <button 
            onClick={() => setIsTipsOpen(!isTipsOpen)}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Lightbulb className="h-7 w-7" />
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-black text-green-900">Smart Care Tips</h3>
                <p className="text-sm text-green-800/60 font-medium">Expert botanical guidance for your {plant.species}</p>
              </div>
            </div>
            <div className={`w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center transition-transform duration-300 ${isTipsOpen ? 'rotate-180' : ''}`}>
              <ChevronDown className="h-5 w-5 text-slate-400" />
            </div>
          </button>
          
          <AnimatePresence>
            {isTipsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  {plant.smartCareTips.map((tip, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex gap-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:border-primary/30 transition-all hover:shadow-md"
                    >
                      <div className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center font-black text-sm shrink-0 shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                        {idx + 1}
                      </div>
                      <p className="text-sm text-slate-700 font-medium leading-relaxed">{tip}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* Growth & Health Visualization */}
      <section className="bg-surface-container-lowest rounded-xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold">Vitality & Growth</h3>
            <p className="text-sm text-on-surface-variant">Visualizing development and health index since plantation</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-green-800 bg-green-100 px-3 py-1 rounded-full">
            <TrendingUp className="h-3 w-3" />
            +12% this month
          </div>
        </div>
        <GrowthChart plant={plant} events={events} />
      </section>

      {/* Fertilizer Timeline */}
      <section className="bg-surface-container-lowest rounded-xl p-8 overflow-x-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold">Fertilizer Timeline</h3>
            <Dialog open={isEditingFertilizer} onOpenChange={setIsEditingFertilizer}>
              <DialogTrigger render={
                <Button variant="ghost" size="icon" onClick={openFertilizerDialog} className="h-8 w-8 rounded-full text-primary hover:bg-primary/10">
                  <Edit className="h-4 w-4" />
                </Button>
              } />
              <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                <div className="organic-gradient p-6 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Edit Fertilizer Schedule</DialogTitle>
                    <p className="text-green-50/80 text-sm mt-1">Customize the fertilizer routine for this plant.</p>
                  </DialogHeader>
                </div>
                <div className="p-6 bg-white space-y-4 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-2">
                    <Label className="font-bold">Fertilizer Type</Label>
                    <Input 
                      placeholder="e.g. NPK 19-19-19, Organic Compost" 
                      value={fertForm.fertilizerType} 
                      onChange={e => setFertForm({...fertForm, fertilizerType: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Spring & Summer Schedule</Label>
                    <Textarea 
                      placeholder="e.g. Every 15 days during active growth" 
                      value={fertForm.springSummer} 
                      onChange={e => setFertForm({...fertForm, springSummer: e.target.value})}
                      className="rounded-xl min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Monsoon Schedule</Label>
                    <Textarea 
                      placeholder="e.g. Reduce frequency, avoid waterlogging" 
                      value={fertForm.monsoon} 
                      onChange={e => setFertForm({...fertForm, monsoon: e.target.value})}
                      className="rounded-xl min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Winter Schedule</Label>
                    <Textarea 
                      placeholder="e.g. Once a month or stop during dormancy" 
                      value={fertForm.winter} 
                      onChange={e => setFertForm({...fertForm, winter: e.target.value})}
                      className="rounded-xl min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Quantity Guidance</Label>
                    <Input 
                      placeholder="e.g. 5g per liter of water" 
                      value={fertForm.quantityGuidance} 
                      onChange={e => setFertForm({...fertForm, quantityGuidance: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="p-6 bg-slate-50 flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setIsEditingFertilizer(false)} className="rounded-xl font-bold">Cancel</Button>
                  <Button onClick={handleUpdateFertilizer} className="organic-gradient text-white font-bold rounded-xl px-8 shadow-lg">Save Schedule</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-surface-container rounded-full"><ChevronLeft className="h-5 w-5" /></button>
            <button className="p-2 hover:bg-surface-container rounded-full"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </div>
        <div className="flex gap-6 min-w-max pb-4">
          {/* Seasonal Events */}
          <div className="w-64 bg-surface-container-low p-6 rounded-lg border-l-4 border-green-500">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded uppercase">Spring/Summer</span>
              <span className="text-xs text-on-surface-variant font-medium">Active</span>
            </div>
            <h4 className="font-bold mb-2">{plant.fertilizerSchedule?.fertilizerType || "Not specified"}</h4>
            <p className="text-xs text-on-surface-variant">{plant.fertilizerSchedule?.seasonalSchedule?.springSummer || "No specific instructions."}</p>
          </div>
          <div className="w-64 bg-surface-container-low p-6 rounded-lg border-l-4 border-blue-500">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded uppercase">Monsoon</span>
              <span className="text-xs text-on-surface-variant font-medium">Rainy</span>
            </div>
            <h4 className="font-bold mb-2">{plant.fertilizerSchedule?.fertilizerType || "Not specified"}</h4>
            <p className="text-xs text-on-surface-variant">{plant.fertilizerSchedule?.seasonalSchedule?.monsoon || "No specific instructions."}</p>
          </div>
          <div className="w-64 bg-surface-container-low p-6 rounded-lg border-l-4 border-amber-500">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded uppercase">Winter</span>
              <span className="text-xs text-on-surface-variant font-medium">Dormant</span>
            </div>
            <h4 className="font-bold mb-2">{plant.fertilizerSchedule?.fertilizerType || "Not specified"}</h4>
            <p className="text-xs text-on-surface-variant">{plant.fertilizerSchedule?.seasonalSchedule?.winter || "No specific instructions."}</p>
          </div>
          <div className="w-64 bg-surface-container p-6 rounded-lg border-l-4 border-slate-300">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded uppercase">Guidance</span>
            </div>
            <h4 className="font-bold mb-2">Quantity</h4>
            <p className="text-xs text-slate-500">{plant.fertilizerSchedule?.quantityGuidance || "No specific guidance."}</p>
          </div>
        </div>
      </section>

      {/* Layout Mix: Scheduler & Health Log */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Smart Care Scheduler */}
        <section className="bg-surface-container-lowest rounded-xl p-8">
          <h3 className="text-xl font-bold mb-6">Smart Care Tasks</h3>
          <div className="space-y-4">
            {upcomingEvents.slice(0, 3).map(event => (
              <div key={event.id} className="flex items-center justify-between p-4 bg-surface rounded-lg">
                <div className="flex items-center gap-4">
                  {event.type === 'watering' ? <Droplets className="h-6 w-6 text-primary" /> :
                   event.type === 'fertilizing' ? <Sprout className="h-6 w-6 text-primary" /> :
                   <Scissors className="h-6 w-6 text-primary" />}
                  <div>
                    <h4 className="font-bold text-sm capitalize">{event.type}</h4>
                    <p className="text-xs text-on-surface-variant">Due {safeFormat(event.date, 'MMM dd')}</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  className="w-6 h-6 rounded-full border-2 border-primary text-primary focus:ring-primary cursor-pointer"
                  onChange={() => onUpdateEvent(event.id, 'completed')}
                />
              </div>
            ))}
            {upcomingEvents.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No pending tasks</p>
              </div>
            )}
          </div>
        </section>

        {/* Health & Issue Tracker */}
        <section className="bg-surface-container-lowest rounded-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Health History</h3>
            <Dialog>
              <DialogTrigger render={
                <button className="text-sm font-bold text-error flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Report Issue
                </button>
              } />
              <DialogContent className="rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                <div className="bg-red-600 p-8 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black flex items-center gap-3">
                      <AlertTriangle className="h-6 w-6" />
                      Report Health Issue
                    </DialogTitle>
                    <p className="text-red-100 mt-2">Describe any symptoms or changes you've noticed in your specimen.</p>
                  </DialogHeader>
                </div>
                <div className="p-8 bg-white space-y-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Detailed Observations</Label>
                    <Textarea 
                      placeholder="Describe the issue (e.g. yellow leaves, brown spots, wilting)..." 
                      value={issueInput}
                      onChange={e => setIssueInput(e.target.value)}
                      className="min-h-[120px] rounded-2xl border-slate-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                  <Button onClick={handleDiagnose} disabled={isDiagnosing} className="w-full bg-red-600 hover:bg-red-700 h-14 rounded-2xl text-white font-black text-lg shadow-xl shadow-red-900/20">
                    {isDiagnosing ? (
                      <div className="flex items-center gap-3">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Diagnosing...
                      </div>
                    ) : "Diagnose & Log Incident"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-4">
            {historyEvents.filter(e => e.type === 'health_issue').slice(0, 3).map(issue => (
              <div key={issue.id} className="flex gap-4 p-4 bg-red-50/50 rounded-xl border border-red-100">
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] font-black text-red-800 uppercase tracking-widest">Health Incident</p>
                    <span className="text-[10px] text-red-800/60">•</span>
                    <p className="text-[10px] font-bold text-red-800/60 uppercase tracking-widest">
                      {!isNaN(new Date(issue.date).getTime()) ? format(new Date(issue.date), 'MMM dd, yyyy') : 'Invalid date'}
                    </p>
                  </div>
                  <h4 className="font-bold text-sm mb-1 line-clamp-1">{issue.notes?.split('\n')[0]}</h4>
                  <p className="text-xs text-red-900/70 line-clamp-2">{issue.notes}</p>
                </div>
              </div>
            ))}
            {historyEvents.filter(e => e.type === 'health_issue').length === 0 && (
              <div className="flex gap-4 p-6 bg-green-50/50 rounded-xl border border-green-100">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-green-800 uppercase tracking-widest mb-1">Current Status</p>
                  <h4 className="font-bold text-lg mb-1">Health Check: Optimal</h4>
                  <p className="text-sm text-green-900/70">No health issues recorded. Your specimen is maintaining perfect vitality and growth velocity.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Growth Timeline (Asymmetrical) */}
      <section className="py-8">
        <h3 className="text-2xl font-extrabold mb-12 text-center">Life Story</h3>
        <div className="relative max-w-2xl mx-auto">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1.5 bg-primary-container/20 rounded-full"></div>
          <div className="space-y-24">
            {historyEvents.map((event, idx) => (
              <div key={event.id} className={`relative flex ${idx % 2 === 0 ? 'justify-end pr-12 md:pr-0 md:w-1/2 md:mr-auto' : 'justify-start pl-12 md:pl-0 md:w-1/2 md:ml-auto'}`}>
                <div className="bg-surface-container-lowest p-6 rounded-lg shadow-xl shadow-green-900/5 relative w-full">
                  <div className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-primary rounded-full border-4 border-surface z-10 hidden md:block ${idx % 2 === 0 ? '-right-3' : '-left-3'}`}></div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-2">
                    {!isNaN(new Date(event.date).getTime()) ? format(new Date(event.date), 'MMM dd, yyyy') : 'Invalid date'}
                  </span>
                  <h4 className="font-bold mb-2 capitalize">{event.type.replace('_', ' ')}</h4>
                  <p className="text-sm text-on-surface-variant">{event.notes || `Successfully completed ${event.type} session.`}</p>
                </div>
              </div>
            ))}
            
            {/* Plantation Date Milestone */}
            <div className={`relative flex ${historyEvents.length % 2 === 0 ? 'justify-end pr-12 md:pr-0 md:w-1/2 md:mr-auto' : 'justify-start pl-12 md:pl-0 md:w-1/2 md:ml-auto'}`}>
              <div className="bg-surface-container-lowest p-6 rounded-lg shadow-xl shadow-green-900/5 relative w-full">
                <div className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-primary rounded-full border-4 border-surface z-10 hidden md:block ${historyEvents.length % 2 === 0 ? '-right-3' : '-left-3'}`}></div>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-2">
                  {!isNaN(new Date(plant.plantationDate).getTime()) ? format(new Date(plant.plantationDate), 'MMM dd, yyyy') : 'Invalid date'}
                </span>
                <h4 className="font-bold mb-2">Welcome Home</h4>
                <p className="text-sm text-on-surface-variant">Added to Conservatory. The journey began at {plant.location}.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [events, setEvents] = useState<PlantEvent[]>([]);
  const [isAddingPlant, setIsAddingPlant] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('conservatory');
  const [farmerLogs, setFarmerLogs] = useState<FarmerLog[]>([]);
  const [lands, setLands] = useState<Land[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [allEvents, setAllEvents] = useState<PlantEvent[]>([]);
  const [notifiedEvents, setNotifiedEvents] = useState<Set<string>>(new Set());

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'model', parts: {text: string}[]}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleUpdateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), data);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile.");
    }
  };

  const handleGlobalChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatInput("");
    const userMsg = { role: 'user' as const, parts: [{ text: msg }] };
    setChatMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);
    
    try {
      const plant = plants.find(p => p.id === selectedPlantId);
      const plantContext = plant ? { plant, events } : undefined;
      const response = await chatExpert(chatMessages, msg, plantContext);
      setChatMessages(prev => [...prev, { role: 'model' as const, parts: [{ text: response }] }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setPlants([]);
      return;
    }

    const q = query(collection(db, 'plants'), where('ownerUid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plant));
      setPlants(pList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'plants');
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        setUserProfile({ uid: snapshot.id, ...snapshot.data() } as UserProfile);
      } else {
        const initialProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Farmer',
          createdAt: new Date().toISOString()
        };
        setDoc(doc(db, 'users', user.uid), initialProfile);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || plants.length === 0) {
      setAllEvents([]);
      return;
    }

    const q = query(collectionGroup(db, 'events'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlantEvent));
      const plantIds = new Set(plants.map(p => p.id));
      const filteredEvents = eList.filter(e => plantIds.has(e.plantId));
      setAllEvents(filteredEvents);
    }, (error) => {
      console.error("CollectionGroup query failed:", error);
    });

    return () => unsubscribe();
  }, [user, plants]);

  useEffect(() => {
    if (!selectedPlantId) {
      setEvents([]);
      return;
    }

    const q = query(collection(db, `plants/${selectedPlantId}/events`), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlantEvent));
      setEvents(eList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `plants/${selectedPlantId}/events`);
    });

    return () => unsubscribe();
  }, [selectedPlantId]);

  useEffect(() => {
    if (!user) {
      setFarmerLogs([]);
      return;
    }

    const q = query(collection(db, 'farmer_logs'), where('ownerUid', '==', user.uid), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FarmerLog));
      setFarmerLogs(lList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'farmer_logs');
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLands([]);
      return;
    }

    const q = query(collection(db, 'lands'), where('ownerUid', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Land));
      setLands(lList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'lands');
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!user || plants.length === 0) return;

    // Check for due tasks in the current selected plant's events
    const now = new Date();
    const dueEvents = events.filter(e => 
      e.status === 'pending' && 
      e.type === 'watering' && 
      new Date(e.date) <= now &&
      !notifiedEvents.has(e.id)
    );

    if (dueEvents.length > 0) {
      const plant = plants.find(p => p.id === selectedPlantId);
      if (plant?.notificationsEnabled) {
        dueEvents.forEach(event => {
          // Always show toast
          toast.info(`Time to water ${plant.name}!`, {
            description: `Your ${plant.species} needs some hydration.`,
          });

          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`Time to water ${plant.name}!`, {
              body: `Your ${plant.species} needs some hydration.`,
              icon: plant.imageUrl || '/logo192.png'
            });
          }
          setNotifiedEvents(prev => new Set(prev).add(event.id));
        });
      }
    }
  }, [user, plants, events, selectedPlantId, notifiedEvents]);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignOut = () => signOut(auth);

  const handleAddFarmerLog = async (data: any) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'farmer_logs'), {
        ...data,
        ownerUid: user.uid,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'farmer_logs');
    }
  };

  const handleAddLand = async (data: any) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'lands'), {
        ...data,
        ownerUid: user.uid,
        createdAt: new Date().toISOString()
      });
      toast.success("Land registered successfully!");
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, OperationType.WRITE, 'lands');
    }
  };

  const handleDeleteLand = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this land?")) return;
    try {
      await deleteDoc(doc(db, 'lands', id));
      toast.success("Land deleted.");
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, OperationType.DELETE, `lands/${id}`);
    }
  };

  const handleDeleteFarmerLog = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'farmer_logs', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `farmer_logs/${id}`);
    }
  };

  const handleAddPlant = async (data: any) => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 1. Generate AI Profile
      const aiProfile = await generatePlantProfile(data);
      
      // 2. Save Plant
      const plantData = {
        ...data,
        ...aiProfile,
        ownerUid: user.uid,
        notificationsEnabled: true,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'plants'), plantData);
      
      // 3. Generate Initial Events (Watering, Fertilizing)
      const wateringDays = getFrequencyInDays(aiProfile.careRequirements?.wateringFrequency);
      const nextWatering = addDays(new Date(), wateringDays);
      try {
        await addDoc(collection(db, `plants/${docRef.id}/events`), {
          plantId: docRef.id,
          type: 'watering',
          date: nextWatering.toISOString(),
          status: 'pending',
          notes: 'Initial scheduled watering'
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `plants/${docRef.id}/events`);
      }

      setIsAddingPlant(false);
      setSelectedPlantId(docRef.id);
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, OperationType.WRITE, 'plants');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEvent = async (eventId: string, status: string) => {
    if (!selectedPlantId) return;
    try {
      const eventRef = doc(db, `plants/${selectedPlantId}/events`, eventId);
      await updateDoc(eventRef, { status });

      // If completed, schedule next
      if (status === 'completed') {
        const event = events.find(e => e.id === eventId);
        const plant = plants.find(p => p.id === selectedPlantId);
        
        if (event && plant && (event.type === 'watering' || event.type === 'fertilizing')) {
          let daysToAdd = 7;
          if (event.type === 'watering') {
            daysToAdd = getFrequencyInDays(plant.careRequirements?.wateringFrequency);
          } else {
            daysToAdd = 30; // Default for fertilizing
          }
          
          const nextDate = addDays(new Date(), daysToAdd);
          try {
            await addDoc(collection(db, `plants/${selectedPlantId}/events`), {
              plantId: selectedPlantId,
              type: event.type,
              date: nextDate.toISOString(),
              status: 'pending',
              notes: `Next scheduled ${event.type}`
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `plants/${selectedPlantId}/events`);
          }
        }
      }
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, OperationType.UPDATE, `plants/${selectedPlantId}/events/${eventId}`);
    }
  };

  const handleAddCustomEvent = async (type: string, notes: string, date: string = new Date().toISOString()) => {
    if (!selectedPlantId) return;
    try {
      await addDoc(collection(db, `plants/${selectedPlantId}/events`), {
        plantId: selectedPlantId,
        type,
        date,
        status: 'completed',
        notes
      });
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, OperationType.WRITE, `plants/${selectedPlantId}/events`);
    }
  };

  const handleDeletePlant = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this plant and its entire history?")) return;
    try {
      await deleteDoc(doc(db, 'plants', id));
      if (selectedPlantId === id) setSelectedPlantId(null);
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, OperationType.DELETE, `plants/${id}`);
    }
  };

  const handleTestNotification = () => {
    toast.success('Notification System Working!', {
      description: 'This is a test notification from your Conservatory.',
      action: {
        label: 'Dismiss',
        onClick: () => console.log('Dismissed'),
      },
    });

    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("Test Notification", {
          body: "Browser notifications are enabled and working!",
          icon: "/logo192.png"
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            new Notification("Notifications Enabled!", {
              body: "You will now receive care alerts for your plants.",
            });
          }
        });
      }
    }
  };

  if (!isAuthReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 animate-bounce rounded-2xl organic-gradient p-4 text-white shadow-xl">
            <Leaf className="h-full w-full" />
          </div>
          <p className="text-lg font-medium text-green-800">Growing your garden...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface">
        <Toaster position="top-right" richColors />
        <Navbar user={null} profile={null} onSignOut={() => {}} />
        <main className="container mx-auto flex flex-col items-center justify-center px-4 py-20 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl space-y-8"
          >
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl organic-gradient text-white shadow-2xl shadow-green-200">
              <Leaf className="h-10 w-10" />
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight text-green-900 sm:text-7xl">
              GrowMate: Your Plant's <span className="text-green-600">Lifetime</span> Companion
            </h1>
            <p className="text-xl text-gray-600">
              The ultimate botanical management system. AI-powered medical records, growth diaries, and expert assistants for every plant in your conservatory.
            </p>
            <Button size="lg" onClick={handleSignIn} className="h-14 rounded-full organic-gradient px-8 text-lg text-white font-bold shadow-xl">
              Get Started with Google
            </Button>
            <div className="grid grid-cols-3 gap-8 pt-12">
              <div className="space-y-2">
                <p className="text-3xl font-bold text-green-800">AI</p>
                <p className="text-sm text-gray-500">Smart Care Guides</p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-green-800">24/7</p>
                <p className="text-sm text-gray-500">Health Monitoring</p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-green-800">∞</p>
                <p className="text-sm text-gray-500">Lifetime History</p>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  const selectedPlant = plants.find(p => p.id === selectedPlantId) || null;

  const renderContent = () => {
    if (selectedPlant) {
      return (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="max-w-6xl mx-auto"
        >
          <button 
            onClick={() => setSelectedPlantId(null)}
            className="mb-8 flex items-center gap-2 text-sm font-bold text-green-800/60 hover:text-green-800 transition-colors group"
          >
            <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            Back to Conservatory
          </button>
          <PlantDashboard 
            plant={selectedPlant} 
            events={events}
            onUpdateEvent={handleUpdateEvent}
            onAddEvent={handleAddCustomEvent}
            setIsChatOpen={setIsChatOpen}
          />
        </motion.div>
      );
    }

    switch (activeTab) {
      case 'growth':
        const healthyCount = plants.filter(p => p.healthStatus?.toLowerCase().includes('healthy')).length;
        const unhealthyCount = plants.length - healthyCount;
        
        const healthData = [
          { name: 'Healthy', value: healthyCount, color: '#166534' },
          { name: 'Needs Care', value: unhealthyCount, color: '#991b1b' }
        ];

        // Group plants by plantation month
        const plantationData = plants.reduce((acc: any[], plant) => {
          if (!isValidDate(plant.plantationDate)) return acc;
          const month = safeFormat(plant.plantationDate, 'MMM yyyy');
          const existing = acc.find(d => d.month === month);
          if (existing) {
            existing.count += 1;
          } else {
            acc.push({ month, count: 1 });
          }
          return acc;
        }, []).sort((a, b) => {
          const dateA = new Date(a.month).getTime();
          const dateB = new Date(b.month).getTime();
          return dateA - dateB;
        });

        return (
          <motion.div
            key="growth"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-6xl mx-auto space-y-8"
          >
            <h2 className="text-4xl font-black text-green-900">Growth Analytics</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-green-900/5 text-center">
                <p className="text-sm font-bold text-green-800/40 uppercase tracking-widest mb-2">Total Plants</p>
                <p className="text-5xl font-black text-green-900">{plants.length}</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-green-900/5 text-center">
                <p className="text-sm font-bold text-green-800/40 uppercase tracking-widest mb-2">Healthy Specimens</p>
                <p className="text-5xl font-black text-green-600">{healthyCount}</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-green-900/5 text-center">
                <p className="text-sm font-bold text-green-800/40 uppercase tracking-widest mb-2">Success Rate</p>
                <p className="text-5xl font-black text-primary">{plants.length > 0 ? Math.round((healthyCount / plants.length) * 100) : 0}%</p>
              </div>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-green-900/5">
                <h3 className="text-xl font-bold mb-6">Plantation Trends</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={plantationData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="count" stroke="#166534" strokeWidth={3} dot={{ r: 4, fill: '#166534' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-green-900/5">
                <h3 className="text-xl font-bold mb-6">Health Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={healthData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                      <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {healthData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Vitality Leaderboard */}
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-green-900/5">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Specimen Vitality Leaderboard
              </h3>
              <div className="space-y-4">
                {plants
                  .map(p => ({
                    ...p,
                    health: calculateHealth(allEvents.filter(e => e.plantId === p.id))
                  }))
                  .sort((a, b) => b.health - a.health)
                  .slice(0, 5)
                  .map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-800 flex items-center justify-center font-bold text-sm">
                        #{idx + 1}
                      </div>
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                        <img src={p.imageUrl || `https://picsum.photos/seed/${p.species}/100/100`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-green-900">{p.name}</h4>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{p.species}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-green-700">{p.health}%</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vitality</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        );
      case 'schedule':
        const pendingEvents = allEvents.filter(e => e.status === 'pending').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return (
          <motion.div
            key="schedule"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-6xl mx-auto space-y-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-black text-green-900">Care Schedule</h2>
                <p className="text-green-800/60 font-medium">You have {pendingEvents.length} tasks pending across all specimens</p>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-green-900">{format(new Date(), 'MMMM yyyy')}</span>
              </div>
            </div>

            <div className="grid gap-6">
              {pendingEvents.length > 0 ? (
                pendingEvents.map((event) => {
                  const plant = plants.find(p => p.id === event.plantId);
                  return (
                    <div key={event.id} className="bg-white p-6 rounded-3xl shadow-xl shadow-green-900/5 flex items-center gap-6 group hover:shadow-primary/5 transition-all">
                      <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${
                        event.type === 'watering' ? 'bg-blue-50 text-blue-500' :
                        event.type === 'fertilizing' ? 'bg-amber-50 text-amber-500' :
                        'bg-green-50 text-green-500'
                      }`}>
                        {event.type === 'watering' ? <Droplets className="h-8 w-8" /> :
                         event.type === 'fertilizing' ? <Zap className="h-8 w-8" /> :
                         <Sprout className="h-8 w-8" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded">
                            {event.type}
                          </span>
                          <span className="text-xs font-bold text-slate-400">•</span>
                          <span className="text-xs font-bold text-slate-400">
                            {format(new Date(event.date), 'EEEE, MMM dd')}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-green-900">
                          {plant?.name || "Unknown Plant"}
                        </h3>
                        <p className="text-sm text-green-800/60 font-medium">{event.notes || `Scheduled ${event.type} care`}</p>
                      </div>
                      <Button 
                        onClick={() => {
                          setSelectedPlantId(event.plantId);
                          // The dashboard will show up and user can complete it there
                          // Or we could add a direct complete button here
                        }}
                        className="rounded-full organic-gradient text-white font-bold px-6 shadow-lg"
                      >
                        Go to Dashboard
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white p-12 rounded-3xl shadow-xl shadow-green-900/5 text-center">
                  <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-10 w-10 text-green-200" />
                  </div>
                  <h3 className="text-2xl font-black text-green-900">All caught up!</h3>
                  <p className="text-green-800/60 mt-2 max-w-xs mx-auto">Your conservatory is in perfect condition. No pending tasks for now.</p>
                </div>
              )}
            </div>
          </motion.div>
        );
      case 'diary':
        return (
          <motion.div
            key="diary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-6xl mx-auto"
          >
            <FarmerDiary 
              logs={farmerLogs} 
              onAdd={handleAddFarmerLog} 
              onDelete={handleDeleteFarmerLog} 
            />
          </motion.div>
        );
      case 'planner':
        return (
          <motion.div
            key="planner"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-6xl mx-auto"
          >
            <FarmPlanner 
              lands={lands} 
              onAddLand={handleAddLand} 
              onDeleteLand={handleDeleteLand} 
            />
          </motion.div>
        );
      case 'profile':
        return (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-6xl mx-auto"
          >
            <FarmerProfile 
              profile={userProfile} 
              onUpdate={handleUpdateProfile} 
            />
          </motion.div>
        );
      default:
        return (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="max-w-6xl mx-auto space-y-12"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-black tracking-tight text-green-900">My Conservatory</h2>
                <p className="text-green-800/60 font-medium">You have {plants.length} plants under care</p>
              </div>
              <Dialog open={isAddingPlant} onOpenChange={setIsAddingPlant}>
                <DialogTrigger render={
                  <Button className="organic-gradient h-14 px-8 rounded-full text-white font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add New Plant
                  </Button>
                } />
                <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
                  <div className="organic-gradient p-8 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-3xl font-black flex items-center gap-3">
                        <Sprout className="h-8 w-8" />
                        New Specimen Onboarding
                      </DialogTitle>
                      <p className="text-green-50/80 font-medium mt-2">Let's create a comprehensive lifetime profile for your new green companion.</p>
                    </DialogHeader>
                  </div>
                  <div className="p-8 bg-white">
                    <PlantForm onAdd={handleAddPlant} isLoading={isLoading} />
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <DailyTip />

            {isLoading && plants.length === 0 ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : plants.length > 0 ? (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {plants.map((plant) => (
                  <PlantCard 
                    key={plant.id} 
                    plant={plant} 
                    onClick={() => setSelectedPlantId(plant.id)} 
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-3xl bg-surface-container-lowest py-24 text-center border-2 border-dashed border-green-100">
                <div className="mb-6 rounded-full bg-green-50 p-6">
                  <Sprout className="h-16 w-16 text-green-200" />
                </div>
                <h3 className="text-2xl font-black text-green-900">Your conservatory is empty</h3>
                <p className="mt-2 text-green-800/60 max-w-xs mx-auto">Start your botanical journey by adding your first plant specimen.</p>
                <Button 
                  onClick={() => setIsAddingPlant(true)}
                  className="mt-8 organic-gradient h-14 px-10 rounded-full text-white font-bold shadow-lg"
                >
                  Add Your First Plant
                </Button>
              </div>
            )}
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <Toaster position="top-right" richColors />
      <Navbar user={user} profile={userProfile} onSignOut={handleSignOut} />
      
      <div className="flex pt-24">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={(tab) => {
            setActiveTab(tab);
            setSelectedPlantId(null);
          }} 
          onAskAI={() => setIsChatOpen(true)}
        />
        
        <main className="flex-1 px-6 pb-12 overflow-x-hidden">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around bg-white border-t md:hidden">
        <button 
          onClick={() => { setActiveTab('conservatory'); setSelectedPlantId(null); }}
          className={`flex flex-col items-center gap-1 ${activeTab === 'conservatory' ? 'text-primary' : 'text-slate-400'}`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button 
          onClick={() => { setActiveTab('diary'); setSelectedPlantId(null); }}
          className={`flex flex-col items-center gap-1 ${activeTab === 'diary' ? 'text-primary' : 'text-slate-400'}`}
        >
          <BookOpen className="h-5 w-5" />
          <span className="text-[10px] font-bold">Diary</span>
        </button>
        <button 
          onClick={() => { setActiveTab('planner'); setSelectedPlantId(null); }}
          className={`flex flex-col items-center gap-1 ${activeTab === 'planner' ? 'text-primary' : 'text-slate-400'}`}
        >
          <Brain className="h-5 w-5" />
          <span className="text-[10px] font-bold">Planner</span>
        </button>
        <button 
          onClick={() => { setActiveTab('growth'); setSelectedPlantId(null); }}
          className={`flex flex-col items-center gap-1 ${activeTab === 'growth' ? 'text-primary' : 'text-slate-400'}`}
        >
          <TrendingUp className="h-5 w-5" />
          <span className="text-[10px] font-bold">Growth</span>
        </button>
        <button 
          onClick={() => { setActiveTab('profile'); setSelectedPlantId(null); }}
          className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-primary' : 'text-slate-400'}`}
        >
          <UserIcon className="h-5 w-5" />
          <span className="text-[10px] font-bold">Profile</span>
        </button>
      </div>

      {/* Global AI Chat Widget */}
      <div className="fixed bottom-8 right-8 z-50">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="mb-4 w-96 overflow-hidden rounded-3xl bg-white shadow-2xl border flex flex-col"
              style={{ maxHeight: 'calc(100vh - 12rem)' }}
            >
              <div className="organic-gradient p-4 text-white flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  GrowMate AI Expert
                </h3>
                <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                  <ChevronRight className="h-5 w-5 rotate-90" />
                </button>
              </div>
              <ScrollArea className="flex-1 p-4 min-h-[300px]">
                <div className="space-y-4">
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl px-4 py-2 text-sm bg-surface-container text-on-surface">
                      Hello! I'm your GrowMate AI expert. {selectedPlantId ? `I see you're asking about ${plants.find(p => p.id === selectedPlantId)?.name}. ` : ""}How can I help you today?
                    </div>
                  </div>
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                        msg.role === 'user' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface'
                      }`}>
                        <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="animate-pulse rounded-2xl bg-surface-container px-4 py-2 text-sm text-on-surface-variant">
                        Analyzing...
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t bg-surface">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Ask anything about plants..." 
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleGlobalChat()}
                    className="rounded-full"
                  />
                  <Button onClick={handleGlobalChat} disabled={isChatLoading} size="icon" className="rounded-full organic-gradient">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {!isChatOpen && (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="organic-gradient text-white flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            <Sparkles className="h-5 w-5" />
            <span className="font-bold">Ask AI Expert</span>
          </button>
        )}
      </div>
    </div>
  );
}
