import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import { getPlantFeedback } from '../services/gemini';
import { Plant } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface FeedbackSystemProps {
  plants: Plant[];
}

export const FeedbackSystem: React.FC<FeedbackSystemProps> = ({ plants }) => {
  const [feedback, setFeedback] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [show, setShow] = useState(false);

  const generateFeedback = async () => {
    if (plants.length === 0) return;
    setIsLoading(true);
    setShow(true);
    
    try {
      // Get feedback for up to 3 random plants to keep it concise
      const selectedPlants = [...plants].sort(() => 0.5 - Math.random()).slice(0, 3);
      const results = await Promise.all(selectedPlants.map(p => getPlantFeedback(p)));
      setFeedback(results);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-8">
      {!show ? (
        <button 
          onClick={generateFeedback}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          <Sparkles size={20} />
          Get Weekly AI Insights
        </button>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-100 rounded-[32px] p-6 relative overflow-hidden"
        >
          <button 
            onClick={() => setShow(false)}
            className="absolute top-4 right-4 text-emerald-400 hover:text-emerald-600 p-1"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
              <Sparkles size={20} />
            </div>
            <h3 className="font-bold text-emerald-900 text-lg">AI Care Insights</h3>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-3 text-emerald-600 py-4">
              <Loader2 size={24} className="animate-spin" />
              <span className="font-medium">Analyzing your garden...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {feedback.map((text, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-emerald-100/50"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <p className="text-emerald-800 text-sm leading-relaxed">{text}</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
