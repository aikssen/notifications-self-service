import { MessageDispatchEvent } from '@/application/dto/messageDispatchEvent';

export interface KafkaProducerPort {
  publish(event: MessageDispatchEvent): Promise<void>;
}