import { LitNodeClient } from "@lit-protocol/lit-node-client";
import {
  serializeTransaction,
  parseEther,
  toBytes,
  http,
  keccak256,
  createPublicClient,
  encodeFunctionData,
} from "viem";
import { LIT_NETWORK, LIT_RPC, LIT_ABILITY } from "@lit-protocol/constants";
import { getChainInfo, getEnv } from "./utils";
import { baseSepolia } from "viem/chains";
import {
  LitActionResource,
  LitPKPResource,
  createSiweMessageWithRecaps,
  generateAuthSig,
} from "@lit-protocol/auth-helpers";
import { JsonRpcProvider, Wallet } from "ethers";
import { storeAbi, storeContractAddress } from "./contract-constants";

const ETHEREUM_PRIVATE_KEY = getEnv("ETHEREUM_PRIVATE_KEY");
const SELECTED_LIT_NETWORK = LIT_NETWORK.Datil;
const LIT_CAPACITY_CREDIT_TOKEN_ID = getEnv("LIT_CAPACITY_CREDIT_TOKEN_ID");
const LIT_PKP_PUBLIC_KEY = getEnv("LIT_PKP_PUBLIC_KEY");
const LIT_PKP_ADDRESS = getEnv("LIT_PKP_ADDRESS");
const CHAIN_TO_SEND_TX_ON = getEnv("CHAIN_TO_SEND_TX_ON");

const client = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

async function signWithLit(bytesDigest: any) {
  const litNodeClient = new LitNodeClient({
    litNetwork: LIT_NETWORK.DatilDev,
    debug: false,
  });

  await litNodeClient.connect();
  const chainInfo = getChainInfo(CHAIN_TO_SEND_TX_ON);

  const ethersWallet = new Wallet(
    ETHEREUM_PRIVATE_KEY,
    new JsonRpcProvider(chainInfo.rpcUrl)
  );
  const { capacityDelegationAuthSig } =
    await litNodeClient.createCapacityDelegationAuthSig({
      dAppOwnerWallet: ethersWallet,
      capacityTokenId: LIT_CAPACITY_CREDIT_TOKEN_ID, // replace with your token ID
      delegateeAddresses: [LIT_PKP_ADDRESS], // replace with your delegatee address
      uses: "1",
      expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
    });

  const sessionSigs = await litNodeClient.getSessionSigs({
    chain: CHAIN_TO_SEND_TX_ON,
    capabilityAuthSigs: [capacityDelegationAuthSig],
    expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours
    resourceAbilityRequests: [
      {
        resource: new LitPKPResource("*"),
        ability: LIT_ABILITY.PKPSigning,
      },
      {
        resource: new LitActionResource("*"),
        ability: LIT_ABILITY.LitActionExecution,
      },
    ],
    authNeededCallback: async ({
      resourceAbilityRequests,
      expiration,
      uri,
    }) => {
      const toSign = await createSiweMessageWithRecaps({
        uri: uri!,
        expiration: expiration!,
        resources: resourceAbilityRequests!,
        walletAddress: ethersWallet.address,
        nonce: await litNodeClient.getLatestBlockhash(),
        litNodeClient,
      });

      return await generateAuthSig({
        signer: ethersWallet,
        toSign,
      });
    },
  });

  const litActionCode = `const go = async () => {
        // this is the string "Hello World" for testing
        // this requests a signature share from the Lit Node
        // the signature share will be automatically returned in the HTTP response from the node
        const sigShare = await Lit.Actions.signEcdsa({
        toSign,
        publicKey, // <-- You should pass this in jsParam
        sigName,
        });
    };
    
    go();
    `;

  const results = await litNodeClient.executeJs({
    sessionSigs,
    code: litActionCode,
    jsParams: {
      toSign: bytesDigest,
      publicKey: LIT_PKP_PUBLIC_KEY,
      sigName: "sig1",
    },
  });
  return results;
}

async function serializeAndConnectToLit(ethTx: any) {
  console.log("ethTx", ethTx);

  try {

    const preparedTx = await client.prepareTransactionRequest(ethTx);
    preparedTx.nonce = await client.getTransactionCount({address:LIT_PKP_ADDRESS as `0x${string}`})

    const serialized = serializeTransaction(preparedTx );
    const digest = keccak256(serialized);
    const bytesDigest = toBytes(digest);

    console.log("bytest", {bytesDigest, preparedTx});
    const results = await signWithLit(bytesDigest);

    const sig = results.signatures.sig1;
    
    console.log("eth_tx rgt before serializing", preparedTx);

    const signedTx = serializeTransaction(
      preparedTx ,
      {
        r: sig.r,
        s: sig.s,
        yParity: sig.recid,
      }
    );
    await client.sendRawTransaction({ serializedTransaction: signedTx });
  } catch (err) {
    console.error("HERE!", err);
    throw err;
  }
}

function fetchTx() {
  const functionName = "store";
  const functionArgs = [BigInt(3)] as const;

  const encodedData = encodeFunctionData({
    abi: storeAbi,
    functionName,
    args: functionArgs,
  });

  // Bare transaction object
  let eth_tx: any = {
    to: storeContractAddress,
    from: LIT_PKP_ADDRESS,
    value: parseEther("0"),
    data: encodedData, 
  };
  return eth_tx;
}

const ethTx = fetchTx();

serializeAndConnectToLit(ethTx).then(() => console.log("Done exec"));
