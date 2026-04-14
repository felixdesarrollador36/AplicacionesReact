import React, { useRef, useState } from 'react';
import { recognizeTextFromImage, parseOcrText } from './lib/ocrUtils';

export default function OcrCapture({ onResult }) {
  const fileInput = useRef();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  async function handleFile(e) {
    setError('');
    setPreview(null);
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    try {
      const text = await recognizeTextFromImage(file);
      const results = parseOcrText(text);
      if (!results.length) {
        setError('No se detectó monto o tipo (ingreso/gasto) en la imagen.');
      } else {
        onResult(results);
      }
    } catch (err) {
      setError('Error procesando la imagen.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="my-4 p-4 border rounded">
      <label className="block mb-2 font-semibold">Sube o toma una foto de un recibo o dato:</label>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInput}
        onChange={handleFile}
        className="mb-2"
      />
      {loading && <div>Procesando imagen...</div>}
      {preview && <img src={preview} alt="preview" className="max-h-40 my-2" />}
      {error && <div className="text-red-600">{error}</div>}
    </div>
  );
}
