// create an express app
const express = require("express")
const Run = require('run-sdk')
var SHA256 = require("crypto-js/sha256");
var hmacSHA512 = require("crypto-js/hmac-sha512");
var Base64 = require("crypto-js/enc-base64");
var cors = require('cors')
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

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

app.post('/check-win-test', async function (req, res, next) {
  const run = new Run({network: "test", purse: process.env.GAME_PURSE_PRIVATE_KEY, owner: process.env.GAME_OWNER_PRIVATE_KEY, trust: "*"})
  console.log(req.query.location, req.query.gameId);
  const answers = await run.load(req.query.location);
  const game = await run.load(req.query.gameId);
  try{
    await game.sync();
    await answers.sync();
  }catch(err){
    res.json(err);
  }
  console.log("Game Owner:", game.owner);
  console.log("Answers Owner:", answers.owner);
  console.log("Answers Game:", answers.gameId);
  let tx = new Run.Transaction();
  tx.update(() => answers.check())
  let toFund = Math.round(game.satoshisForPlay / 2);
  console.log("To Fund:", game.satoshisForPlay, toFund)
  tx.update(() => game.fund(toFund))
  try {
   await tx.publish();
   await answers.sync();
   await game.sync();
   console.log("Answers Balance", answers.satoshis);
   console.log("Game Balance", game.satoshis);
   let toHash = answers.answers[0] + answers.answers[1]   + answers.answers[2]  + answers.answers[3]  + answers.answers[4];
   const hashDigest = SHA256(toHash);
   const hmacDigest = Base64.stringify(hmacSHA512(1 + hashDigest, run.purse.privkey));
   console.log("toHash, ", toHash, "hashDigest: ", hashDigest, ", hmacDigest: ", hmacDigest, game.winningHash);
   answers.resetOwner()
   await answers.sync()
   console.log("Answers Owner:", answers.owner);
   let hashWin = game.winningHash;
      // const winHashDigest = SHA256(hashWin);
      // const winHmacDigest = Base64.stringify(hmacSHA512(1 + winHashDigest, run.purse.privkey));
      if(hmacDigest.toString() === hashWin.toString()){
        console.log("Winning Play!", game.owner);
        let toWin = await run.load(game.location);
        await toWin.sync();
        toWin.win(answers.address_for_winning);
        await game.sync();
        let data = {"winner": "YES!", "winning_hash": hmacDigest, "gameTitle": game.details.title};
        res.json(data);
      } else {
        res.json({"winner": "no"})
      }
    } catch(err) {
      res.json(err);
    }
    return res;
  })
app.post('/check-win', async function (req, res, next) {
  const run = new Run({purse: process.env.GAME_PURSE_PRIVATE_KEY, owner: process.env.GAME_OWNER_PRIVATE_KEY, trust: "*"})
  console.log(req.query.location, req.query.gameId);
  const answers = await run.load(req.query.location);
  const game = await run.load(req.query.gameId);
  try{
    await game.sync();
    await answers.sync();
  }catch(err){
    res.json(err);
  }
  console.log("Game Owner:", game.owner);
  console.log("Answers Owner:", answers.owner);
  console.log("Answers Game:", answers.gameId);
  let tx = new Run.Transaction();
  tx.update(() => answers.check())
  let toFund = Math.round(game.satoshisForPlay / 2);
  console.log("To Fund:", game.satoshisForPlay, toFund)
  tx.update(() => game.fund(toFund))
  try {
   await tx.publish();
   await answers.sync();
   await game.sync();
   console.log("Answers Balance", answers.satoshis);
   console.log("Game Balance", game.satoshis);
   let toHash = answers.answers[0] + answers.answers[1]   + answers.answers[2]  + answers.answers[3]  + answers.answers[4];
   const hashDigest = SHA256(toHash);
   const hmacDigest = Base64.stringify(hmacSHA512(1 + hashDigest, run.purse.privkey));
   console.log("toHash, ", toHash, "hashDigest: ", hashDigest, ", hmacDigest: ", hmacDigest, game.winningHash);
   answers.resetOwner()
   await answers.sync()
   console.log("Answers Owner:", answers.owner);
   let hashWin = game.winningHash;
      // const winHashDigest = SHA256(hashWin);
      // const winHmacDigest = Base64.stringify(hmacSHA512(1 + winHashDigest, run.purse.privkey));
      if(hmacDigest.toString() === hashWin.toString()){
        console.log("Winning Play!", game.owner);
        let toWin = await run.load(game.location);
        await toWin.sync();
        toWin.win(answers.address_for_winning);
        await game.sync();
        let data = {"winner": "YES!", "winning_hash": hmacDigest, "gameTitle": game.details.title};
        res.json(data);
      } else {
        res.json({"winner": "no"})
      }
    } catch(err) {
      res.json(err);
    }
    return res;
  })

// start the server listening for requests
app.listen(process.env.PORT || 3000, 
  () => {console.log("Server is running...");})

