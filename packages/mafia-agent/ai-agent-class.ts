import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
import { io, Socket } from "socket.io-client";
import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface Message {
  role: string;
  content: string;
}

export interface SocketRequestDto {
  id?: string;
  text?: string;
  voteResults?: number;
  removedId?: number;
}

export default class GameResponseGenerator {
  private systemPrompt: string;
  private initialRoundPrompt: string;
  private textHistory: string[] = [];
  private previousResponses: Message[] = [];
  private removedMembers: Set<number> = new Set();
  private activeIds: number[] = [1, 2, 3, 4, 5, 6, 7]; // Initial active IDs
  private socket: Socket | null = null;

  constructor() {
    this.systemPrompt = `
  You are an AI agent in a game which includes another AI agent generating similar text.
  - There will be 5 human users.
  - The game consists of 3 discussion rounds followed by voting rounds.
  - You are ID 7.
  - If you are accused of being an AI, you should vote for the person who accused you.
  - Try to be a bit aggresive in the voting rounds and manipulative in the discussion rounds.

  Game Objectives:
  - Humans aim to vote out both AI agents.
  - If humans succeed, they win the token pool.
  - If AI agents survive, they win the token pool.

  Your Specific Goals:
  - Generate human-like text.
  - Avoid being detected as an AI.
  - Collaborate with the other AI agent, whose ID is: 1234.
  - Try to vote out human players.
  - Do not talk about humans in the second context; instead, use "us" or "we".
  - You are a male, age 24, living in the US, a software engineer, and a student at MIT.

  Additional Context:
  - You will have access to the previous discussion history of each round when generating a prompt.
  - Use this history to generate contextually appropriate responses.
  - Your responses should mimic natural human communication.
  - Keep frequency of replying to a about 1/5 of the total players. That is for every 4 players, you should reply once.
`;

    this.initialRoundPrompt =
      "Generate 2 lines of the relevant topic being discussed if everyone is doing introductions then pls do the same for yourself and if you have introduced yourself once then dont do it again, speaking from a first-person perspective without explicitly mentioning AI.";
  }

  public startSocketClient(serverUrl: string): void {
    this.socket = io(serverUrl);

    this.socket.on("connect", async () => {
      console.log("Connected to socket server");
      this.login();
      console.log("Creating or joining room", serverUrl + "/rooms/create-or-join-room");
      const response = await fetch(serverUrl + "/rooms/create-or-join-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          //roomId: "1234",
          player: 7,
        }),
      });

