import { RoomManager } from "@agree-able/room";
import OpenAI from "openai";
import rc from 'run-con'

// Initialize OpenAI client
const openai = new OpenAI();

/**
 * Main entry point - demonstrates how to set up an agree-able room
 * This shows the core setup needed for any agree-able room application
 */
async function run () {
  // Load configuration
  const config = rc('breakout-room', {})
  const roomManager = new RoomManager()
  roomManager.installSIGHandlers() // handle shutdown signals

  // Define room expectations and validation
  const expectations = {
    reason: 'We are playing a game of 20 questions. The user is trying to guess an object. The assistant will provide hints and the user will ask yes/no questions to guess the object. The game ends when the user guesses the object or runs out of questions.',
    rules: 'The user can ask yes/no questions to guess the object. The user has 20 questions to guess the object. The user can quit the game at any time by typing "quit". If the user guesses the object, the game ends. If the user runs out of questions, the game ends and the object is revealed.',
    whoamiRequired: config.whoamiRequired || false
  }
  const validateParticipant = (acceptance, extraInfo) => {
    console.log('asked to validate', acceptance, extraInfo)
    return { ok: true }
  }

  // Start the agreeable room
  const { agreeableKey } = await roomManager.startAgreeable(config, expectations, validateParticipant) 
  console.log(`agreeableKey:`, agreeableKey)
  
  // Set up room event handlers
  roomManager.on('readyRoom', (room) => playGame(room))
  roomManager.on("lastRoomClosed", () => roomManager.createReadyRoom())
  roomManager.createReadyRoom()
}

// Start the application
run()

// Game-specific implementation below
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
  return word;
}

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
  roomPrint(room, `Room invite: ${room.getRoomInfo().invite}`);
  let peerKey = "";
  let questionsLeft = 20;
  const object = await generateObject();
  roomPrint(room, `Generated object: ${object}`);
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
    roomPrint(room, `User asked: ${question}`);
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

