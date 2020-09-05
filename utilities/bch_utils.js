const NETWORK = 'testnet'
// REST API servers.
const MAINNET_API_FREE = 'https://free-main.fullstack.cash/v3/'
const TESTNET_API_FREE = 'https://tapi.fullstack.cash/v3/'
const BCHJS = require('@chris.troutner/bch-js')
const fs = require("fs")
const token_value_data=[{
  range:{
    from:0,
    to:100
  },
  bch_value:0.45
},
{
  range:{
    from:100,
    to:1000
  },
  bch_value:0.5
},
{
  range:{
    from:1000,
    to:5000
  },
  bch_value:0.55
},
{
  range:{
    from:5000,
    to:25000
  },
  bch_value:0.6
},
{
  range:{
    from:25000,
    to:100000
  },
  bch_value:0.65
},
{
  range:{
    from:100000,
    to:500000
  },
  bch_value:0.7
},
{
  range:{
    from:500000,
    to:1000000
  },
  bch_value:0.75
},
{
  range:{
    from:1000000,
    to:2500000
  },
  bch_value:0.8
},
{
  range:{
    from:2500000,
    to:5000000
  },
  bch_value:0.85
},
{
  range:{
    from:5000000,
    to:7500000
  },
  bch_value:0.9
},
{
  range:{
    from:7500000,
    to:10000000
  },
  bch_value:0.95
},
{
  range:{
    from:10000000,
    to:50000000
  },
  bch_value:0.85
},
]
const formula="[total posts x total comments x total likes] / [followers * following] / 1000"
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
exports.createAdddress=async function create(){
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
// fs.writeFile("wallet-main.json", JSON.stringify(outObj, null, 2), function(err) {
//     if (err) return console.error(err)
//     console.log(`wallet.json written successfully.`)
//   })
return outObj
    } catch (error) {
        console.log(error)
        return error
    }
}
exports.getTokenValue=async function(amount,total_post,total_comment,total_likes,followers,following){
  try {
    let value=((total_post*total_comment*total_likes)/(followers*following))/1000
    let bch_value=token_value_data.find(x=>value>x.range.from && value<=x.range.to)
    let dollar_bch=await bchjs.Price.current('usd')
    return {
      value:value,
      bch:amount/(dollar_bch/100),
      token:(amount/(dollar_bch/100))/bch_value.bch_value
    }
  } catch (error) {
    console.log(error)
  }
}

