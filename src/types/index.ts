export interface Document {
  id: string;
  name: string;
  path: string;
  type: 'pdf' | 'docx' | 'xlsx' | 'unknown';
  size: number;
  createdAt: Date;
  modifiedAt: Date;
  mimeType: string;
}

export interface NavigationParams {
  HomeStack: {
    HomeScreen: undefined;
  };
  DocumentViewerStack: {
    DocumentViewerScreen: {
      document: Document;
      documentUri: string;
    };
  };
}

export interface DocumentViewerProps {
  document: Document;
  documentUri: string;
}
