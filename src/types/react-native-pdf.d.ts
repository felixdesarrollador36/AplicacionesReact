declare module 'react-native-pdf' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';

  export interface PDFProps extends ViewProps {
    source: { uri: string } | { base64: string };
    page?: number;
    scale?: number;
    minScale?: number;
    maxScale?: number;
    horizontal?: boolean;
    onLoadComplete?: (numberOfPages: number) => void;
    onError?: (error: any) => void;
    onPageChanged?: (page: number, total: number) => void;
    activityIndicator?: React.ReactElement;
    spacing?: number;
    fitWidth?: boolean;
    fitHeight?: boolean;
    enableAnnotationRendering?: boolean;
    enableRTL?: boolean;
  }

  export default class PDF extends Component<PDFProps> {}
}
