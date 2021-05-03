// create an express app
const express = require("express")
const Run = require('run-sdk')
var SHA256 = require("crypto-js/sha256");
var hmacSHA512 = require("crypto-js/hmac-sha512");
var Base64 = require("crypto-js/enc-base64");
var cors = require('cors')
const app = express()

// use the express-static middleware
app.use(express.static("public"))
app.use(cors())


// define the first route
app.get("/1", function (req, res) {
  res.send("<h1>Hello World!</h1>")
})
app.get('/products/:id', function (req, res, next) {
  res.json({msg: 'This is CORS-enabled for all origins!'})
})

app.post('/check-win', async function (req, res, next) {
  const run = new Run({network: "test", purse: "cQdpg2oTVvbeb47GzRxqn467RmJNp8rJzfoPMfkSBRyzqEdbJcSz", owner: 'cTQPGSZiCXQD3UmrF4rKE6Gub3tmjYYvrjspU7BhXCYbg5f2r7AW', trust: "*"})
  console.log(req);
  const answers = await run.load(req.query.location);
  console.log("Answers Owner:", answers.owner);
  let toHash = answers.answers[0] + answers.answers[1] + answers.answers[2];
  console.log(toHash);
  const hashDigest = SHA256(toHash);
  const hmacDigest = Base64.stringify(hmacSHA512(1 + hashDigest, run.purse.privkey));

  let hashWin = "alwayseverywehre but here sucks anywayboat";
  const winHashDigest = SHA256(hashWin);
  const winHmacDigest = Base64.stringify(hmacSHA512(1 + winHashDigest, run.purse.privkey));

  if(hmacDigest === winHmacDigest){
    let game = await run.load("7944ab6c5e8b926dc32b4c08e0aa5c6c2dc345435ac6c305e4c4936632901878_o2");
    let data = {"winner": "YES!", "winning_hash": hmacDigest, "gameTitle": game.details.title};
    res.json(data);
  } else {
    res.json({"winner": "no"})
  }
})

// start the server listening for requests
app.listen(process.env.PORT || 3000, 
  () => console.log("Server is running..."));