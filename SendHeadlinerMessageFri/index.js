const Spotify = require('spotify-web-api-node');
const HttpRequest = require('axios')

const GroupMeBotsCreateMessageUrl = "https://api.groupme.com/v3/bots/post?token="+process.env["GROUPME_API_TOKEN"]
const wikipediaUrlSearch = "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exlimit=max&explaintext&titles="
const wikipediaUrlHtml = "https://en.wikipedia.org/wiki/"

const aclDate = new Date(2021, 10 - 1, 1);
const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds

module.exports = async (context, myTimer, artistsIn) => {
    const artistsInArr = artistsIn.slice(0, 2)

    const today = new Date();
    const diffDays = Math.round(Math.abs((aclDate - today) / oneDay));

    const currentDay = artistsInArr[0].day

    const spotifyClient = new Spotify({
        clientId: process.env["SPOTIFY_CLIENT_ID"],
        clientSecret: process.env["SPOTIFY_CLIENT_SECRET"]
    })

    await spotifyClient.clientCredentialsGrant().then(data => { spotifyClient.setAccessToken(data.body['access_token']) });

    const headlinerText = "The Headliners for " + currentDay + " :\n"
        + artistsInArr[0].wikipedia + "\n" + artistsInArr[1].wikipedia + "\n" +
        "Days until ACL: " + diffDays + "\n\n" +
        "Today is: Merch";

    await HttpRequest
        .post(GroupMeBotsCreateMessageUrl, {
            bot_id: process.env["GROUPME_BOT_ID"],
            text: headlinerText
        })

    for (const artist of artistsInArr) { // Send link to live show

        let artistText = artist.wikipedia + "\n\n" +
            "Check out some merch:\n" +
            artist.merch_link;

        await HttpRequest
            .post(GroupMeBotsCreateMessageUrl, {
                bot_id: process.env["GROUPME_BOT_ID"],
                text: artistText
            })
    }
};
