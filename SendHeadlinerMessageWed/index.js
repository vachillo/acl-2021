const Spotify = require('spotify-web-api-node');
const HttpRequest = require('axios')

const GroupMeBotsCreateMessageUrl = "https://api.groupme.com/v3/bots/post?token="+process.env["GROUPME_API_TOKEN"]
const wikipediaUrlSearch = "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exlimit=max&explaintext&titles="
const wikipediaUrlHtml = "https://en.wikipedia.org/wiki/"

const aclDate = new Date(2021, 10 - 1, 1);
const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds

module.exports = async (context, myTimer, artistsIn) => {

    const today = new Date();
    const diffDays = Math.round(Math.abs((aclDate - today) / oneDay));

    const currentDay = artistsIn[0].day

    const spotifyClient = new Spotify({
        clientId: process.env["SPOTIFY_CLIENT_ID"],
        clientSecret: process.env["SPOTIFY_CLIENT_SECRET"]
    })

    await spotifyClient.clientCredentialsGrant().then(data => { spotifyClient.setAccessToken(data.body['access_token']) });

    const headlinerText = "The Headliners for " + currentDay + " :\n"
        + artistsIn[0].wikipedia + "\n" + artistsIn[1].wikipedia + "\n" +
        "Days until ACL: " + diffDays + "\n\n" +
        "Today is: Featured Album";

    await HttpRequest
        .post(GroupMeBotsCreateMessageUrl, {
            bot_id: process.env["GROUPME_BOT_ID"],
            text: headlinerText
        })

    for (const artist of artistsIn) { // Normal wikipedia and top songs

        const currentArtistWiki = artist.album_wikipedia
        let artistWikipedia = artist.wikipedia + "\nFeatured Album: " + artist.album_spotify + "\n\n"
        artistWikipedia += await HttpRequest
            .get(wikipediaUrlSearch + encodeURI(currentArtistWiki))
            .then(res => {
                const pageKey = Object.keys(res.data.query.pages)[0]
                let text = res.data.query.pages[pageKey].extract.slice(0, 750) + "...\n\n" +
                    "Read more on wikipedia: " + wikipediaUrlHtml + currentArtistWiki.replace(/ /g, "_").toString() + " \n"
                if (!text || text.length < 1) {
                    text = "Could not get text for artist"
                }
                return text;
            })
            .catch(err => {
                return "Could not get text for artist"
            })

        const artistId = await spotifyClient
            .searchArtists(artist.spotify)
            .then(res => {
                const artists = res.body.artists.items.filter(item => {
                    return item.name === artist.spotify
                })
                return artists[0].id
            }).catch(err => {
                console.log(err)
                return undefined
            })

        const artistAlbumLink = await spotifyClient
            .getArtistAlbums(artistId, { include_groups: "album", limit: 50 })
            .then(res => {
                const albums = res.body.items.filter(item => {
                    return item.name === artist.album_spotify
                })
                return albums[0].external_urls.spotify
            })

        artistWikipedia += "Spotify Link: " + artistAlbumLink

        await HttpRequest
            .post(GroupMeBotsCreateMessageUrl, {
                bot_id: process.env["GROUPME_BOT_ID"],
                text: artistWikipedia
            })
    }
};
