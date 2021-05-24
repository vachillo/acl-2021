const Spotify = require('spotify-web-api-node');
const HttpRequest = require('axios')
const fs = require('fs')

const artists = require("./artists.json")
const artistsDone = require("./artists_done.json")

const GroupMeBotsCreateMessageUrl = "https://api.groupme.com/v3/bots/post?token="+process.env["GROUPME_API_TOKEN"]
const wikipediaUrlSearch = "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exlimit=max&explaintext&titles="
const wikipediaUrlHtml = "https://en.wikipedia.org/wiki/"

const aclDate = new Date(2021, 10 - 1, 1);
const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds

module.exports = async (context, myTimer) => {
    const currentArtist = artists.filter(artist => {
        return !artistsDone.includes(artist);
    })[0]

    const today = new Date();
    const diffDays = Math.round(Math.abs((aclDate - today) / oneDay));

    const spotifyClient = new Spotify({
        clientId: process.env["SPOTIFY_CLIENT_ID"],
        clientSecret: process.env["SPOTIFY_CLIENT_SECRET"]
    })

    if (!currentArtist) {
        return HttpRequest
            .post(GroupMeBotsCreateMessageUrl, {
                bot_id: process.env["GROUPME_BOT_ID"],
                text: "No more Artists!\nDays until ACL: " + diffDays
            })
    }

    await spotifyClient.clientCredentialsGrant().then(data => { spotifyClient.setAccessToken(data.body['access_token']) });

    const artistId = await spotifyClient
        .searchArtists(currentArtist.split('(')[0])
        .then(res => {
            return res.body.artists.items[0].id
        })

    const artistTopSongs = await spotifyClient
        .getArtistTopTracks(artistId, 'US')
        .then(res => { return res.body.tracks })

    const artistText = await HttpRequest
        .get(wikipediaUrlSearch + encodeURI(currentArtist))
        .then(res => {
            const pageKey = Object.keys(res.data.query.pages)[0]
            if (res.data.query.pages[pageKey].extract.length < 1) {
                return "Could not get text for artist"
            }
            return res.data.query.pages[pageKey].extract;
        })
        .catch(err => {
            return "Could not get text for artist"
        })
    let topSongsText = "Top Tracks: \n"
    artistTopSongs.forEach(track => {
        topSongsText += track.name + ": " + track.external_urls.spotify + "\n"
    })
    const wikipediaMessageText = "The Artist of the Day is: " + currentArtist + "\n" +
        "Days until ACL: " + diffDays + "\n\n" + artistText.slice(0, 600) + "...\n\n" +
        "Read more on wikipedia: " + wikipediaUrlHtml + currentArtist.replace(/ /g, "_");

    await HttpRequest
        .post(GroupMeBotsCreateMessageUrl, {
            bot_id: process.env["GROUPME_BOT_ID"],
            text: wikipediaMessageText
        })
    await HttpRequest
        .post(GroupMeBotsCreateMessageUrl, {
            bot_id: process.env["GROUPME_BOT_ID"],
            text: topSongsText
        })
    artistsDone.push(currentArtist)
    return fs.writeFile(__dirname + "/artists_done.json", JSON.stringify(artistsDone), err => { if(err) throw err})
};