
import React, { useState, useCallback } from 'react';
import { Outfit } from './types';
import { generateOutfitIdeas, generateOutfitImage, editOutfitImage } from './services/geminiService';
import FileUpload from './components/FileUpload';
import OutfitCard from './components/OutfitCard';
import Spinner from './components/Spinner';

const App: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [initialImageURL, setInitialImageURL] = useState<string | null>(null);

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = useCallback(async (file: File) => {
    setUploadedFile(file);
    setIsLoading(true);
    setError(null);
    setOutfits([]);
    const imageUrl = await fileToDataUrl(file);
    setInitialImageURL(imageUrl);

    try {
      const outfitDescriptions = await generateOutfitIdeas(file);
      
      const imageGenerationPromises = outfitDescriptions.map(async (desc) => {
          const imageData = await generateOutfitImage(desc.description);
          return {
              id: desc.category,
              category: desc.category,
              description: desc.description,
              imageUrl: `data:image/png;base64,${imageData.base64Image}`,
              mimeType: imageData.mimeType,
          };
      });

      const generatedOutfits = await Promise.all(imageGenerationPromises);
      setOutfits(generatedOutfits);

    } catch (err) {
      console.error(err);
      setError('Failed to generate outfit ideas. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleEdit = async (id: string, prompt: string) => {
    const outfitToEdit = outfits.find(o => o.id === id);
    if (!outfitToEdit || !outfitToEdit.imageUrl) return;

    setIsEditing(prev => ({ ...prev, [id]: true }));
    setError(null);

    try {
        const base64String = outfitToEdit.imageUrl.split(',')[1];
        const newImageData = await editOutfitImage(base64String, outfitToEdit.mimeType, prompt);
        
        setOutfits(prevOutfits => prevOutfits.map(o => 
            o.id === id 
            ? { ...o, imageUrl: `data:image/png;base64,${newImageData.base64Image}`, mimeType: newImageData.mimeType }
            : o
        ));

    } catch (err) {
      console.error(err);
      setError(`Failed to edit the ${id} outfit. Please try another prompt.`);
    } finally {
      setIsEditing(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleReset = () => {
    setUploadedFile(null);
    setOutfits([]);
    setError(null);
    setIsLoading(false);
    setInitialImageURL(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <main className="container mx-auto p-4 md:p-8">
        <header className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">Virtual Stylist AI</h1>
            <p className="text-lg text-gray-600 mt-2">Never wonder what to wear again.</p>
        </header>

        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative my-4" role="alert">
                <strong className="font-bold">Oops! </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}

        {!uploadedFile ? (
            <FileUpload onImageUpload={handleImageUpload} />
        ) : (
            <div className="flex flex-col items-center">
                <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-white shadow-sm w-full max-w-md text-center">
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Your Item</h2>
                    <img src={initialImageURL || ''} alt="Uploaded clothing item" className="mx-auto rounded-lg max-h-64" />
                    <button onClick={handleReset} className="mt-4 w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200">
                      Try a Different Item
                    </button>
                </div>
            </div>
        )}

        {isLoading && (
            <div className="text-center">
                <Spinner />
                <p className="text-gray-600 mt-4 animate-pulse">Styling your outfits... This may take a moment.</p>
            </div>
        )}

        {outfits.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {outfits.map(outfit => (
              <OutfitCard 
                key={outfit.id} 
                outfit={outfit}
                isEditing={isEditing[outfit.id] || false}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
