import React from 'react';
import { Plant } from '../types';
import { Droplets, Thermometer, Calendar, TrendingUp, MoreVertical, Heart } from 'lucide-react';
import { formatDistanceToNow, addDays, isPast } from 'date-fns';

interface PlantCardProps {
  plant: Plant;
  onWater: (id: string) => void;
  onEdit: (plant: Plant) => void;
  onDelete: (id: string) => void;
}

export const PlantCard: React.FC<PlantCardProps> = ({ plant, onWater, onEdit, onDelete }) => {
  const nextWatering = addDays(new Date(plant.lastWatered), plant.wateringFrequency);
  const needsWater = isPast(nextWatering);

  const healthColors = {
    Good: 'text-green-500 bg-green-50',
    Moderate: 'text-yellow-500 bg-yellow-50',
    Poor: 'text-red-500 bg-red-50',
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Heart size={24} fill={plant.healthStatus === 'Good' ? 'currentColor' : 'none'} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{plant.name}</h3>
            <p className="text-sm text-gray-500 italic">{plant.type}</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 p-1">
          <MoreVertical size={20} />
        </button>
      </div>

      <div className="aspect-video w-full rounded-2xl overflow-hidden mb-4 bg-gray-50">
        <img 
          src={plant.imageUrl || `https://picsum.photos/seed/${plant.name}/400/225`} 
          alt={plant.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <TrendingUp size={16} className="text-emerald-500" />
          <span>{plant.height} cm</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={16} className="text-emerald-500" />
          <span>{plant.age} days</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Droplets size={16} className={needsWater ? 'text-red-500' : 'text-blue-500'} />
          <span>Every {plant.wateringFrequency}d</span>
        </div>
        <div className={`flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-full w-fit ${healthColors[plant.healthStatus]}`}>
          <span>{plant.healthStatus}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => onWater(plant.id)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all shadow-sm ${
            needsWater 
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100' 
              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
          }`}
        >
          <Droplets size={18} fill={needsWater ? 'none' : 'currentColor'} />
          {needsWater ? 'Water Now' : 'Watered'}
        </button>
        <button 
          onClick={() => onEdit(plant)}
          className="px-4 py-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-colors"
        >
          Details
        </button>
      </div>
      
      <p className="mt-3 text-[10px] text-gray-400 text-center">
        Last watered {formatDistanceToNow(new Date(plant.lastWatered))} ago
      </p>
    </div>
  );
};
