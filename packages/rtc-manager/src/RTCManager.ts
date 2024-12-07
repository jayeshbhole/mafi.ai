import { HuddleClient } from '@huddle01/server-sdk'

export class RTCManager {
  private client: HuddleClient;
  constructor(apiKey: string) {
    this.client = new HuddleClient({
      apiKey: apiKey,
    });
  }

  async createRoom(title: string) {
    try {
      const room = await this.client.createRoom({
        title,
        roomLock: false,
      });
      return room;
    } catch (error) {
      console.error("Failed to create room:", error);
      throw error;
    }
  }

  async joinRoom(roomId: string, peerId: string) {
    try {
      const token = await this.client.getJoinToken({
        roomId,
        peerId
      });
      return token;
    } catch (error) {
      console.error("Failed to join room:", error);
      throw error;
    }
  }
} 