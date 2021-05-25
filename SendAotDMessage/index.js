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
        return !artistsDone.some(done => { return done.spotify === artist.spotify});
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
            }).catch(err => {console.log(err)})
    }

    await spotifyClient.clientCredentialsGrant().then(data => { spotifyClient.setAccessToken(data.body['access_token']) });

    const artistId = await spotifyClient
        .searchArtists(currentArtist.spotify)
        .then(res => {
            return res.body.artists.items[0].id
        })

    const artistTopSongs = await spotifyClient
        .getArtistTopTracks(artistId, 'US')
        .then(res => { return res.body.tracks })

    let artistText
    if (currentArtist.hasOwnProperty('wikipedia')) {
        const currentArtistWiki = currentArtist.wikipedia
        artistText = await HttpRequest
            .get(wikipediaUrlSearch + encodeURI(currentArtistWiki))
            .then(res => {
                const pageKey = Object.keys(res.data.query.pages)[0]
                let text = res.data.query.pages[pageKey].extract.slice(0, 800) + "...\n\n" +
                    "Read more on wikipedia: " + wikipediaUrlHtml + currentArtistWiki.replace(/ /g, "_")
                if (!text || text.length < 1) {
                    text = "Could not get text for artist"
                }
                return text;
            })
            .catch(err => {
                return "Could not get text for artist"
            })
    } else if (currentArtist.hasOwnProperty('link')) {
        artistText = "No wikipedia link found, heres something else: " + currentArtist.link
    } else {
        artistText = "Could not find any more info on this artist, heres a google search: https://google.com/search?q=" + currentArtist.spotify
    }

    let topSongsText = "Top Tracks: \n"
    artistTopSongs.forEach(track => {
        topSongsText += track.name + ": " + track.external_urls.spotify + "\n"
    })
    const wikipediaMessageText = "The Artist of the Day is: " + currentArtist.spotify + "\n" +
        "Days until ACL: " + diffDays + "\n\n" +
        artistText;

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
    return fs.writeFile(__dirname + "/artists_done.json", JSON.stringify(artistsDone), err => {if(err) throw err})
};