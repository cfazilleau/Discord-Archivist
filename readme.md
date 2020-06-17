# Discord Archivist
is a small bot I made to save all the pictures sent in a discord channel.

It uses the packages
- discord.js to access to the messages.
- https to handle the web requests.
- fs to save the images to a local directory.

# How to use ?

you need to install the dependencies using npm (`npm install`)
and create a `config.json` file:

```json
{
    "authorizedUserId": "YOUR_USER_ID",
    "saveTrigger": "YOUR_SAVE_COMMAND",
    "botToken": "YOUR_BOT_TOKEN",
    "botId": "YOUR_BOT_ID",
    "defaultBatchSize": 100
}
```
