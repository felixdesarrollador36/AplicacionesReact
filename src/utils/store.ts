import { create } from 'zustand';
import { Document } from '../types/index';

interface DocumentStore {
  documents: Document[];
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  removeDocument: (id: string) => void;
  clearDocuments: () => void;
}

// Store para gestionar estado de documentos (opcional, para expansión futura)
export const useDocumentStore = create<DocumentStore>((set) => ({
  documents: [],
  setDocuments: (documents) => set({ documents }),
  addDocument: (document) =>
    set((state) => ({
      documents: [document, ...state.documents],
    })),
  removeDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((doc) => doc.id !== id),
    })),
  clearDocuments: () => set({ documents: [] }),
}));
