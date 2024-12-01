import { BreakoutRoom } from "@agree-able/room";
import OpenAI from "openai";

const openai = new OpenAI();

async function getResponse(messages) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
  });
  return response.choices[0].message.content;
}

function roomPrint(room, message) {
  console.log(`${room.getRoomInfo().roomId}: ${message}`);
}

async function playGame(room) {
  await room.ready();

  /** @type {import("openai/resources").ChatCompletionCreateParamsNonStreaming["messages"]} */
  const messages = [
    {
      role: "system",
      content: `You are playing 20 questions as the guesser. Ask yes and no questions learning from the previous answers. start general and work to specfic.`,
    },
    {
      role: "assistant",
      content:
        "Welcome to 20 Questions! I've thought of an object. Ask me yes/no questions to guess what it is. \n You have 20 questions left.",
    },
  ];

  room.on("message", async (message) => {
    const answer = message.data;
    roomPrint(room, `Host answered: ${answer}`);

    messages.push({ role: "user", content: answer });
    const question = await getResponse(messages);
    messages.push({ role: "assistant", content: question });

    return await room.message(question);
  });

  room.on("peerLeft", (key) => {
    roomPrint(room, `Peer left the room: ${key}`);
    setTimeout(gameOver, 1000);
  });

  async function exitRoom() {
    await room.exit();
  }

  async function gameOver() {
    roomPrint(room, `Game Over!`);
    await exitRoom();
  }
}

const invite = process.argv[2]
const room = new BreakoutRoom({ invite })
// room.installSIGHandlers() // handle shutdown signals
playGame(room)


