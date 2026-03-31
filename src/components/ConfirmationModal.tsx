import React from 'react';
import { Droplets, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'water' | 'fertilize' | 'delete';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'water'
}) => {
  if (!isOpen) return null;

  const icons = {
    water: <Droplets className="text-blue-500" size={32} />,
    fertilize: <AlertCircle className="text-purple-500" size={32} />,
    delete: <AlertCircle className="text-red-500" size={32} />
  };

  const colors = {
    water: 'bg-blue-600 hover:bg-blue-700 shadow-blue-100',
    fertilize: 'bg-purple-600 hover:bg-purple-700 shadow-purple-100',
    delete: 'bg-red-600 hover:bg-red-700 shadow-red-100'
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative overflow-hidden"
        >
          <button 
            onClick={onCancel}
            className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center ${
              type === 'water' ? 'bg-blue-50' : type === 'fertilize' ? 'bg-purple-50' : 'bg-red-50'
            }`}>
              {icons[type]}
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 mb-8 leading-relaxed">
              {message}
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={onCancel}
                className="flex-1 py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 py-4 text-white rounded-2xl font-bold transition-all shadow-lg ${colors[type]}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
