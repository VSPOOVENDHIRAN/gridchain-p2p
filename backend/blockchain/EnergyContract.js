const { getWeb3, getGanacheProvider } = require("../controllers/ganachecontroller");
const ABI = require("./EnergyTrading.abi.json");

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// ======================================================
// CREATE SELL OFFER (ON-CHAIN) – STABLE
// ======================================================
async function createSellerOfferOnChain(seller, units, price) {
  try { 
   // console.log("Starting createSellerOfferOnChain with:", { seller, units, price });
    const web3 = getWeb3();
    const ganacheProvider = getGanacheProvider();
    console.log("Creating seller offer on-chain:", { seller, units, price });
    if (!web3 || !ganacheProvider) {
      throw new Error("Ganache not started");
    }
   // console.log("Web3 and Ganache provider obtained");
    const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

    const accounts = ganacheProvider.getInitialAccounts();
    const acc = accounts[seller.toLowerCase()];
    //console.log("Account for seller:", acc);
    if (!acc) throw new Error("Seller not a Ganache account");

    const nonce = await web3.eth.getTransactionCount(seller, "pending");
    const gasPrice = await web3.eth.getGasPrice();
   // console.log("Nonce and gas price obtained:", { nonce, gasPrice });
    const data = contract.methods
      .createSellerOffer(units, price)
      .encodeABI();
   //     console.log("Encoded ABI data:", data);
    const signedTx = await web3.eth.accounts.signTransaction(
      {
        type: 0,               // legacy
        from: seller,
        to: CONTRACT_ADDRESS,
        data,
        gas: 300000,
        gasPrice,
        nonce
      },
      acc.secretKey
    );

  ///  console.log("Signed transaction:", signedTx);

    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );
    console.log("Transaction receipt:", receipt);
    return { success: true, txHash: receipt.transactionHash };

  } catch (err) {
    console.error("CREATE OFFER CHAIN ERROR:", err.message);
    return { success: false, error: err.message };
  }
}

// ======================================================
// BUYER CONFIRM (ON-CHAIN) – STABLE
// ======================================================
async function buyerConfirmOnChain(buyer, seller, units) {
  try {
    const web3 = getWeb3();
    const ganacheProvider = getGanacheProvider();

    if (!web3 || !ganacheProvider) {
      throw new Error("Ganache not started");
    }
 //  console.log("Creating buyer confirm on-chain:", { buyer, seller, units });
    const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
   console.log("Contract instance created");
    const accounts = ganacheProvider.getInitialAccounts();
    const acc = accounts[buyer.toLowerCase()];
    if (!acc) throw new Error("Buyer not a Ganache account");
    console.log("Account for buyer:", acc);
    const nonce = await web3.eth.getTransactionCount(buyer, "pending");
    const gasPrice = await web3.eth.getGasPrice();
      
 //   console.log("Buyer:", buyer);
//console.log("Seller:", seller);
//console.log("Units to buy:", units);
    console.log("Nonce and gas price obtained:", { nonce, gasPrice });

    const data = await contract.methods
      .buyerConfirm(seller, units)
      .encodeABI();

 //   console.log("Encoded ABI data for buyer confirm:", data);
    const signedTx = await web3.eth.accounts.signTransaction(
      {
        type: 0,
        from: buyer,
        to: CONTRACT_ADDRESS,
        data,
        gas: 300000,
        gasPrice,
        nonce
      },
      acc.secretKey
    );
    console.log("Signed transaction for buyer confirm:", signedTx);
   // const receipt = await web3.eth.sendSignedTransaction(
   //   signedTx.rawTransaction
   // );
   // console.log("Transaction receipt for buyer confirm:", receipt);

    return {
      success: true,
    //  txHash: receipt.transactionHash
    };

  } catch (err) {
    console.error("CHAIN ERROR:", err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  createSellerOfferOnChain,
  buyerConfirmOnChain
};