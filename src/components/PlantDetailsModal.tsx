import React, { useState, useEffect, useRef } from 'react';
import { X, Droplets, Sprout, Calendar, TrendingUp, Heart, Save, Loader2, Camera, Trash2, AlertTriangle } from 'lucide-react';
import { Plant, GrowthLog, PlantType } from '../types';
import { GrowthChart } from './GrowthChart';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { identifyPlantFromImage } from '../services/gemini';
import { toast } from 'sonner';

interface PlantDetailsModalProps {
  plant: Plant;
  onClose: () => void;
}

export const PlantDetailsModal: React.FC<PlantDetailsModalProps> = ({ plant, onClose }) => {
  const [logs, setLogs] = useState<GrowthLog[]>([]);
  const [newHeight, setNewHeight] = useState(plant.height.toString());
  const [isSaving, setIsSaving] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, `plants/${plant.id}/growthLogs`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GrowthLog)));
    });
    return unsubscribe;
  }, [plant.id]);

  const handleImageUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setIsIdentifying(true);
      
      try {
        // Update Firestore
        await updateDoc(doc(db, 'plants', plant.id), { imageUrl: base64String });
        toast.success('Plant photo updated! 📸');
        // Optional: Identify and update name/type if they are placeholders?
        // For now, just update the image.
      } catch (err) {
        console.error("Error updating image:", err);
      } finally {
        setIsIdentifying(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateHeight = async () => {
    const height = Number(newHeight);
    if (isNaN(height) || height <= 0) return;

    setIsSaving(true);
    try {
      // Update plant current height
      await updateDoc(doc(db, 'plants', plant.id), { height });
      
      // Add to growth logs
      await addDoc(collection(db, `plants/${plant.id}/growthLogs`), {
        plantId: plant.id,
        height,
        timestamp: new Date().toISOString()
      });
      
      setNewHeight(height.toString());
      toast.success(`${plant.name} height updated to ${height}cm! 📈`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update height.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlant = async () => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'plants', plant.id));
      toast.success(`${plant.name} removed from your garden.`);
      onClose();
    } catch (err) {
      console.error("Error deleting plant:", err);
      toast.error('Failed to remove plant.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full text-gray-400">
          <X size={24} />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left Side: Info */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                <Heart size={32} fill={plant.healthStatus === 'Good' ? 'currentColor' : 'none'} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{plant.name}</h2>
                <p className="text-emerald-600 font-medium">{plant.type}</p>
              </div>
            </div>

            <div className="relative group mb-8">
              <img 
                src={plant.imageUrl || `https://picsum.photos/seed/${plant.name}/600/400`} 
                alt={plant.name}
                className="w-full aspect-video object-cover rounded-3xl shadow-sm"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl"
              >
                <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border border-white/30">
                  <Camera className="text-white" size={32} />
                </div>
              </button>
              
              {isIdentifying && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl">
                  <Loader2 className="text-emerald-600 animate-spin mb-2" size={32} />
                  <p className="text-emerald-800 font-bold">Updating Photo...</p>
                </div>
              )}
              
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpdate}
                accept="image/*"
                capture="environment"
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Current Height</p>
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-emerald-500" />
                  <span className="text-xl font-bold">{plant.height} cm</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Plant Age</p>
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-emerald-500" />
                  <span className="text-xl font-bold">{plant.age} days</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-gray-900">Care Notes</h4>
              <p className="text-gray-600 bg-gray-50 p-4 rounded-2xl text-sm leading-relaxed">
                {plant.notes || "No specific notes for this plant yet. Add some to keep track of its unique needs!"}
              </p>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-100">
              {!showDeleteConfirm ? (
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 text-red-500 font-bold hover:text-red-600 transition-colors"
                >
                  <Trash2 size={20} />
                  Remove Plant from Garden
                </button>
              ) : (
                <div className="bg-red-50 p-6 rounded-3xl border border-red-100 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-3 text-red-800 mb-4">
                    <AlertTriangle size={24} />
                    <p className="font-bold">Are you sure you want to delete this plant?</p>
                  </div>
                  <p className="text-red-600 text-sm mb-6">This action cannot be undone. All growth history will be lost.</p>
                  <div className="flex gap-3">
                    <button 
                      onClick={handleDeletePlant}
                      disabled={isDeleting}
                      className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isDeleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                      Yes, Delete
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="flex-1 bg-white text-gray-600 py-3 rounded-2xl font-bold border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Growth & Updates */}
          <div className="space-y-8">
            <div>
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-emerald-600" />
                Growth Tracker
              </h4>
              <GrowthChart logs={logs} />
            </div>

            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
              <h4 className="font-bold text-emerald-900 mb-4">Update Height</h4>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input 
                    type="number" 
                    value={newHeight}
                    onChange={(e) => setNewHeight(e.target.value)}
                    className="w-full bg-white border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500"
                    placeholder="New height in cm"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">cm</span>
                </div>
                <button 
                  onClick={handleUpdateHeight}
                  disabled={isSaving}
                  className="bg-emerald-600 text-white px-6 rounded-2xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  Update
                </button>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
              <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                <Droplets size={20} className="text-blue-600" />
                Watering Schedule
              </h4>
              <p className="text-blue-800 text-sm">
                This plant needs water every <strong>{plant.wateringFrequency} days</strong>. 
                Last watered on {format(new Date(plant.lastWatered), 'MMMM do')}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
