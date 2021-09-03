const Spotify = require('spotify-web-api-node');
const HttpRequest = require('axios')

const GroupMeBotsCreateMessageUrl = "https://api.groupme.com/v3/bots/post?token="+process.env["GROUPME_API_TOKEN"]

const aclDate = new Date(2021, 10 - 1, 1);
const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds

module.exports = async (context, myTimer, food) => {

    const foodList = food.slice(0, 9)

    const today = new Date();
    const diffDays = Math.round(Math.abs((aclDate - today) / oneDay));

    const wikipediaMessageText = "ACL Eats\nDays until ACL: " + diffDays + "\n\n" +
            "Here's some of the food available at the festival";

    await HttpRequest
        .post(GroupMeBotsCreateMessageUrl, {
            bot_id: process.env["GROUPME_BOT_ID"],
            text: wikipediaMessageText
        })

    foodList.forEach(async restaurant => {
        await HttpRequest
            .post(GroupMeBotsCreateMessageUrl, {
                bot_id: process.env["GROUPME_BOT_ID"],
                text: restaurant.name + "\nMenu: " + restaurant.link
            })
    })
    return { foodOut: food.slice(9) }
};
