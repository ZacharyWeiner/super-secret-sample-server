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

let gameSatoshis = 0;


// define the first route
app.get("/1", function (req, res) {
  res.send("<h1>Hello World!</h1>")
})
app.get('/products/:id', function (req, res, next) {
  res.json({msg: 'This is CORS-enabled for all origins!'})
})

app.post('/check-win', async function (req, res, next) {
  const run = new Run({network: "test", purse: "cQdpg2oTVvbeb47GzRxqn467RmJNp8rJzfoPMfkSBRyzqEdbJcSz", owner: 'cTQPGSZiCXQD3UmrF4rKE6Gub3tmjYYvrjspU7BhXCYbg5f2r7AW', trust: "*"})
  //console.log(req);
  let game = await run.load("ffbd504e96bee30ce4f9d8d4555df1ebc68133924b797358b0a1e7d182613cbe_o2");
  const answers = await run.load(req.query.location);
  await game.sync();
  let newGameLocation = 
  await answers.sync();
  console.log("Game Owner:", game.owner);
  console.log("Answers Owner:", answers.owner);
  let tx = new Run.Transaction();
  tx.update(() => answers.withdraw())
  tx.update(() => game.fund(1250))
  await tx.publish();
  await answers.sync();
  game = await run.load("ffbd504e96bee30ce4f9d8d4555df1ebc68133924b797358b0a1e7d182613cbe_o2");
  await game.sync();
  console.log("Answers Balance", answers.satoshis);
  console.log("Game Balance", game.satoshis);
  let toHash = answers.answers[0] + answers.answers[1] + answers.answers[2];
  console.log(toHash);
  const hashDigest = SHA256(toHash);
  const hmacDigest = Base64.stringify(hmacSHA512(1 + hashDigest, run.purse.privkey));

  let hashWin = "alwayseverywehre but here sucks anywayboat";
  const winHashDigest = SHA256(hashWin);
  const winHmacDigest = Base64.stringify(hmacSHA512(1 + winHashDigest, run.purse.privkey));
  if(hmacDigest === winHmacDigest){
    console.log(game.owner);
    game.send(answers.pubKey_for_winning);
    game.sync();
    let data = {"winner": "YES!", "winning_hash": hmacDigest, "gameTitle": game.details.title};
    res.json(data);
  } else {
    res.json({"winner": "no"})
  }
})

// start the server listening for requests
app.listen(process.env.PORT || 3000, 
  () => console.log("Server is running..."));