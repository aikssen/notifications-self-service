import { DispatchSource } from '@/domain/value-objects/dispatchSource';

export interface MessageDispatchEvent {
  event_id: string;
  client_id: string;
  event_type: string;
  event_payload: Record<string, any>;
  dispatch_source: DispatchSource;
  timestamp: string;
}