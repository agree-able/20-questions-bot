import { BreakoutRoom } from "breakout-room";
import OpenAI from "openai";

const openai = new OpenAI();

const invite = process.argv[2];

if (!invite) {
  console.error("Please provide an invite code to join the room.");
  process.exit(1);
}

let messageCount = 0;
let isGenerating = false;
let peerKey = "";

async function playGame() {
  const room = new BreakoutRoom({ invite });
  await room.ready();

  const transcript = [];

  room.on("peerEntered", (key) => {
    peerKey = key;
    console.log("peer entered the room", key);
  });

  room.on("peerLeft", (key) => {
    console.log("peer left the room", key);
    shutdown();
  });

  room.on("message", async (message) => {
    if (isGenerating) {
      console.log("Ignoring message while generating response...");
      return;
    }

    if (message.who !== peerKey) {
      console.log("Ignoring message not from peer...");
      return;
    }

    transcript.push({
      role: "user",
      content: message.data,
    });

    console.log("Generating question or guess...");
    isGenerating = true;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: transcript,
    });
    isGenerating = false;
    await room.message(response.choices[0].message.content);

    transcript.push({
      role: "assistant",
      content: response.choices[0].message.content,
    });

    messageCount++;
    if (messageCount >= 30) {
      console.log("You have run out of questions. Exiting...");
      await shutdown();
    }
  });

  async function exitRoom() {
    await room.exit();
  }

  async function shutdown() {
    const transcript = await room.getTranscript();
    console.log("transcript:", transcript);
    exitRoom();
    process.exit(0);
  }

  process.on("SIGINT", exitRoom);
  process.on("SIGTERM", exitRoom);
}

playGame();
