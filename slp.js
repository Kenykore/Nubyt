const BITBOXSDK = require("@chris.troutner/bch-js")
const BigNumber = require('bignumber.js');
const slpjs = require('slpjs');

// FOR MAINNET UNCOMMENT
const bchjs = new BITBOXSDK({ restURL: 'https://tapi.fullstack.cash/v3' });
const fundingAddress           = "slptest:qrs35yl77rharvewc2qm87vqp360hw4n9q6y59yh4p";  // <-- must be simpleledger format
const fundingWif               = "cNyqmcMqo7c2LGEvHuMR9NTubfK7xX2vRoY2CFw1TEZo2HP7Lyzt";     // <-- compressed WIF format
const tokenReceiverAddress     = "slptest:qrs35yl77rharvewc2qm87vqp360hw4n9q6y59yh4p";  // <-- must be simpleledger format
const bchChangeReceiverAddress = "slptest:qrs35yl77rharvewc2qm87vqp360hw4n9q6y59yh4p";  // <-- cashAddr or slpAddr format
// For unlimited issuance provide a "batonReceiverAddress"
const batonReceiverAddress     = "slptest:qrs35yl77rharvewc2qm87vqp360hw4n9q6y59yh4p";

// FOR TESTNET UNCOMMENT
// const BITBOX = new BITBOXSDK.BITBOX({ restURL: 'https://trest.bitcoin.com/v2/' });
// const fundingAddress           = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";
// const fundingWif               = "cVjzvdHGfQDtBEq7oddDRcpzpYuvNtPbWdi8tKQLcZae65G4zGgy";
// const tokenReceiverAddress     = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";
// const bchChangeReceiverAddress = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";
// // For unlimited issuance provide a "batonReceiverAddress"
// const batonReceiverAddress     = "slptest:qpwyc9jnwckntlpuslg7ncmhe2n423304ueqcyw80l";

//const bitboxNetwork = new slpjs.BitboxNetwork(BITBOX);
async function fetchBalance(){
    try {
        // let mnemonic = bchjs.Mnemonic.generate(128);
        // // create seed buffer from mnemonic
        // let seedBuffer = await bchjs.Mnemonic.toSeed(mnemonic);
        // // create HDNode from seed buffer
        // let hdNode =await bchjs.SLP.HDNode.fromSeed(seedBuffer);
        // console.log(hdNode,"node")
        // to cash address
      let add=await  bchjs.SLP.HDNode.toSLPAddress("");
        console.log(add,"address slp")
        return add
    } catch (error) {
        console.log(error)
    }
}
// 1) Get all balances at the funding address.


// WAIT FOR NETWORK RESPONSE...
async function generateUserToken(){
    try {
       let balances=await fetchBalance()
       return
       let decimals = 2;
       let name = "Awesome SLPJS README Token";
       let ticker = "NUBYTJS";
       let documentUri = "info@nubyt.co";
       let documentHash = null
       let initialTokenQty = 10000000
       
       // 3) Calculate the token quantity with decimal precision included
       initialTokenQty = (new BigNumber(initialTokenQty)).times(10**decimals);
       console.log(initialTokenQty,"initial token qty")
       // 4) Set private keys
       console.log("balances",balances)
       balances.nonSlpUtxos.forEach(txo => txo.wif = fundingWif)
       let genesisTxid = await bitboxNetwork.simpleTokenGenesis(
        name, 
        ticker, 
        initialTokenQty,
        documentUri,
        documentHash,
        decimals,
        tokenReceiverAddress,
        batonReceiverAddress,
        bchChangeReceiverAddress,
        balances.nonSlpUtxos
        )
    console.log("GENESIS txn complete:",genesisTxid)
    fs.writeFile("wallet-slp-info-token-id.txt", genesisTxid, function(err) {
        if (err) return console.error(err)
      
        console.log(`wallet-slp-info.txt written successfully.`)
      })
    } catch (error) {
        console.log(error)
    }
}
generateUserToken().then(res=>{
    console.log("done")
})