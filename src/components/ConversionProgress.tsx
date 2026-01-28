import * as React from 'react';
import { Loader2 } from 'lucide-react';

interface ConversionProgressProps {
  isVisible: boolean;
  progress: number;
}

export const ConversionProgress: React.FC<ConversionProgressProps> = ({ isVisible, progress }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-96">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <h3 className="text-lg font-semibold">Converting to MP4...</h3>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          
          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Please wait while your recording is being converted to MP4 format...
          </p>
        </div>
      </div>
    </div>
  );
};
