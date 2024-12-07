import type { GameMessage } from "../types/game.js";
import type { RTCMessage } from "../types/rtc.js";

export class MockHuddleClient {
  private messages: GameMessage[] = [];
  private connected = false;
  private dead = false;

  constructor(private roomId: string, public playerId: string, private token: string) {}

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async sendMessage(message: Partial<GameMessage>): Promise<{ success: boolean; error?: string }> {
    if (!this.connected) return { success: false, error: "Not connected" };
    if (this.dead) return { success: false, error: "Player is dead" };

    const fullMessage: GameMessage = {
      id: `msg_${Date.now()}`,
      sender: this.playerId,
      timestamp: new Date(),
      ...message,
    } as GameMessage;

    const rtcMessage: RTCMessage = {
      type: "GAME_MESSAGE",
      data: fullMessage,
      roomId: this.roomId,
    };

    try {
      const response = await fetch("http://localhost:9999/rtc/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-huddle01-signature": "mock-signature", // In real client, this would be properly signed
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(rtcMessage),
      });

      const data = await response.json();
      if (data.success) {
        this.messages.push(fullMessage);
      }
      return data;
    } catch (error) {
      return { success: false, error: "Failed to send message" };
    }
  }

  receiveMessage(message: GameMessage): void {
    this.messages.push(message);
    if (message.type === "death" && message.metadata?.target === this.playerId) {
      this.dead = true;
    }
  }

  getMessages(): GameMessage[] {
    return this.messages;
  }

  getLastMessage(): GameMessage | undefined {
    return this.messages[this.messages.length - 1];
  }

  isDead(): boolean {
    return this.dead;
  }
}
