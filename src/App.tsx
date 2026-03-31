import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, setDoc, getDocs, Timestamp } from 'firebase/firestore';
import { Plant, PlantType, HealthStatus, GrowthLog } from './types';
import { Auth } from './components/Auth';
import { PlantCard } from './components/PlantCard';
import { AddPlantModal } from './components/AddPlantModal';
import { AIChatbot } from './components/AIChatbot';
import { FeedbackSystem } from './components/FeedbackSystem';
import { PlantDetailsModal } from './components/PlantDetailsModal';
import { ProfileModal } from './components/ProfileModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { Leaf, Plus, LogOut, Bell, Search, Filter, Sprout, Droplets, Thermometer, Loader2, User as UserIcon, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';

const INITIAL_PLANTS = [
  { 
    name: 'Rose', 
    type: 'Flowering' as PlantType, 
    wateringFrequency: 2, 
    fertilizationFrequency: 15,
    height: 30, 
    age: 45, 
    healthStatus: 'Good' as HealthStatus, 
    notes: 'Needs plenty of sunlight.', 
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop'
  },
  { 
    name: 'Hibiscus', 
    type: 'Flowering' as PlantType, 
    wateringFrequency: 1, 
    fertilizationFrequency: 15,
    height: 40, 
    age: 60, 
    healthStatus: 'Good' as HealthStatus, 
    notes: 'Water daily in summer.', 
    imageUrl: 'https://images.unsplash.com/photo-1589244159943-460088ed5c92?q=80&w=1000&auto=format&fit=crop'
  },
  { 
    name: 'Mogra (Jasmine)', 
    type: 'Flowering' as PlantType, 
    wateringFrequency: 2, 
    fertilizationFrequency: 20,
    height: 25, 
    age: 30, 
    healthStatus: 'Moderate' as HealthStatus, 
    notes: 'Smells amazing at night.', 
    imageUrl: 'https://images.unsplash.com/photo-1596193810451-641037f3014b?q=80&w=1000&auto=format&fit=crop'
  },
  { 
    name: 'Tulsi (Holy Basil)', 
    type: 'Medicinal' as PlantType, 
    wateringFrequency: 1, 
    fertilizationFrequency: 30,
    height: 20, 
    age: 15, 
    healthStatus: 'Good' as HealthStatus, 
    notes: 'Sacred plant, keep in bright light.', 
    imageUrl: 'https://images.unsplash.com/photo-1615485240384-552e40079c14?q=80&w=1000&auto=format&fit=crop'
  },
  { 
    name: 'Aloe Vera', 
    type: 'Succulent' as PlantType, 
    wateringFrequency: 5, 
    fertilizationFrequency: 60,
    height: 15, 
    age: 90, 
    healthStatus: 'Good' as HealthStatus, 
    notes: 'Very low maintenance.', 
    imageUrl: 'https://images.unsplash.com/photo-1567331711402-509c2394098a?q=80&w=1000&auto=format&fit=crop'
  },
  { 
    name: 'Snake Plant', 
    type: 'Indoor' as PlantType, 
    wateringFrequency: 14, 
    fertilizationFrequency: 60,
    height: 45, 
    age: 120, 
    healthStatus: 'Good' as HealthStatus, 
    notes: 'Purifies air, thrives in low light.', 
    imageUrl: 'https://images.unsplash.com/photo-1593482892290-f54927ae1bac?q=80&w=1000&auto=format&fit=crop'
  },
  { 
    name: 'Lavender', 
    type: 'Medicinal' as PlantType, 
    wateringFrequency: 3, 
    fertilizationFrequency: 30,
    height: 35, 
    age: 75, 
    healthStatus: 'Good' as HealthStatus, 
    notes: 'Calming scent, needs well-draining soil.', 
    imageUrl: 'https://images.unsplash.com/photo-1595908129746-57ca1a63dd4d?q=80&w=1000&auto=format&fit=crop'
  },
  { 
    name: 'Peace Lily', 
    type: 'Indoor' as PlantType, 
    wateringFrequency: 4, 
    fertilizationFrequency: 30,
    height: 50, 
    age: 180, 
    healthStatus: 'Moderate' as HealthStatus, 
    notes: 'Tells you when it needs water by drooping.', 
    imageUrl: 'https://images.unsplash.com/photo-1593691509543-c55fb32e7355?q=80&w=1000&auto=format&fit=crop'
  },
  { 
    name: 'Sunflower', 
    type: 'Outdoor' as PlantType, 
    wateringFrequency: 1, 
    fertilizationFrequency: 14,
    height: 120, 
    age: 40, 
    healthStatus: 'Good' as HealthStatus, 
    notes: 'Follows the sun throughout the day.', 
    imageUrl: 'https://images.unsplash.com/photo-1470509037663-253afd7f0f51?q=80&w=1000&auto=format&fit=crop'
  },
  { 
    name: 'Money Plant', 
    type: 'Indoor' as PlantType, 
    wateringFrequency: 3, 
    fertilizationFrequency: 30,
    height: 60, 
    age: 200, 
    healthStatus: 'Good' as HealthStatus, 
    notes: 'Can grow in water or soil.', 
    imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=1000&auto=format&fit=crop'
  },
  { 
    name: 'Orchid', 
    type: 'Flowering' as PlantType, 
    wateringFrequency: 7, 
    fertilizationFrequency: 14,
    height: 25, 
    age: 150, 
    healthStatus: 'Good' as HealthStatus, 
    notes: 'Needs high humidity and indirect light.', 
    imageUrl: 'https://images.unsplash.com/photo-1534885320277-1b1bb998f547?q=80&w=1000&auto=format&fit=crop'
  },
  { 
    name: 'Marigold', 
    type: 'Flowering' as PlantType, 
    wateringFrequency: 2, 
    fertilizationFrequency: 15,
    height: 30, 
    age: 45, 
    healthStatus: 'Good' as HealthStatus, 
    notes: 'Great for repelling pests in the garden.', 
    imageUrl: 'https://images.unsplash.com/photo-1599148482840-d7afdf004172?q=80&w=1000&auto=format&fit=crop'
  },
  { 
    name: 'Lily', 
    type: 'Flowering' as PlantType, 
    wateringFrequency: 3, 
    fertilizationFrequency: 20,
    height: 40, 
    age: 60, 
    healthStatus: 'Good' as HealthStatus, 
    notes: 'Beautiful but toxic to cats.', 
    imageUrl: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?q=80&w=1000&auto=format&fit=crop'
  }
];

