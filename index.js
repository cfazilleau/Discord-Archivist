const Discord = require(`discord.js`);
const https = require(`https`);
const fs = require(`fs`);
const settings = require(`./config.json`);

const client = new Discord.Client();

let saveMedias = async msg => {
    var lastMsg = msg.id;
    var batchSize = settings.defaultBatchSize;
    var amount = 0;

    msg.channel.send(`saving...`);
    console.log(`saving...`);

    while (batchSize == settings.defaultBatchSize) {
        const batch = await msg.channel.fetchMessages({ limit: settings.defaultBatchSize, before: lastMsg });
        batchSize = batch.size;
        console.log(`fetched ` + batchSize + ` messages.`);

        batch.forEach(element => element.attachments.forEach(attachment => {
            const dir = `./saved/` + msg.channel.id + `/`
            fs.mkdirSync(dir, { recursive: true });
            const filename = element.createdTimestamp + `_` + attachment.url.split(`/`).pop();
            https.get(attachment.url, response => response.pipe(fs.createWriteStream(dir + filename)));
            console.log(++amount + `. saved "` + filename + `".`);
        }));

        if (batchSize > 0)
            lastMsg = batch.last().id;
    }
    msg.channel.send(`done! successfully saved ` + amount + ` attachments.`);
    console.log(`done! successfully saved ` + amount + ` attachments.`);
}

client.on(`ready`, () => {
    console.log(`Logged in as ${client.user.tag}! join with https://discordapp.com/api/oauth2/authorize?client_id=${settings.botId}&scope=bot&permissions=65536`);
});

client.on(`message`, msg => {
    if (msg.content == settings.saveTrigger && msg.author.id === settings.authorizedUserId)
        saveMedias(msg);
});

client.login(settings.botToken).catch(console.error);