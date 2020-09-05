const NETWORK = 'testnet'
// REST API servers.
const MAINNET_API_FREE = 'https://free-main.fullstack.cash/v3/'
const TESTNET_API_FREE = 'https://tapi.fullstack.cash/v3/'
const BCHJS = require('@chris.troutner/bch-js')
const fs = require("fs")

// Instantiate bch-js based on the network.
let bchjs=new BCHJS({ restURL:'https://free-main.fullstack.cash/v3/' })

// module.exports=async function(){
//     try {
//         const outObj = {}
// let mnemonic = bchjs.Mnemonic.generate(128);
// // create seed buffer from mnemonic
// let seedBuffer = await bchjs.Mnemonic.toSeed(mnemonic);
// // create HDNode from seed buffer
// let hdNode = bchjs.HDNode.fromSeed(seedBuffer);
// // to extended public key
// outObj.public_key=bchjs.HDNode.toXPub(hdNode);
// outObj.mnemonic=mnemonic
// outObj.private_key=bchjs.HDNode.toXPriv(hdNode);
// outObj.cashAddress=bchjs.HDNode.toCashAddress(hdNode);
// outObj.wif=bchjs.HDNode.toWIF(hdNode);
// fs.writeFile("wallet-two.json", JSON.stringify(outObj, null, 2), function(err) {
//     if (err) return console.error(err)
//     console.log(`wallet.json written successfully.`)
//   })
//     } catch (error) {
//         console.log(error)
//         return error
//     }
// }
async function create(){
    try {
     let network=await   bchjs.Control.getNetworkInfo()
     console.log(network,"network")
        const outObj = {}
let mnemonic = bchjs.Mnemonic.generate(128);
// create seed buffer from mnemonic
let seedBuffer = await bchjs.Mnemonic.toSeed(mnemonic);
// create HDNode from seed buffer
let hdNode = bchjs.HDNode.fromSeed(seedBuffer);
// to extended public key
outObj.public_key=bchjs.HDNode.toXPub(hdNode);
outObj.mnemonic=mnemonic
outObj.private_key=bchjs.HDNode.toXPriv(hdNode);
outObj.cashAddress=bchjs.HDNode.toCashAddress(hdNode);
outObj.wif=bchjs.HDNode.toWIF(hdNode);
outObj.slpAddress=bchjs.SLP.HDNode.toSLPAddress(hdNode);
fs.writeFile("wallet-main.json", JSON.stringify(outObj, null, 2), function(err) {
    if (err) return console.error(err)
    console.log(`wallet.json written successfully.`)
  })
  return outObj
    } catch (error) {
        console.log(error)
        return error
    }
}
// create().then(res=>{
// console.log(res)
// })
bchjs.Price.current('usd').then(res=>{
    console.log(res,'bch')
}).catch(error=>{
    console.log(error)
})

