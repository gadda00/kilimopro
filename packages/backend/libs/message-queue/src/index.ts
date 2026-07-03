/**
 * KilimoPRO Message Queue Client
 * NATS-based message queue for event-driven architecture
 */

import { connect, NatsConnection, JetStreamClient, JetStreamOptions, ConsumerConfig } from 'nats';
import { Logger, getLogger } from '@kilimopro/logger';
import { BaseEvent, EventType } from '@kilimopro/shared-types';

// Message queue options
export interface MessageQueueOptions {
  servers?: string | string[];
  token?: string;
  user?: string;
  pass?: string;
  timeout?: number;
  reconnect?: boolean;
  maxReconnects?: number;
  reconnectTimeWait?: number;
}

// Message interface
export interface Message<T = any> {
  subject: string;
  data: T;
  headers?: Record<string, string>;
  replyTo?: string;
}

// Subscription interface
export interface Subscription {
  subject: string;
  queue?: string;
  callback: (message: Message) => Promise<void>;
  options?: ConsumerConfig;
}

// Message queue statistics
export interface MessageQueueStats {
  messagesPublished: number;
  messagesConsumed: number;
  errors: number;
  connections: number;
  subscriptions: number;
}

// Message queue client interface
export interface MessageQueueClient {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Publishing
  publish<T>(subject: string, data: T, headers?: Record<string, string>): Promise<void>;
  publishEvent(event: BaseEvent): Promise<void>;
  request<T>(subject: string, data: any, timeout?: number): Promise<T>;
  
  // Subscribing
  subscribe(subscription: Subscription): Promise<void>;
  subscribeEvent<T extends BaseEvent>(eventType: EventType, callback: (event: T) => Promise<void>): Promise<void>;
  unsubscribe(subject: string): Promise<void>;
  
  // JetStream (for persistence)
  jetstream(): JetStreamClient | undefined;
  createStream(name: string, subjects: string[]): Promise<void>;
  addConsumer(stream: string, consumerConfig: ConsumerConfig): Promise<void>;
  
  // Statistics
  getStats(): Promise<MessageQueueStats>;
  resetStats(): void;
  
  // Health check
  healthCheck(): Promise<boolean>;
}

// Main message queue client class
export class KilimoMessageQueue implements MessageQueueClient {
  private natsConnection?: NatsConnection;
  private jetstreamClient?: JetStreamClient;
  private logger: Logger;
  private options: Required<MessageQueueOptions>;
  
  // Statistics
  private stats: MessageQueueStats = {
    messagesPublished: 0,
    messagesConsumed: 0,
    errors: 0,
    connections: 0,
    subscriptions: 0,
  };

  // Subscriptions
  private subscriptions: Map<string, { callback: (msg: Message) => Promise<void>; subscription: any }> = new Map();

  constructor(serviceName: string, options: MessageQueueOptions = {}) {
    this.logger = getLogger(serviceName);
    
    this.options = {
      servers: options.servers || process.env.NATS_SERVERS || 'nats://localhost:4222',
      token: options.token || process.env.NATS_TOKEN,
      user: options.user || process.env.NATS_USER,
      pass: options.pass || process.env.NATS_PASS,
      timeout: options.timeout || 5000,
      reconnect: options.reconnect !== undefined ? options.reconnect : true,
      maxReconnects: options.maxReconnects || 10,
      reconnectTimeWait: options.reconnectTimeWait || 1000,
    };
  }

  private async createConnection(): Promise<NatsConnection> {
    const connectionOptions: any = {
      servers: this.options.servers,
      timeout: this.options.timeout,
      reconnect: this.options.reconnect,
      maxReconnects: this.options.maxReconnects,
      reconnectTimeWait: this.options.reconnectTimeWait,
    };

    if (this.options.token) {
      connectionOptions.token = this.options.token;
    } else if (this.options.user && this.options.pass) {
      connectionOptions.user = this.options.user;
      connectionOptions.pass = this.options.pass;
    }

    const nc = await connect(connectionOptions);
    
    // Set up error handlers
    nc.on('error', (error) => {
      this.stats.errors++;
      this.logger.error('NATS error', { error: error as Error });
    });

    nc.on('close', () => {
      this.logger.info('NATS connection closed');
    });

    nc.on('reconnect', () => {
      this.logger.info('NATS reconnected');
    });

    nc.on('disconnect', () => {
      this.logger.warn('NATS disconnected');
    });

    return nc;
  }

