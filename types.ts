export interface Reference {
  title: string;
  uri: string;
}

export interface ConversionResult {
  promql: string;
  explanation: string;
  confidence: 'High' | 'Medium' | 'Low';
  references?: Reference[];
}

export interface ConversionHistoryItem extends ConversionResult {
  id: string;
  mql: string;
  timestamp: number;
}

export interface ExampleItem {
  title: string;
  description: string;
  mql: string;
  promql: string;
  explanation: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}