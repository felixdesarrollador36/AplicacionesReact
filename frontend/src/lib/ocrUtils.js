// Utilidad para cargar Tesseract.js solo cuando se necesite
export async function recognizeTextFromImage(image) {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('spa');
  try {
    const {
      data: { text },
    } = await worker.recognize(image);
    return text;
  } finally {
    await worker.terminate();
  }
}

// Extrae todos los montos y su tipo (ingreso/gasto) según palabras clave por línea o encabezado
export function parseOcrText(text) {
  const results = [];
  const lines = text.split(/\r?\n/);
  let currentTipo = null;
  for (const line of lines) {
    const montoMatch = line.match(/([0-9]+[.,]?[0-9]*)/);
    const monto = montoMatch ? parseFloat(montoMatch[1].replace(',', '.')) : null;
    const lower = line.toLowerCase();
    // Detectar si la línea cambia el tipo actual
    if (lower.includes('ingreso') || lower.includes('entrada') || lower.includes('recibido')) {
      currentTipo = 'ingreso';
      continue; // Si la línea es solo encabezado, no buscar monto
    } else if (lower.includes('gasto') || lower.includes('salida') || lower.includes('pagado')) {
      currentTipo = 'gasto';
      continue;
    }
    if (monto !== null && currentTipo) {
      results.push({ monto, tipo: currentTipo, text: line });
    }
  }
  return results;
}
