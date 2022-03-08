const Discord 	= require("discord.js");
const https 	= require("https");
const fs 		= require("fs");

const settings 	= require("./config.json");

const client = new Discord.Client();

const getContent = function (url, path)
{
	return new Promise((resolve, reject) =>
	{
		const request = https.get(url, response =>
		{
			if (response.statusCode < 200 || response.statusCode > 299)
			{
				reject(new Error('Failed to load resource, status code: ' + response.statusCode));
			}

			response.pipe(fs.createWriteStream(path))
				.on('finish', () => resolve())
				.on('error', e => reject(e));
		});

		request.on('error', e => reject(e))
	});
};

const saveMedias = async function(msg)
{
	var lastMsg		= msg.id;
	var batchSize	= settings.defaultBatchSize;
	var amount		= 0;
	var done		= false;

	msg.channel.send("saving...");
	console.log("saving...");

	// Create save folder
	const dir = "./saved/" + msg.channel.id + "/"
	fs.mkdirSync(dir, { recursive: true });

	while (batchSize == settings.defaultBatchSize && !done)
	{
		// Fetch Messages batch
		const batch = await msg.channel.fetchMessages({ limit: settings.defaultBatchSize, before: lastMsg });
		batchSize = batch.size;
		console.log("fetched " + batchSize + " messages.");

		// Iterate on messages
		for await (var element of batch.values())
		{
			// Iterate on attachments
			for await (var attachment of element.attachments.values())
			{

				var filename = attachment.url.split("/").pop(); // last element of URL
				var extension = filename.split(".").pop(); // last element of name

				if (filename.length > settings.maximumFilenameLength)
				{
					filename = filename.substring(0, settings.maximumFilenameLength - (extension.length + 1)) + "." + extension;
				}

				filename = element.createdTimestamp + "_" + filename;

				// If the content has already been saved, skip or cancel
				if (fs.existsSync(dir + filename))
				{
					if (settings.cancelOnAlreadyExists)
					{
						console.log(filename + " already exists, skipping save.");
						done = true;
						break;
					}
					else if (settings.skipOnAlreadyExists)
					{
						console.log(filename + " already exists, skipping save.");
						continue;
					}
					else
					{
						console.log("overwriting " + filename + ".");
					}
				}

				// Write file
				await getContent(attachment.url, dir + filename);
				console.log(++amount + ". saved \"" + filename + "\"");
			}
		}

		// Continue fetching messages before the date of the first element of the previous batch
		if (batchSize > 0)
			lastMsg = batch.last().id;
	}

	// Done saving messages
	msg.channel.send("done! successfully saved " + amount + " attachments.");
	console.log("done! successfully saved " + amount + " attachments.");
}

client.on("ready", () => {
	console.log(`Logged in as ${client.user.tag}! join with https://discordapp.com/api/oauth2/authorize?client_id=${settings.botId}&scope=bot&permissions=65536`);
});

client.on("message", msg => {
	if (msg.author.id === settings.authorizedUserId && msg.content == settings.saveTrigger)
		saveMedias(msg);
});

client.login(settings.botToken).catch(console.error);