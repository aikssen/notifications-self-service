import { Producer } from 'kafkajs';
import { KafkaProducerPort } from '@/application/ports/kafkaProducerPort';
import { MessageDispatchEvent } from '@/application/dto/messageDispatchEvent';

export class KafkaProducerAdapter implements KafkaProducerPort {
  constructor(
    private readonly producer: Producer,
    private readonly topic: string
  ) {}

  async publish(event: MessageDispatchEvent): Promise<void> {
    await this.producer.send({
      topic: this.topic,
      messages: [{ value: JSON.stringify(event) }],
    });
  }
}