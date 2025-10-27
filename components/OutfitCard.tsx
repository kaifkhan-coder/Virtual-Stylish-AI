
import React, { useState } from 'react';
import { Outfit } from '../types';
import Spinner from './Spinner';

interface OutfitCardProps {
  outfit: Outfit;
  isEditing: boolean;
  onEdit: (id: string, prompt: string) => void;
}

const OutfitCard: React.FC<OutfitCardProps> = ({ outfit, isEditing, onEdit }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onEdit(outfit.id, prompt);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105 flex flex-col">
      <div className="relative">
        <img src={outfit.imageUrl} alt={`${outfit.category} outfit`} className="w-full h-80 object-cover" />
        {isEditing && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <Spinner />
            </div>
        )}
      </div>
      <div className="p-6 flex-grow flex flex-col">
        <h3 className="text-2xl font-bold text-gray-800">{outfit.category}</h3>
        <p className="mt-2 text-gray-600 flex-grow">{outfit.description}</p>
        
        <form onSubmit={handleSubmit} className="mt-6">
          <label htmlFor={`edit-prompt-${outfit.id}`} className="block text-sm font-medium text-gray-700 mb-1">
            Edit this look
          </label>
          <div className="flex gap-2">
            <input
              id={`edit-prompt-${outfit.id}`}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'add a gold necklace'"
              className="flex-grow block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              disabled={isEditing}
            />
            <button
              type="submit"
              disabled={isEditing || !prompt.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
            >
              Go
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OutfitCard;