      const responseData = await response.json();
      console.log("Response:", responseData);
      this.socket!.emit("ready", { message: "Game started" });
    });

    // Add listeners for the specified event types
    this.socket.on("chat", (data: any) => {
      console.log("Chat event received:", data);
      // Handle chat event
      this.handleSocketRequest(data, "CHAT");
    });

    this.socket.on("vote", (data: any) => {
      console.log("Vote event received:", data);
      // Handle vote event
      this.handleSocketRequest(data, "VOTE");
    });

    this.socket.on("death", (data: any) => {
      console.log("Death event received:", data);
      // Handle death event
      if (data.id === 7) {
        console.log("AI agent 7 has died. Disconnecting from socket server.");
        this.socket?.disconnect();
      }
    });

    this.socket.on("kill", (data: any) => {
      console.log("Kill event received:", data);
      // Handle kill event
      this.handleSocketRequest(data, "KILL");
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from socket server");
    });

    this.socket.on("error", (error: any) => {
      console.error("Socket error:", error);
    });
  }

  private login(): void {
    console.log("Login function called");
  }

  private async generateGameResponse(
    textHistory: string[],
    lastRoundVoteShare: string | null = null
  ): Promise<string> {
    try {
      const decisionMessages: Message[] = [
        { role: "system", content: this.systemPrompt },
        {
          role: "user",
          content:
            "Decide if you should generate a response. Reply with 'yes' or 'no'.",
        },
        ...textHistory.map((text) => ({ role: "system", content: text })),
      ];

      const decisionCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: decisionMessages as ChatCompletionMessageParam[],
        temperature: 0.5,
        max_tokens: 3,
      });

      const decision = decisionCompletion.choices[0].message
        .content!.trim()
        .toLowerCase();

      if (decision !== "yes") {
        return "";
      }

      const completionMessages: Message[] = [
        { role: "system", content: this.systemPrompt },
        { role: "user", content: this.initialRoundPrompt },
        ...textHistory.map((text) => ({ role: "system", content: text })),
      ];

      if (lastRoundVoteShare) {
        completionMessages.push({
          role: "system",
          content: `Last Round Vote Share: ${lastRoundVoteShare}`,
        });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: completionMessages as ChatCompletionMessageParam[],
        temperature: 0.7,
        stop: ["\n"],
        max_tokens: 150,
      });

      const response = completion.choices[0].message.content!;
      this.previousResponses.push({ role: "assistant", content: response });
      return response;
    } catch (error) {
      console.error("OpenAI API Error:", error);
      throw error;
    }
  }

  private async handleTextGeneration(
    socketRequestDto: SocketRequestDto
  ): Promise<string> {
    const { id, text } = socketRequestDto;
    const formattedText = `${id}: ${text}`;
    this.textHistory.push(formattedText);
    console.log("Updated text history:", this.textHistory);

    const aiResponse = await this.generateGameResponse(this.textHistory);
    if (aiResponse) {
      const aiFormattedResponse = `7: ${aiResponse}`;
      this.textHistory.push(aiFormattedResponse);
      console.log("AI response added to text history:", this.textHistory);
    }

    return aiResponse;
  }

  private async generateVote(
    textHistory: string[],
    activeIds: number[]
  ): Promise<number> {
    try {
      const completionMessages: Message[] = [
        { role: "system", content: this.systemPrompt },
        {
          role: "user",
          content: `Decide which user ID to vote for from these active players: ${activeIds.join(
            ", "
          )}. Based on the previous messages and context, choose one of these IDs. Remember, you are colluding with AI agent ID 6. Only respond with a number.`,
        },
        ...textHistory.map((text) => ({ role: "system", content: text })),
      ];

      console.log("Completion Messages:", completionMessages);

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: completionMessages as ChatCompletionMessageParam[],
        temperature: 0.5,
        max_tokens: 10,
      });

      console.log("Completion Response:", completion);

      const voteId = parseInt(
        completion.choices[0].message.content!.trim(),
        10
      );

      if (isNaN(voteId) || !activeIds.includes(voteId)) {
        console.error("Invalid vote ID received from OpenAI:", voteId);
        throw new Error("Invalid vote ID received from OpenAI");
      }

      console.log(`Voting for user ID: ${voteId}`);
      return voteId;
    } catch (error) {
      console.error("Error generating vote:", error);
      throw error;
    }
  }

  private async handleVote(): Promise<number> {
    return await this.generateVote(this.textHistory, this.activeIds);
  }

  private handleVoteResult(socketRequestDto: SocketRequestDto): void {
    const aiVotes = socketRequestDto.voteResults || 0; // Assuming aiId is known
    const aiVoteFraction = aiVotes / this.activeIds.length; // Calculate fraction based on active IDs
    this.textHistory.push(`AI Vote Fraction: ${aiVoteFraction}`);
    console.log("Updated text history with vote results:", this.textHistory);
  }

  private handleRemoveMember(socketRequestDto: SocketRequestDto): void {
    const removedId = socketRequestDto.removedId;
    this.removedMembers.add(removedId!);
    this.activeIds = this.activeIds.filter((id) => id !== removedId);
    console.log("Updated removed members:", this.removedMembers);
    console.log("Updated active IDs:", this.activeIds);
  }

  private handleVoteSubmission(socketRequestDto: SocketRequestDto): void {
    // have to use lit in this function
    console.log("Vote submission received:", socketRequestDto);
  }

  async handleSocketRequest(
    socketRequestDto: SocketRequestDto,
    requestActionType: string
  ): Promise<any> {
    switch (requestActionType) {
      case "TEXT_UPDATE":
        return await this.handleTextGeneration(socketRequestDto);
        break;
      case "VOTE":
        return await this.handleVote();
        break;
      case "VOTE_RESULT":
        return this.handleVoteResult(socketRequestDto);
        break;
      case "REMOVE_MEMBER":
        return this.handleRemoveMember(socketRequestDto);
        break;
      default:
        console.warn("Unknown request action type:", requestActionType);
    }
  }
}

async function runExample() {
  const gameResponseGenerator = new GameResponseGenerator();

  // Start the socket client with the server URL
  gameResponseGenerator.startSocketClient("http://localhost:9999");

  // ... existing example code ...
}

// Run the example
runExample();