const DEMO_USER = {
  uid: 'demo-user',
  displayName: 'Guest Gardener',
  email: 'guest@example.com',
  photoURL: null
} as User;

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [demoUser, setDemoUser] = useState(DEMO_USER);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authTimeout, setAuthTimeout] = useState(false);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'water' | 'fertilize' | 'delete', id: string, name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<PlantType | 'All'>('All');

  const currentUser = isDemo ? demoUser : user;

  const filteredPlants = plants.filter(plant => {
    const matchesSearch = plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plant.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'All' || plant.type === filterType;
    return matchesSearch && matchesFilter;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAuthReady) {
        setAuthTimeout(true);
      }
    }, 10000);

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      clearTimeout(timer);
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [isAuthReady]);

  useEffect(() => {
    if (isDemo) {
      setPlants(INITIAL_PLANTS.map((p, i) => ({ ...p, id: `demo-${i}`, ownerUid: 'demo-user' } as Plant)));
      setIsLoading(false);
      return;
    }

    if (!user) {
      setPlants([]);
      setIsLoading(false);
      return;
    }

    const q = query(collection(db, 'plants'), where('ownerUid', '==', user.uid));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const plantList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plant));
      
      // Preload initial plants if user has none
      if (plantList.length === 0 && snapshot.metadata.fromCache === false) {
        setIsLoading(true); // Ensure loading state while preloading
        try {
          const promises = INITIAL_PLANTS.map(p => 
            addDoc(collection(db, 'plants'), {
              ...p,
              ownerUid: user.uid,
              lastWatered: new Date().toISOString(),
              lastFertilized: new Date().toISOString()
            })
          );
          await Promise.all(promises);
        } catch (err) {
          console.error("Error preloading plants:", err);
        }
      } else {
        setPlants(plantList);
        setIsLoading(false);
      }
    }, (error) => {
      console.error("Firestore Error:", error);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleWater = (id: string) => {
    const plant = plants.find(p => p.id === id);
    setConfirmAction({ 
      type: 'water', 
      id, 
      name: plant?.name || 'this plant' 
    });
  };

  const executeWatering = async (id: string) => {
    if (isDemo) {
      setPlants(prev => prev.map(p => p.id === id ? { ...p, lastWatered: new Date().toISOString() } : p));
      toast.success('Plant watered! 💧');
      setConfirmAction(null);
      return;
    }
    try {
      await updateDoc(doc(db, 'plants', id), {
        lastWatered: new Date().toISOString()
      });
      toast.success('Plant watered successfully! 💧');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update watering status.');
    } finally {
      setConfirmAction(null);
    }
  };

  const handleFertilize = (id: string) => {
    const plant = plants.find(p => p.id === id);
    setConfirmAction({ 
      type: 'fertilize', 
      id, 
      name: plant?.name || 'this plant' 
    });
  };

  const handleDelete = (id: string) => {
    const plant = plants.find(p => p.id === id);
    setConfirmAction({ 
      type: 'delete', 
      id, 
      name: plant?.name || 'this plant' 
    });
  };

  const executeDeletion = async (id: string) => {
    if (isDemo) {
      setPlants(prev => prev.filter(p => p.id !== id));
      toast.success('Plant removed from garden.');
      setConfirmAction(null);
      return;
    }
    try {
      await deleteDoc(doc(db, 'plants', id));
      toast.success('Plant removed from your garden. 🌿');
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove plant.');
    } finally {
      setConfirmAction(null);
    }
  };

  const executeFertilizing = async (id: string) => {
    if (isDemo) {
      setPlants(prev => prev.map(p => p.id === id ? { ...p, lastFertilized: new Date().toISOString() } : p));
      toast.success('Plant fertilized! ✨');
      setConfirmAction(null);
      return;
    }
    try {
      await updateDoc(doc(db, 'plants', id), {
        lastFertilized: new Date().toISOString()
      });
      toast.success('Plant fertilized successfully! ✨');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update fertilization status.');
    } finally {
      setConfirmAction(null);
    }
  };

  const handleAddPlant = async (newPlant: Omit<Plant, 'id' | 'ownerUid'>) => {
    if (isDemo) {
      const demoId = `demo-${Date.now()}`;
      setPlants(prev => [...prev, { ...newPlant, id: demoId, ownerUid: 'demo-user' } as Plant]);
      toast.success('New plant added to your garden! 🌿');
      return;
    }
    if (!user) return;
    try {
      await addDoc(collection(db, 'plants'), {
        ...newPlant,
        ownerUid: user.uid
      });
      toast.success('New plant added to your garden! 🌿');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add plant.');
    }
  };

  const handleDemo = (data?: { displayName: string; photoURL: string | null }) => {
    if (data) {
      setDemoUser(prev => ({ ...prev, ...data }));
    }
    setIsDemo(true);
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-50 p-6 text-center">
        <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-lg animate-pulse">
          <Leaf size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">PlantCare AI</h2>
        <p className="text-gray-500 mb-8 max-w-xs">Connecting to your garden...</p>
        
        {authTimeout ? (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <p className="text-red-500 text-sm mb-4">Taking longer than expected. Please check your connection.</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-700 shadow-lg"
              >
                Retry Connection
              </button>
              <button 
                onClick={() => handleDemo()}
                className="bg-white text-emerald-700 border border-emerald-200 px-8 py-3 rounded-2xl font-bold hover:bg-emerald-50"
              >
                Enter Demo Mode
              </button>
            </div>
          </div>
        ) : (
          <Loader2 className="animate-spin text-emerald-600" size={32} />
        )}
      </div>
    );
  }

  if (!user && !isDemo) {
    return <Auth onAuth={() => {}} onDemo={handleDemo} />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Leaf size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">PlantCare AI</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-gray-100"></div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => !isDemo && setIsProfileModalOpen(true)}
                className={`flex items-center gap-3 hover:bg-gray-50 p-2 rounded-xl transition-colors ${isDemo ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 overflow-hidden border border-gray-100">
                  {currentUser?.photoURL ? (
                    <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon size={20} />
                  )}
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-gray-900">{currentUser?.displayName || 'Gardener'}</p>
                  <p className="text-[10px] text-gray-500">{isDemo ? 'Demo Mode' : 'Pro Member'}</p>
                </div>
              </button>
              <div className="flex gap-2">
                {!isDemo && (
                  <button 
                    onClick={() => setIsProfileModalOpen(true)}
                    className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors sm:hidden"
                    title="Edit Profile"
                  >
                    <Settings size={18} />
                  </button>
                )}
                <button 
                  onClick={() => {
                    if (isDemo) {
                      setIsDemo(false);
                      setUser(null);
                    } else {
                      signOut(auth);
                    }
                  }}
                  className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome & Stats */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">My Garden</h2>
            <p className="text-gray-500">You have {plants.length} healthy plants growing today.</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <Droplets size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Watering</p>
                <p className="font-bold text-gray-900">3 Needed</p>
              </div>
            </div>
            <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                <Sprout size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Growth</p>
                <p className="font-bold text-gray-900">+12%</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Feedback */}
        <FeedbackSystem plants={plants} />

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search your plants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
          </div>
          <div className="relative group">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="appearance-none flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-semibold text-gray-600 hover:bg-gray-50 shadow-sm cursor-pointer focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Types</option>
              <option value="Flowering">Flowering</option>
              <option value="Indoor">Indoor</option>
              <option value="Outdoor">Outdoor</option>
              <option value="Medicinal">Medicinal</option>
              <option value="Succulent">Succulent</option>
            </select>
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
          >
            <Plus size={20} />
            Add Plant
          </button>
        </div>

        {/* Plant Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p>Loading your garden...</p>
          </div>
        ) : filteredPlants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4">
              <Sprout size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchQuery || filterType !== 'All' ? 'No matching plants found' : 'Your garden is empty'}
            </h3>
            <p className="text-gray-500 mb-8">
              {searchQuery || filterType !== 'All' 
                ? 'Try adjusting your search or filter to find what you are looking for.' 
                : 'Start by adding your first plant to track its growth.'}
            </p>
            {(searchQuery || filterType !== 'All') ? (
              <button 
                onClick={() => { setSearchQuery(''); setFilterType('All'); }}
                className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-700 shadow-lg"
              >
                Clear Filters
              </button>
            ) : (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-700 shadow-lg"
              >
                Add Your First Plant
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPlants.map(plant => (
              <PlantCard 
                key={plant.id} 
                plant={plant} 
                onWater={handleWater}
                onFertilize={handleFertilize}
                onEdit={(p) => setSelectedPlant(p)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* AI Chatbot */}
      <AIChatbot selectedPlant={selectedPlant} plantsInView={filteredPlants} />

      <Toaster position="top-center" richColors />

      {/* Modals */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddPlantModal 
            onClose={() => setIsAddModalOpen(false)} 
            onAdd={handleAddPlant} 
          />
        )}
        {selectedPlant && (
          <PlantDetailsModal 
            plant={selectedPlant} 
            onClose={() => setSelectedPlant(null)} 
          />
        )}
        {isProfileModalOpen && (
          <ProfileModal 
            user={currentUser}
            isDemo={isDemo}
            onClose={() => setIsProfileModalOpen(false)} 
            onUpdate={(data) => {
              if (isDemo) {
                setDemoUser(prev => ({ ...prev, ...data }));
              } else {
                setUser({ ...auth.currentUser } as User);
              }
            }}
          />
        )}
        {confirmAction && (
          <ConfirmationModal
            isOpen={!!confirmAction}
            type={confirmAction.type}
            title={confirmAction.type === 'water' ? 'Confirm Watering' : confirmAction.type === 'fertilize' ? 'Confirm Fertilization' : 'Confirm Deletion'}
            message={`Are you sure you want to ${confirmAction.type} ${confirmAction.name}?`}
            confirmText={confirmAction.type === 'water' ? 'Water Now' : confirmAction.type === 'fertilize' ? 'Feed Now' : 'Delete'}
            onConfirm={() => {
              if (confirmAction.type === 'water') executeWatering(confirmAction.id);
              if (confirmAction.type === 'fertilize') executeFertilizing(confirmAction.id);
              if (confirmAction.type === 'delete') executeDeletion(confirmAction.id);
            }}
            onCancel={() => setConfirmAction(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