  async connect(): Promise<void> {
    try {
      this.natsConnection = await this.createConnection();
      this.jetstreamClient = this.natsConnection.jetstream();
      this.stats.connections++;
      this.logger.info('NATS connected');
    } catch (error) {
      this.stats.errors++;
      this.logger.error('NATS connection failed', { error: error as Error });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.natsConnection) {
        await this.natsConnection.close();
        this.natsConnection = undefined;
        this.jetstreamClient = undefined;
        this.logger.info('NATS disconnected');
      }
    } catch (error) {
      this.stats.errors++;
      this.logger.error('NATS disconnection failed', { error: error as Error });
      throw error;
    }
  }

  isConnected(): boolean {
    return this.natsConnection?.isClosed() === false;
  }

  async publish<T>(subject: string, data: T, headers: Record<string, string> = {}): Promise<void> {
    if (!this.natsConnection) {
      throw new Error('NATS connection not established');
    }

    try {
      const message = {
        subject,
        data,
        headers,
      };
      
      await this.natsConnection.publish(subject, JSON.stringify(data), {
        headers,
      });
      
      this.stats.messagesPublished++;
      this.logger.debug(`Published message to ${subject}`, { subject, data: JSON.stringify(data).substring(0, 100) });
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Publish failed', { subject, error: error as Error });
      throw error;
    }
  }

  async publishEvent(event: BaseEvent): Promise<void> {
    await this.publish<BaseEvent>(event.type, event);
  }

  async request<T>(subject: string, data: any, timeout: number = 5000): Promise<T> {
    if (!this.natsConnection) {
      throw new Error('NATS connection not established');
    }

    try {
      const response = await this.natsConnection.request(subject, JSON.stringify(data), {
        timeout,
      });
      
      this.stats.messagesPublished++;
      this.stats.messagesConsumed++;
      
      return JSON.parse(response.data.toString()) as T;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Request failed', { subject, error: error as Error });
      throw error;
    }
  }

  async subscribe({ subject, queue, callback, options }: Subscription): Promise<void> {
    if (!this.natsConnection) {
      throw new Error('NATS connection not established');
    }

    try {
      const subscription = this.natsConnection.subscribe(subject, { queue });
      
      (async () => {
        for await (const msg of subscription) {
          try {
            const data = JSON.parse(msg.data.toString());
            const message: Message = {
              subject: msg.subject,
              data,
              headers: msg.headers as Record<string, string>,
              replyTo: msg.reply,
            };
            
            await callback(message);
            this.stats.messagesConsumed++;
            
            if (msg.reply) {
              await msg.respond(JSON.stringify({ success: true }));
            }
          } catch (error) {
            this.stats.errors++;
            this.logger.error('Message processing failed', { 
              subject: msg.subject, 
              error: error as Error 
            });
          }
        }
      })();

      this.subscriptions.set(subject, { callback, subscription });
      this.stats.subscriptions++;
      this.logger.info(`Subscribed to ${subject}`, { queue });
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Subscribe failed', { subject, error: error as Error });
      throw error;
    }
  }

  async subscribeEvent<T extends BaseEvent>(eventType: EventType, callback: (event: T) => Promise<void>): Promise<void> {
    await this.subscribe({
      subject: eventType,
      callback: async (message) => {
        await callback(message.data as T);
      },
    });
  }

  async unsubscribe(subject: string): Promise<void> {
    const subscription = this.subscriptions.get(subject);
    
    if (subscription) {
      try {
        await subscription.subscription.unsubscribe();
        this.subscriptions.delete(subject);
        this.stats.subscriptions--;
        this.logger.info(`Unsubscribed from ${subject}`);
      } catch (error) {
        this.stats.errors++;
        this.logger.error('Unsubscribe failed', { subject, error: error as Error });
        throw error;
      }
    }
  }

  jetstream(): JetStreamClient | undefined {
    return this.jetstreamClient;
  }

  async createStream(name: string, subjects: string[]): Promise<void> {
    if (!this.jetstreamClient) {
      throw new Error('JetStream not available');
    }

    try {
      await this.jetstreamClient.addStream({
        name,
        subjects,
        retention: 'limits',
        max_msgs: 100000,
        max_bytes: 100 * 1024 * 1024, // 100MB
        max_age: 60 * 60 * 24 * 7, // 7 days
      });
      
      this.logger.info(`Created stream ${name}`, { subjects });
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Create stream failed', { name, error: error as Error });
      throw error;
    }
  }

  async addConsumer(stream: string, consumerConfig: ConsumerConfig): Promise<void> {
    if (!this.jetstreamClient) {
      throw new Error('JetStream not available');
    }

    try {
      await this.jetstreamClient.addConsumer(stream, consumerConfig);
      this.logger.info(`Added consumer to stream ${stream}`, { consumer: consumerConfig.name });
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Add consumer failed', { stream, error: error as Error });
      throw error;
    }
  }

  getStats(): Promise<MessageQueueStats> {
    return Promise.resolve({ ...this.stats });
  }

  resetStats(): void {
    this.stats = {
      messagesPublished: 0,
      messagesConsumed: 0,
      errors: 0,
      connections: 0,
      subscriptions: 0,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.natsConnection) {
        await this.connect();
      }
      return this.isConnected();
    } catch (error) {
      this.logger.error('Message queue health check failed', { error: error as Error });
      return false;
    }
  }

  // Static method to create a client
  static create(serviceName: string, options?: MessageQueueOptions): MessageQueueClient {
    return new KilimoMessageQueue(serviceName, options);
  }
}

// Global message queue client instance
let globalMessageQueueClient: MessageQueueClient | null = null;

// Get or create global message queue client
export function getMessageQueueClient(serviceName: string): MessageQueueClient {
  if (!globalMessageQueueClient) {
    globalMessageQueueClient = KilimoMessageQueue.create(serviceName, {
      servers: process.env.NATS_SERVERS,
      token: process.env.NATS_TOKEN,
      user: process.env.NATS_USER,
      pass: process.env.NATS_PASS,
    });
  }
  return globalMessageQueueClient;
}

// Reset global message queue client (useful for testing)
export function resetMessageQueueClient(): void {
  globalMessageQueueClient = null;
}

export { KilimoMessageQueue as MessageQueueClient };
