const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const axios = require('axios'); // Import the 'axios' module
const sharp = require('sharp');
const app = express();
const port = process.env.PORT || 3000;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    // Add any other intents your bot requires
  ],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

app.get('/', async (req, res) => {
  try {
    const channelId = '1205343348265721926'; // Replace with your Discord channel ID
    const channel = await client.channels.fetch(channelId);
    const messages = await channel.messages.fetch({ limit: 1 });
    const message = messages.first();

    if (message && message.embeds.length > 0) {
      // Check if the last message has embeds
      const embed = message.embeds[0];
      const imageUrl = embed.image?.url || embed.thumbnail?.url;

      if (imageUrl) {
        // Fetch the image using axios
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data);

        // Resize the image before sending
        const resizedImageBuffer = await sharp(imageBuffer)
          .resize({ width: 800, height: 600 })
          .toBuffer();

        // Set the appropriate content type for images
        res.set('Content-Type', 'image/jpeg');

        // Send the resized image as the response
        res.send(resizedImageBuffer);
      } else {
        res.send('No image found in the latest message.');
      }
    } else {
      res.send('No embed found in the latest message.');
    }
  } catch (error) {
    console.error('Error fetching Discord data:', error);
    res.status(500).send('Internal Server Error');
  }
});

client.login('MTExMzI2MDAwMjU1NjI2ODU4NQ.Gbn3VG.bRPwgjwBequKdLJcZgFB_8B5RE-qnKm_ItUu3M'); // Replace with your Discord bot token

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
