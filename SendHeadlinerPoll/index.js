const Spotify = require('spotify-web-api-node');
const HttpRequest = require('axios')

const GroupMeBotsCreateMessageUrl = "https://api.groupme.com/v3/bots/post?token="+process.env["GROUPME_API_TOKEN"]

const aclDate = new Date(2021, 10 - 1, 1);
const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds

module.exports = async (context, myTimer, artistsIn) => {

    const artistsInPoll = artistsIn.slice(0, 2)

    const today = new Date();
    const diffDays = Math.round(Math.abs((aclDate - today) / oneDay));

    const spotifyClient = new Spotify({
        clientId: process.env["SPOTIFY_CLIENT_ID"],
        clientSecret: process.env["SPOTIFY_CLIENT_SECRET"]
    })

    await spotifyClient.clientCredentialsGrant().then(data => { spotifyClient.setAccessToken(data.body['access_token']) });

    const currentDay = artistsIn[0].day

    const wikipediaMessageText = "Artist Weekly Recap\nDays until ACL: " + diffDays + "\n\n" +
            "Who are you going to see on " + currentDay + " night?";

    await HttpRequest
        .post(GroupMeBotsCreateMessageUrl, {
            bot_id: process.env["GROUPME_BOT_ID"],
            text: wikipediaMessageText
        })

    artistsInPoll.forEach(async artist => {
        const artistLink = await spotifyClient
            .searchArtists(artist.spotify)
            .then(res => {
                const artists = res.body.artists.items.filter(item => {
                    console.log(item.name)
                    return item.name === artist.spotify
                })
                return artists[0].external_urls.spotify
            }).catch(err => {
                return undefined
            })

        await HttpRequest
            .post(GroupMeBotsCreateMessageUrl, {
                bot_id: process.env["GROUPME_BOT_ID"],
                text: artist.spotify + "\n" + artistLink
            })
    })
    return { artistsOut: artistsIn.slice(2) }
};
