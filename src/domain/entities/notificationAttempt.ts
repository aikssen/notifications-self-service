export class NotificationAttempt {

  constructor(
    public readonly attemptNumber: number,
    public readonly dispatchSource: string,
    public readonly status: string,
    public readonly webhookUrl: string,
    public readonly requestMethod: string,
    public readonly requestPayload: object,
    public readonly responseStatus: number | null,
    public readonly responseBody: any | null,
    public readonly errorMessage: string | null,
    public readonly attemptedAt: Date
  ) { }
}


