import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useSettingsStore } from '../store/recording';

interface AudioSetupProps {
  onComplete: () => void;
}

export const AudioSetup: React.FC<AudioSetupProps> = ({ onComplete }: AudioSetupProps) => {
  const { settings, setSetting } = useSettingsStore();
  const [devices, setDevices] = useState<{ id: string; label: string; kind: string }[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(settings.defaultOutputPath || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(75);
  const [isLoadingDevices, setIsLoadingDevices] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const loadDevices = async () => {
      setIsLoadingDevices(true);
      setError(null);
      try {
        // Primero, solicitamos permisos de audio
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Obtenemos dispositivos de audio disponibles
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = allDevices.filter(device => device.kind === 'audioinput');
        
        if (audioInputs.length === 0) {
          setDevices([
            { id: 'default', label: 'Default Microphone', kind: 'audioinput' }
          ]);
        } else {
          setDevices(audioInputs.map(device => ({
            id: device.deviceId,
            label: device.label || 'Unknown Microphone',
            kind: device.kind,
          })));
          if (audioInputs.length > 0) {
            setSelectedDeviceId(audioInputs[0].deviceId);
          }
        }
        
        // Limpiar el stream temporal
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to access audio devices';
        setError(errorMsg);
        setDevices([
          { id: 'default', label: 'Default Microphone', kind: 'audioinput' }
        ]);
        setSelectedDeviceId('default');
      } finally {
        setIsLoadingDevices(false);
      }
    };

    loadDevices();

    return () => {
      // Cleanup
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleTestMicrophone = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      // Obtener stream del micrófono seleccionado
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined }
      });

      micStreamRef.current = stream;

      // Crear contexto de audio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Crear analizador para medir el volumen
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      
      analyserRef.current = analyser;

      // Medir el nivel de volumen
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let maxVolume = 0;
      const measureVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        maxVolume = Math.max(maxVolume, average);
        setVolumeLevel(Math.min(100, Math.round((maxVolume / 255) * 100)));
      };

      // Medir durante 2 segundos
      const measureInterval = setInterval(measureVolume, 50);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      clearInterval(measureInterval);

      // Si detectamos volumen, el micrófono funciona
      const result = maxVolume > 5;
      setTestResult(result);

      // Limpiar
      stream.getTracks().forEach(track => track.stop());
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Microphone test failed';
      setError(errorMsg);
      setTestResult(false);
      
      // Limpiar en caso de error
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleComplete = () => {
    if (selectedDeviceId) {
      setSetting('defaultOutputPath', selectedDeviceId);
    }
    onComplete();
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold mb-1">Audio Setup</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Configure your microphone and audio settings</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">Error</p>
            <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Microphone Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Select Microphone</label>
        {isLoadingDevices ? (
          <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Loader className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading audio devices...</span>
          </div>
        ) : devices.length > 0 ? (
          <select
            value={selectedDeviceId}
            onChange={(e) => {
              setSelectedDeviceId(e.target.value);
              setTestResult(null);
              setVolumeLevel(0);
              setError(null);
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.label || 'Microphone'}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            No microphone devices found. Please connect a microphone.
          </p>
        )}
      </div>

      {/* Test Button */}
      <div>
        <button
          onClick={handleTestMicrophone}
          disabled={isTesting || devices.length === 0 || isLoadingDevices}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors w-full justify-center"
        >
          {isTesting ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Testing Microphone...
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              Test Microphone
            </>
          )}
        </button>

        {testResult === true && (
          <p className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircle className="w-4 h-4" />
            Microphone is working correctly!
          </p>
        )}
        {testResult === false && (
          <p className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            Microphone test failed. Please check your device.
          </p>
        )}
      </div>

      {/* Volume Indicator */}
      <div>
        <label className="block text-sm font-medium mb-2">Microphone Volume Level</label>
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <Volume2 className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-200"
                style={{ width: `${volumeLevel}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{volumeLevel}%</p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          💡 Tip: Click "Test Microphone" to check if your audio device is working. The volume level will show the input strength.
        </p>
      </div>

      {/* Continue Button */}
      <button
        onClick={handleComplete}
        className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
      >
        Continue
      </button>
    </div>
  );
};
