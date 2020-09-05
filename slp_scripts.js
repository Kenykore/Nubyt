/*
  Create an HDNode wallet using bitbox. The mnemonic from this wallet
  will be used in future examples.
*/

const fs = require("fs")
const SLPSDK = require("slp-sdk");
//const BITBOX = require("bitbox-sdk").BITBOX
// Set NETWORK to either testnet or mainnet
const NETWORK = `testnet`

// Instantiate BITBOX based on the network.
const bitbox =
  NETWORK === `mainnet`
    ? new SLPSDK({ restURL: `https://api.fullstack.cash/v3` })
    : new SLPSDK({ restURL: `https://tapi.fullstack.cash/v3/` })

const lang = "english" // Set the language of the wallet.
function createAddress(){
// These objects used for writing wallet information out to a file.
let outStr = ""
const outObj = {}

// create 256 bit BIP39 mnemonic
const mnemonic = bitbox.Mnemonic.generate(
  128,
  bitbox.Mnemonic.wordLists()[lang]
)

console.log("BIP44 $BCH Wallet")
outStr += "BIP44 $BCH Wallet\n"
console.log(`128 bit ${lang} BIP39 Mnemonic: `, mnemonic)
outStr += `\n128 bit ${lang} BIP32 Mnemonic:\n${mnemonic}\n\n`
outObj.mnemonic = mnemonic

// root seed buffer
const rootSeed = bitbox.Mnemonic.toSeed(mnemonic)

// master HDNode
const masterHDNode = bitbox.HDNode.fromSeed(rootSeed, NETWORK)

// HDNode of BIP44 account
console.log(`BIP44 Account: "m/44'/145'/0'"`)
outStr += `BIP44 Account: "m/44'/145'/0'"\n`
outObj.slpAddress=bitbox.HDNode.toSLPAddress(masterHDNode);
outObj.cashAddress = bitbox.HDNode.toCashAddress(masterHDNode)
outObj.legacyAddress = bitbox.HDNode.toLegacyAddress(masterHDNode)
outObj.WIF = bitbox.HDNode.toWIF(masterHDNode)
// Generate the first 10 seed addresses.
// for (let i = 0; i < 10; i++) {
//   const childNode = masterHDNode.derivePath(`m/44'/145'/0'/0/${i}`)
//   console.log(`m/44'/145'/0'/0/${i}: ${bitbox.HDNode.toCashAddress(childNode)}`)
//   outStr += `m/44'/145'/0'/0/${i}: ${bitbox.HDNode.toCashAddress(childNode)}\n`

//   // Save the first seed address for use in the .json output file.
//   if (i === 0) {
   
//   }
// }

// Write the extended wallet information into a text file.
fs.writeFile("wallet-slp-info.txt", outStr, function(err) {
  if (err) return console.error(err)

  console.log(`wallet-slp-info.txt written successfully.`)
})

// Write out the basic information into a json file for other example apps to use.
fs.writeFile("wallet-slp.json", JSON.stringify(outObj, null, 2), function(err) {
  if (err) return console.error(err)
  console.log(`wallet-slp.json written successfully.`)
})
}
 async function createUserToken(){
   try {

    let token = await bitbox.TokenType1.create({
      fundingAddress: "slptest:qq27wk2th8hyu4xw5klqtwktrrg0d2xkhg6yj3qxev",
      fundingWif: "cRsDUYwi4pJdn3ZsEgd1tmMVEgAHJRhW71C5xzzUMNusPEm8mDPp",
      tokenReceiverAddress:
        "slptest:qq27wk2th8hyu4xw5klqtwktrrg0d2xkhg6yj3qxev",
      bchChangeReceiverAddress:
        "bchtest:qrs35yl77rharvewc2qm87vqp360hw4n9qpsn77q8u",
      batonReceiverAddress:
        "slptest:qq27wk2th8hyu4xw5klqtwktrrg0d2xkhg6yj3qxev",
      decimals: 2,
      name: "Test SLP SDK Token",
      symbol: "NUBYTTEST",
      documentUri: "badger@bitcoin.com",
      documentHash: null,
      initialTokenQty: 1000000
    });
    console.log(token);
    fs.writeFile("wallet-slp-info-token-id.txt", token, function(err) {
      if (err) return console.error(err)
    
      console.log(`wallet-slp-info.txt written successfully.`)
    })
   } catch (error) {
     console.log(error)
   }
 
}
createUserToken().then(res=>{
  console.log("done")
})
//createAddress()

