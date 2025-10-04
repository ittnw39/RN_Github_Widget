declare module 'react-native-background-job' {
  export interface BackgroundJobOptions {
    jobKey: string;
    job: () => Promise<void>;
    timeout?: number;
    period?: number;
    persist?: boolean;
    override?: boolean;
    exactTime?: number;
    allowWhileIdle?: boolean;
    allowExecutionInForeground?: boolean;
    networkType?: number;
    requiresCharging?: boolean;
    requiresDeviceIdle?: boolean;
  }

  export default class BackgroundJob {
    static schedule(options: BackgroundJobOptions): void;
    static cancel(options: { jobKey: string }): void;
    static cancelAll(): void;
    static on(jobKey: string, callback: () => Promise<void>): void;
    static getAll(): Promise<Array<{ jobKey: string }>>;
  }
}
