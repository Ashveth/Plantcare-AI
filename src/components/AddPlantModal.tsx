import React, { useState, useRef } from 'react';
import { X, Upload, Plus, Camera, Loader2 } from 'lucide-react';
import { Plant, PlantType, HealthStatus } from '../types';
import { identifyPlantFromImage } from '../services/gemini';
import { toast } from 'sonner';

interface AddPlantModalProps {
  onClose: () => void;
  onAdd: (plant: Omit<Plant, 'id' | 'ownerUid'>) => void;
}

export const AddPlantModal: React.FC<AddPlantModalProps> = ({ onClose, onAdd }) => {
  const [isIdentifying, setIsIdentifying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Indoor' as PlantType,
    height: 10,
    age: 0,
    wateringFrequency: 2,
    healthStatus: 'Good' as HealthStatus,
    notes: '',
    imageUrl: ''
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setFormData(prev => ({ ...prev, imageUrl: base64String }));
      
      // Automatically identify
      setIsIdentifying(true);
      const identification = await identifyPlantFromImage(base64String);
      if (identification) {
        setFormData(prev => ({
          ...prev,
          name: identification.name || prev.name,
          type: (identification.type as PlantType) || prev.type
        }));
        toast.success(`AI identified this as a ${identification.name}! ✨`);
      } else {
        toast.error('AI could not identify the plant. You can still enter details manually.');
      }
      setIsIdentifying(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      ...formData,
      lastWatered: new Date().toISOString(),
      lastFertilized: new Date().toISOString()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full text-gray-400">
          <X size={24} />
        </button>

        <h2 className="text-3xl font-bold text-gray-900 mb-8">Add New Plant</h2>

        <div className="mb-8">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-video bg-emerald-50 rounded-[32px] border-2 border-dashed border-emerald-200 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-100 transition-all overflow-hidden relative group"
          >
            {formData.imageUrl ? (
              <>
                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="text-white" size={32} />
                </div>
              </>
            ) : (
              <>
                <div className="bg-emerald-100 p-4 rounded-full mb-4">
                  <Camera className="text-emerald-600" size={32} />
                </div>
                <p className="text-emerald-800 font-medium">Take a photo or upload image</p>
                <p className="text-emerald-600/60 text-sm mt-1">AI will automatically identify your plant</p>
              </>
            )}
            
            {isIdentifying && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <Loader2 className="text-emerald-600 animate-spin mb-2" size={32} />
                <p className="text-emerald-800 font-bold animate-pulse">Identifying Plant...</p>
              </div>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            capture="environment"
            className="hidden"
          />
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plant Name</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. My Rose"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plant Type</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as PlantType })}
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Flowering">Flowering</option>
                <option value="Indoor">Indoor</option>
                <option value="Outdoor">Outdoor</option>
                <option value="Medicinal">Medicinal</option>
                <option value="Succulent">Succulent</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                <input 
                  type="number" 
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age (days)</label>
                <input 
                  type="number" 
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Watering Frequency (days)</label>
              <input 
                type="number" 
                value={formData.wateringFrequency}
                onChange={(e) => setFormData({ ...formData, wateringFrequency: Number(e.target.value) })}
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Health Status</label>
              <select 
                value={formData.healthStatus}
                onChange={(e) => setFormData({ ...formData, healthStatus: e.target.value as HealthStatus })}
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Good">Good</option>
                <option value="Moderate">Moderate</option>
                <option value="Poor">Poor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
              <input 
                type="url" 
                value={formData.imageUrl.startsWith('data:') ? 'Image Uploaded' : formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                disabled={formData.imageUrl.startsWith('data:')}
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 h-24 resize-none"
              placeholder="Any special care instructions?"
            />
          </div>

          <button 
            type="submit"
            className="md:col-span-2 bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <Plus size={24} />
            Add Plant to Garden
          </button>
        </form>
      </div>
    </div>
  );
};
