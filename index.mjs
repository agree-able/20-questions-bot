import { BreakoutRoom } from "breakout-room";
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

async function playGame() {
  const room = new BreakoutRoom();
  const invite = await room.ready();
  let peerKey = "";

  console.log("Invite your friend to play 20 Questions with you: ", invite);

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

  room.on("peerEntered", (key) => {
    console.log("peer entered the room", key);
    peerKey = key;
    room.message(
      `Welcome to 20 Questions! I've thought of an object. Ask me yes/no questions to guess what it is.\nYou have ${questionsLeft} questions left.`
    );
  });

  room.on("peerLeft", (key) => {
    console.log("peer left the room", key);
    shutdown();
  });

  let isGenerating = false;

  room.on("message", async (message) => {
    // shouldn't need to do this but getting duplicate messages for some reason...
    if (isGenerating) {
      console.log("Ignoring message while generating response...");
      return;
    }

    if (message.who !== peerKey) {
      console.log("Ignoring message not from peer...");
      return;
    }

    const question = message.data;
    questionsLeft--;

    if (questionsLeft <= 0) {
      await room.message("You've used all your questions. The object was: " + object);
      await shutdown();
    }

    if (question.toLowerCase() === "quit") {
      await room.message("You quit the game. The object was: " + object);
      await shutdown();
    }

    if (question.toLowerCase().includes(object.toLowerCase())) {
      room.message("You guessed the object! It was: " + object);
      await shutdown();
    }

    messages.push({ role: "user", content: question });
    isGenerating = true;
    const answer = await getResponse(messages);
    isGenerating = false;
    messages.push({ role: "assistant", content: answer });
    messages.push({ role: "system", content: `User has ${questionsLeft} questions left.` });

    if (answer.toLowerCase().includes(object.toLowerCase())) {
      room.message(`The object has been revealed!`);
      await shutdown();
    }

    await room.message(answer);
  });

  async function exitRoom() {
    await room.exit();
  }

  async function shutdown() {
    console.log(`Game Over! The object was: ${object}`);
    const transcript = await room.getTranscript();
    console.log("transcript:", transcript);
    await exitRoom();
    process.exit(0);
  }

  process.on("SIGINT", exitRoom);
  process.on("SIGTERM", exitRoom);
}

playGame();
