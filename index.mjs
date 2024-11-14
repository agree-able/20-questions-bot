import { BreakoutRoom, RoomManager } from "breakout-room";
import OpenAI from "openai";

const openai = new OpenAI();

async function generateObject() {
  const words = [
    "Animal",
    "Airplane",
    "Artist",
    "Balloon",
    "Banana",
    "Battery",
    "Blanket",
    "Book",
    "Bottle",
    "Car",
    "Castle",
    "Chair",
    "Cheese",
    "Chocolate",
    "Cloud",
    "Computer",
    "Desert",
    "Diamond",
    "Dinosaur",
    "Doctor",
    "Door",
    "Dragon",
    "Earth",
    "Elephant",
    "Flower",
    "Forest",
    "Fountain",
    "Guitar",
    "Hammer",
    "Helicopter",
    "Ice cream",
    "Island",
    "Jungle",
    "Key",
    "King",
    "Kitchen",
    "Lightbulb",
    "Mountain",
    "Museum",
    "Ocean",
    "Piano",
    "Planet",
    "Robot",
    "Rocket",
    "Statue",
    "Sun",
    "Train",
    "Tree",
    "Unicorn",
    "Volcano",
  ];

  const word = words[Math.floor(Math.random() * words.length)];
  console.log("Generated object:", word);
  return word;
}

async function getResponse(messages) {
  console.log("Generating answer...");
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
  const invite = await room.ready();
  let peerKey = "";

  roomPrint(room, `Invite your friend to play 20 Questions with you:  ${invite}`);

  let questionsLeft = 20;
  const object = await generateObject();
  /** @type {import("openai/resources").ChatCompletionCreateParamsNonStreaming["messages"]} */
  const messages = [
    {
      role: "system",
      content: `You are playing 20 questions. The object the user is trying to guess is ${object}.`,
    },
    {
      role: "assistant",
      content:
        "Welcome to 20 Questions! I've thought of an object. Ask me yes/no questions to guess what it is. \n You have 20 questions left.",
    },
  ];

  room.on("peerEntered", async (key) => {
    roomPrint(room, `Peer entered the room: ${key}`);
    peerKey = key;
    await room.message(
      `Welcome to 20 Questions! I've thought of an object. Ask me yes/no questions to guess what it is.\nYou have ${questionsLeft} questions left.`
    );
  });

  room.on("peerLeft", (key) => {
    roomPrint(room, `Peer left the room: ${key}`);
    gameOver();
  });


  room.on("message", async (message) => {
    const question = message.data;
    questionsLeft--;

    if (questionsLeft <= 0) {
      await room.message("You've used all your questions. The object was: " + object);
      return await gameOver();
    }

    if (question.toLowerCase() === "quit") {
      await room.message("You quit the game. The object was: " + object);
      return await gameOver();
    }

    if (question.toLowerCase().includes(object.toLowerCase())) {
      await room.message("You guessed the object! It was: " + object);
      return await gameOver();
    }

    messages.push({ role: "user", content: question });
    const answer = await getResponse(messages);
    messages.push({ role: "assistant", content: answer });
    messages.push({ role: "system", content: `User has ${questionsLeft} questions left.` });

    if (answer.toLowerCase().includes(object.toLowerCase())) {
      await room.message(`The object has been revealed!`);
      return await gameOver();
    }

    return await room.message(answer);
  });

  async function exitRoom() {
    await room.exit();
  }

  async function gameOver() {
    roomPrint(room, `Game Over! The object was: ${object}`);
    // const transcript = await room.getTranscript();
    // console.log("transcript:", transcript);
    await exitRoom();
  }
}

const roomManager = new RoomManager()
let closingDown = false
const cleanup = async () => {
  closingDown = true
  await roomManager.cleanup()
  process.exit(0)
}
process.on("SIGINT", cleanup)
process.on("SIGTERM", cleanup)

const rooms = {}

const spawnRoom = () => {
  let currentRoom = roomManager.createRoom()
  rooms[currentRoom.getRoomInfo().roomId] = currentRoom
  playGame(currentRoom)
  currentRoom.on("roomClosed", () => {
    delete rooms[currentRoom.getRoomInfo().roomId]
    if (closingDown) return 
    if (Object.keys(rooms).length > 0) 
    setTimeout(spawnRoom, 1000)
  })
}

spawnRoom()

