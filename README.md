# GroupMe bot for ACL 2021

This is an Azure Function that sends daily updates to a GroupMe group with a new artist every day

## Dependencies
- Azure subscription
- Azure CLI
- Azure Function CLI
- npm
- GroupMe account
- Spotify account

## Setup
Once the necessary values are generated, add them to `local.settings.json`

### GroupMe API Key
- You need a GroupMe API key for API requests, which can be done [here](https://dev.groupme.com/applications/new).
- You also need to create a GroupMe bot and get the GroupID and BotID, which can be done [here](https://dev.groupme.com/bots).

### Spotify Credentials
- You need to get a ClientID and ClientSecret for the Spotify API, which can be done [here](https://developer.spotify.com/dashboard/applications).

## Local Development
- Run `npm install`
- Update your `local.settings.json` with values from the [example](example.local.settings.json)
- Run `func start`

## Deploying
- Set up an Azure Function App for node in the Azure portal
- Run `az login`
- Publish the function with `func azure functionapp publish <functionapp_name>`