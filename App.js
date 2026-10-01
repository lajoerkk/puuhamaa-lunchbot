const request = require('request');
const cheerio = require('cheerio');
const express = require('express')
const bodyParser = require('body-parser')

const { createEventAdapter } = require('@slack/events-api')
const { createMessageAdapter } = require('@slack/interactive-messages')
const { WebClient } = require('@slack/web-api')

const port = process.env.PORT || 3000
const app = express()
const token = process.env.SLACK_BOT_TOKEN
const webClient = new WebClient(token)

var d = new Date();
var n = d.getDay();

const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET)
const slackInteractions = createMessageAdapter(process.env.SLACK_SIGNING_SECRET)

app.use('/slack/events', slackEvents.expressMiddleware())
app.use('/slack/actions', slackInteractions.expressMiddleware())

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

slackEvents.on('app_mention', async (event) => {

  try {
    request( { method: 'GET', url: 'https://tieto.ravintolapalvelut.iss.fi' }, (err, res, body) => { {
        try { 
          var safkat = parseSafkat(body)
          webClient.chat.postMessage(
            {
              "attachments": [
                {
                  "blocks": [
                    {
                      "type": "header",
                      "text": {
                        "type": "plain_text",
                        "text": "FG" }
                    },
                    {
                      "type": "section",
                      "text": {
                        "type": "plain_text",
                        "text": safkat }
                    } ] } ], channel: event.channel})
          }
        catch (e) { console.log(JSON.stringify(e)) }
      }})}
  catch (e) { console.log(JSON.stringify(e)) }

  try {
    request( { method: 'GET', url: 'https://www.sodexo.fi/ruokalistat/output/weekly_json/6595', json: true }, (err, res, jason) => { {
        try { 
          var ruoat = parseRuoat(jason)
          webClient.chat.postMessage(
            {
              "attachments": [
                {
                  "blocks": [
                    {
                      "type": "header",
                      "text": {
                        "type": "plain_text",
                        "text": "AB" }
                    },
                    {
                      "type": "section",
                      "text": {
                        "type": "plain_text",
                        "text": ruoat }
                    } ] } ], channel: event.channel})
          }
        catch (e) { console.log(JSON.stringify(e)) }
      }})}
  catch (e) { console.log(JSON.stringify(e)) }

})

function parseSafkat(body) {
  let $ = cheerio.load(body);
  var safkat = [];
  $('.lunch-menu__day').each(function() {
      safkat.push($(this).text());
  });
  return safkat[n-1].toString()
}

function parseRuoat(jason) {
  var courses = jason["mealdates"][n-1]["courses"]
  var ruoat = jason["mealdates"][n-1]["date"] + "\n"
  for(var attributename in courses) {
    ruoat +=  courses[attributename]["title_fi"] + "\n" }
  return ruoat
}

app.listen(port, function() {
  console.log('Bot is listening on port ' + port)
})