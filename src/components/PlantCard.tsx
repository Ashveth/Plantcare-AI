import React from 'react';
import { Plant } from '../types';
import { Droplets, Thermometer, Calendar, TrendingUp, MoreVertical, Heart, FlaskConical, Trash2 } from 'lucide-react';
import { formatDistanceToNow, addDays, isPast } from 'date-fns';
import { useState } from 'react';

interface PlantCardProps {
  plant: Plant;
  onWater: (id: string) => void;
  onFertilize: (id: string) => void;
  onEdit: (plant: Plant) => void;
  onDelete: (id: string) => void;
}

export const PlantCard: React.FC<PlantCardProps> = ({ plant, onWater, onFertilize, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const nextWatering = addDays(new Date(plant.lastWatered), plant.wateringFrequency);
  const needsWater = isPast(nextWatering);

  const nextFertilizing = addDays(new Date(plant.lastFertilized), plant.fertilizationFrequency);
  const needsFertilizer = isPast(nextFertilizing);

  const healthColors = {
    Good: 'text-green-500 bg-green-50',
    Moderate: 'text-yellow-500 bg-yellow-50',
    Poor: 'text-red-500 bg-red-50',
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative">
      {needsFertilizer && (
        <div className="absolute -top-2 -right-2 bg-purple-600 text-white p-2 rounded-xl shadow-lg z-10 animate-bounce">
          <FlaskConical size={16} />
        </div>
      )}
      
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
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MoreVertical size={20} />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  onEdit(plant);
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                View Details
              </button>
              <div className="h-px bg-gray-100 my-1 mx-2" />
              <button
                onClick={() => {
                  onDelete(plant.id);
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete Plant
              </button>
            </div>
          )}
        </div>
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
          <span>Water {plant.wateringFrequency}d</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FlaskConical size={16} className={needsFertilizer ? 'text-purple-500' : 'text-gray-400'} />
          <span>Fertilize {plant.fertilizationFrequency}d</span>
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
          {needsWater ? 'Water' : 'Watered'}
        </button>
        <button 
          onClick={() => onFertilize(plant.id)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all shadow-sm ${
            needsFertilizer 
              ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-100' 
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
          }`}
        >
          <FlaskConical size={18} fill={needsFertilizer ? 'none' : 'currentColor'} />
          {needsFertilizer ? 'Feed' : 'Fed'}
        </button>
        <button 
          onClick={() => onEdit(plant)}
          className="px-4 py-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-colors"
        >
          Details
        </button>
      </div>
      
      <div className="mt-3 flex justify-between px-1">
        <p className="text-[10px] text-gray-400">
          Watered {formatDistanceToNow(new Date(plant.lastWatered))} ago
        </p>
        <p className="text-[10px] text-gray-400">
          Fed {formatDistanceToNow(new Date(plant.lastFertilized))} ago
        </p>
      </div>
    </div>
  );
};
