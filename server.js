const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const axios = require('axios');
const sharp = require('sharp');
const Canvas = require('canvas');
const { createCanvas, loadImage } = Canvas;
const app = express();
const port = process.env.PORT || 0221;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    // Add any other intents your bot requires
  ],
});

let imageUrlCache = null;
let pings = {};

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Initial image update with the last 15 messages
  await updateImage('1205342735075377172', 15);

  // Fetch and update the image every 2.5 minutes
  setInterval(async () => {
    await updateImage('1205342735075377172', 15);
  }, 2.5 * 60 * 1000); // 2.5 minutes in milliseconds

  // Remove old pings every 5 minutes
  setInterval(() => {
    const currentTime = Date.now();
    Object.keys(pings).forEach((username) => {
      if (currentTime - pings[username].timestamp > 5 * 60 * 1000) {
        delete pings[username];
      }
    });
  }, 5 * 60 * 1000); // 5 minutes in milliseconds
});

async function updateImage(channelId, limit) {
  try {
    const channel = await client.channels.fetch(channelId);
    const messages = await channel.messages.fetch({ limit: limit });

    messages.forEach(async (message) => {
      if (message.embeds.length > 0) {
        const embed = message.embeds[0];

        // Check if the embed description contains an izurvive.com link
        if (embed.description.includes('www.izurvive.com')) {
          // Extract the location information from the izurvive.com link
          const locationMatch = embed.description.match(/#location=([\d.]+);([\d.]+)/);

          if (locationMatch) {
            const [latitude, longitude] = locationMatch.slice(1).map(parseFloat);
            const convertedLocation = convertToCanvasCoordinates([latitude, longitude]);

            // Extract the username (identifier) from the embed content
            const usernameMatch = embed.description.match(/\*\*(.+?)\*\* •/);
            const username = usernameMatch ? usernameMatch[1].trim() : null;

            if (username) {
              // Store the latest ping from each user
              pings[username] = { location: convertedLocation, timestamp: Date.now() };
            }
          }
        }
      }
    });

    // Remove pings older than 15 minutes
    const currentTime = Date.now();
    Object.keys(pings).forEach((username) => {
      if (currentTime - pings[username].timestamp > 15 * 60 * 1000) {
        delete pings[username];
      }
    });

    // Fetch the image using the provided link
    const imageUrl = 'https://cdn.discordapp.com/attachments/1205342735075377172/1205429298333356032/image.png?ex=65d85684&is=65c5e184&hm=99734ace203fa5e479f33cd9467cac239375478fc0121ee19ae18a35173e2abf&';
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data);

    // Load the image using Canvas
    const canvas = createCanvas(300, 325);
    const context = canvas.getContext('2d');
    const image = await loadImage(imageBuffer);
    context.drawImage(image, 0, 0, 300, 325);

    // Overlay a small red circle for each ping with username
    Object.entries(pings).forEach(([username, ping]) => {
      const [x, y] = ping.location;

      // Draw a red circle
      context.beginPath();
      context.arc(x, y, 5, 0, 2 * Math.PI);
      context.fillStyle = 'red';
      context.fill();

      // Set the font for username text
      context.font = '10px sans-serif';
      context.fillStyle = 'black';
      context.fillText(username, x - 28, y - 5); // Adjust the position for username
    });

    // Set the updated image to app.locals
    app.locals.imageBuffer = canvas.toBuffer();
    console.log("Pings:", pings);
  } catch (error) {
    console.error('Error fetching Discord data:', error);
  }
}

function convertToCanvasCoordinates(location) {
  // Convert DayZ coordinates to canvas coordinates
  const [x, y] = location;
  const canvasX = (x / 15360) * 300;
  const canvasY = 325 - (y / 15360) * 325;
  return [canvasX, canvasY];
}

app.get('/', (req, res) => {
  // Send the most recently updated image
  const imageBuffer = app.locals.imageBuffer || Buffer.from(''); // Default to an empty buffer if no image is available
  res.set('Content-Type', 'image/png');
  res.send(imageBuffer);
});

client.login(process.env.EXAMPLE_KEY);
 // Replace with your Discord bot token

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});
