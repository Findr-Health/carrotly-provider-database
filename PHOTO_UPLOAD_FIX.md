import React, { useState } from 'react';
import { Button } from '../common';
import { Camera, X, Upload, AlertCircle } from 'lucide-react';

interface StepPhotosProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export const StepPhotos: React.FC<StepPhotosProps> = ({ data, onNext, onBack }) => {
  const [photos, setPhotos] = useState<string[]>(data.photos?.gallery || []);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processFiles(Array.from(files));
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const maxWidth = 800;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressed = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressed);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFiles = async (files: File[]) => {
    setError('');
    
    const remainingSlots = 5 - photos.length;
    const filesToProcess = files.slice(0, remainingSlots);
    
    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload only image files (JPG, PNG, etc.)');
        continue;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setError('Image too large. Please use images under 10MB.');
        continue;
      }
      
      try {
        const compressed = await compressImage(file);
        
        const sizeInBytes = (compressed.length * 3) / 4;
        if (sizeInBytes > 500 * 1024) {
          console.warn('Compressed image still large:', sizeInBytes / 1024, 'KB');
        }
        
        setPhotos(prev => [...prev, compressed]);
      } catch (err) {
        console.error('Error processing image:', err);
        setError('Failed to process image. Please try a different photo.');
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setError('');
  };

  const handleNext = () => {
    if (photos.length === 0) {
      setError('Please upload at least one photo to continue');
      return;
    }
    
    try {
      const photoData = { 
        photos: { 
          primary: photos[0], 
          gallery: photos 
        } 
      };
      
      const testString = JSON.stringify(photoData);
      if (testString.length > 4 * 1024 * 1024) {
        setError('Photos are too large. Please use smaller images or fewer photos.');
        return;
      }
      
      onNext(photoData);
    } catch (err) {
      console.error('Error saving photos:', err);
      setError('Failed to save photos. Please try using smaller images or fewer photos.');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Step 3 of 5: Photos</h2>
      
      <p className="text-gray-600 mb-6">
        Add photos of your practice or office. At least 1 photo required, up to 5 total.
      </p>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}
      
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${photos.length >= 5 ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          type="file"
          id="photo-upload"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={photos.length >= 5}
        />
        
        <label 
          htmlFor="photo-upload" 
          className="cursor-pointer"
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-lg font-medium text-gray-700 mb-1">
            Drop photos here or click to browse
          </p>
          <p className="text-sm text-gray-500">
            JPG, PNG up to 10MB • {photos.length}/5 photos uploaded
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Photos will be automatically compressed for faster loading
          </p>
        </label>
      </div>
      
      {photos.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium mb-3">Your Photos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={photo}
                  alt={`Photo ${idx + 1}`}
                  className="w-full h-40 object-cover rounded-lg border-2 border-gray-200"
                />
                {idx === 0 && (
                  <div className="absolute top-2 left-2 bg-primary-500 text-white text-xs px-2 py-1 rounded font-medium">
                    Primary Photo
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          {photos.length > 0 && (
            <p className="text-sm text-gray-600 mt-3 flex items-center">
              <Camera className="w-4 h-4 mr-2" />
              The first photo will be your primary photo shown to patients
            </p>
          )}
        </div>
      )}
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Upload clear, well-lit photos of your office, waiting room, or treatment areas. 
          Photos are automatically compressed to ensure fast loading times.
        </p>
      </div>
      
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button 
          variant="primary" 
          onClick={handleNext}
          disabled={photos.length === 0}
        >
          {photos.length > 0 ? 'Continue to Services →' : 'Add at least 1 photo to continue'}
        </Button>
      </div>
    </div>
  );
};