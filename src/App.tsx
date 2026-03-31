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
import { Leaf, Plus, LogOut, Bell, Search, Filter, Sprout, Droplets, Thermometer, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';

const INITIAL_PLANTS = [
  { 
    name: 'Rose', 
    type: 'Flowering' as PlantType, 
    wateringFrequency: 2, 
    height: 30, 
    age: 45, 
    healthStatus: 'Good' as HealthStatus, 
    notes: 'Needs plenty of sunlight.', 
    imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' // Placeholder base64, will be replaced with actual identified image data
  },
  { 
    name: 'Hibiscus', 
    type: 'Flowering' as PlantType, 
    wateringFrequency: 1, 
    height: 40, 
    age: 60, 
    healthStatus: 'Good' as HealthStatus, 
    notes: 'Water daily in summer.', 
    imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' // Placeholder base64
  },
  { 
    name: 'Mogra (Jasmine)', 
    type: 'Flowering' as PlantType, 
    wateringFrequency: 2, 
    height: 25, 
    age: 30, 
    healthStatus: 'Moderate' as HealthStatus, 
    notes: 'Smells amazing at night.', 
    imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' // Placeholder base64
  },
  { 
    name: 'Tulsi (Holy Basil)', 
    type: 'Medicinal' as PlantType, 
    wateringFrequency: 1, 
    height: 20, 
    age: 15, 
    healthStatus: 'Good' as HealthStatus, 
    notes: 'Sacred plant, keep in bright light.', 
    imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' // Placeholder base64
  },
  { 
    name: 'Aloe Vera', 
    type: 'Succulent' as PlantType, 
    wateringFrequency: 5, 
    height: 15, 
    age: 90, 
    healthStatus: 'Good' as HealthStatus, 
    notes: 'Very low maintenance.', 
    imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' // Placeholder base64
  },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
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
        for (const p of INITIAL_PLANTS) {
          await addDoc(collection(db, 'plants'), {
            ...p,
            ownerUid: user.uid,
            lastWatered: new Date().toISOString(),
            lastFertilized: new Date().toISOString()
          });
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

  const handleWater = async (id: string) => {
    try {
      await updateDoc(doc(db, 'plants', id), {
        lastWatered: new Date().toISOString()
      });
      toast.success('Plant watered successfully! 💧');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update watering status.');
    }
  };

  const handleAddPlant = async (newPlant: Omit<Plant, 'id' | 'ownerUid'>) => {
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

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
      </div>
    );
  }

  if (!user) {
    return <Auth onAuth={() => {}} />;
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
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-gray-900">{user.displayName || 'Gardener'}</p>
                <p className="text-[10px] text-gray-500">Pro Member</p>
              </div>
              <button 
                onClick={() => signOut(auth)}
                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <LogOut size={18} />
              </button>
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
              className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-semibold text-gray-600 hover:bg-gray-50 shadow-sm">
            <Filter size={18} />
            Filter
          </button>
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
        ) : plants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4">
              <Sprout size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Your garden is empty</h3>
            <p className="text-gray-500 mb-8">Start by adding your first plant to track its growth.</p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-700 shadow-lg"
            >
              Add Your First Plant
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {plants.map(plant => (
              <PlantCard 
                key={plant.id} 
                plant={plant} 
                onWater={handleWater}
                onEdit={(p) => setSelectedPlant(p)}
                onDelete={() => {}}
              />
            ))}
          </div>
        )}
      </main>

      {/* AI Chatbot */}
      <AIChatbot />

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
      </AnimatePresence>
    </div>
  );
}
