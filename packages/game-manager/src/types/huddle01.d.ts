declare module "@huddle01/server-sdk/auth" {
  export class AccessToken {
    constructor(config: {
      apiKey: string;
      roomId: string;
      role: Role;
      permissions: {
        admin: boolean;
        canConsume: boolean;
        canProduce: boolean;
        canProduceSources: {
          cam: boolean;
          mic: boolean;
          screen: boolean;
        };
        canRecvData: boolean;
        canSendData: boolean;
        canUpdateMetadata: boolean;
      };
      options?: {
        metadata?: Record<string, any>;
      };
    });
    async toJwt(): Promise<string>;
  }

  export enum Role {
    HOST = "HOST",
    CO_HOST = "CO_HOST",
    GUEST = "GUEST",
    LISTENER = "LISTENER",
  }
}

declare module "@huddle01/server-sdk/api" {
  export class API {
    constructor(data: { apiKey: string });
    createRoom(data?: { metadata?: Record<string>; roomLocked?: boolean }): Promise<{
      message: string;
      roomId: string;
    }>;
    sendData(data: {
      roomId: string;
      payload: {
        type: string;
        data: any;
      };
    }): Promise<{
      success: boolean;
    }>;
  }
}

declare module "@huddle01/server-sdk/webhooks" {
  export class WebhookReceiver {
    constructor(config: { apiKey: string });
    verifySignature(signature: string, body: string): boolean;
  }
}

// declare module "@huddle01/web-core" {
//   export class HuddleClient {
//     constructor(config: {
//       projectId: string;
//       options?: {
//         activeSpeakers?: {
//           size?: number;
//         };
//       };
//     });

//     joinRoom(params: { roomId: string; token: string }): Promise<Room>;
//     leaveRoom(): Promise<void>;
//     sendData(params: { to: string; payload: any; type: string }): Promise<void>;
//     on(event: string, callback: (data: any) => void): void;
//     getPeers(): string[];
//   }

//   export namespace HuddleTypes {
//     interface DataMessage {
//       type: string;
//       payload: any;
//       from?: string;
//       to?: string;
//     }
//   }
// }
