const Discord = require(`discord.js`);
const https = require(`https`);
const fs = require(`fs`);
const settings = require(`./config.json`);

const client = new Discord.Client();

const getContent = function (url, path) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, (response) => {
            if (response.statusCode < 200 || response.statusCode > 299) {
                reject(new Error('Failed to load page, status code: ' + response.statusCode));
            }
            response.pipe(fs.createWriteStream(path))
                .on('finish', () => resolve())
                .on('error', e => reject(e));
        });
        request.on('error', (err) => reject(err))
    })
};

const saveMedias = async msg => {
    var lastMsg = msg.id;
    var batchSize = settings.defaultBatchSize;
    var amount = 0;

    msg.channel.send(`saving...`);
    console.log(`saving...`);

    const dir = `./saved/` + msg.channel.id + `/`
    fs.mkdirSync(dir, { recursive: true });

    while (batchSize == settings.defaultBatchSize) {
        const batch = await msg.channel.fetchMessages({ limit: settings.defaultBatchSize, before: lastMsg });
        batchSize = batch.size;
        console.log(`fetched ` + batchSize + ` messages.`);

        for await (var element of batch.values()) {
            for await (var attachment of element.attachments.values()) {
                const filename = element.createdTimestamp + `_` + attachment.url.split(`/`).pop();
                await getContent(attachment.url, dir + filename);
                console.log(++amount + `. saved "` + filename + `".`);
            }
        }

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