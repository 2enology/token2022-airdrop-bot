import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { CronJob } from "cron";
import { receivedTXModal } from "./models/transaction";
import {
  Connection,
  PublicKey,
  Keypair,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { buildTransaction, token2022Transfer } from "./SplTokenTransfer";
import { config } from "./config";
import { Data } from "./type";

const connection = new Connection(config.SOLANA_RPC_URL);
const teamAccountAddress = new PublicKey(config.SOL_VAULT_WALLET);

const app = express();
const port = config.PORT;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.set("strictQuery", true);
mongoose
  .connect("mongodb://127.0.0.1:27017/toekn2022_airdrop")
  .then(async () => {
    console.log("==========> Server is running! ⏲  <==========");
    app.listen(port, () => {
      console.log(`==========> Connected MongoDB 👌  <==========`);
    });
  })
  .catch((err) => {
    console.log("Cannot connect to the bot! 😩", err);
    process.exit();
  });

app.get("/", () => {
  console.log("server is running!");
});

async function handleAccountChange(accountInfo: any) {
  // Fetch full transaction details using the transaction signature
  if (accountInfo.signature) {
    const transaction = await connection.getParsedConfirmedTransaction(
      accountInfo.signature,
      "confirmed"
    );

    if (transaction && transaction.meta && transaction.blockTime) {
      const receiver: string =
        transaction.transaction.message.accountKeys[1].pubkey.toBase58(); // Get the receiver's public key

      const sender: string =
        transaction.transaction.message.accountKeys[0].pubkey.toBase58(); // Get the sender's public key
      const amount: number =
        transaction.meta.preBalances[0] - transaction.meta.postBalances[0]; // Calculate amount transferred
      const sentTime: Date = new Date(transaction.blockTime * 1000); // Convert blockTime to a Date object

      try {
        if (
          sender &&
          sentTime &&
          amount &&
          receiver === teamAccountAddress.toBase58()
        ) {
          const newData = new receivedTXModal({
            signature: accountInfo.signature,
            sender: sender,
            sentTime: sentTime,
            amount: amount,
            status: 0,
          });

          // Save the new deposit data
          const res = await newData.save();
          console.log("Sol Received Data saved successfully.", res);
        } else {
          console.error("Missing required data.");
        }
      } catch (error) {
        console.error("An error occurred while saving data:", error);
      }
    }
  }
}

const subscriptionId = connection.onAccountChange(
  teamAccountAddress,
  async (accountData: any) => {
    await handleAccountChange(accountData);
  },
  "confirmed"
);

const subscriptionIdos = connection.onLogs(
  teamAccountAddress,
  async (accountData: any) => {
    await handleAccountChange(accountData);
  },
  "confirmed"
);

// Close the subscription gracefully
process.on("SIGINT", () => {
  console.log("Closing subscription");
  connection.removeProgramAccountChangeListener(subscriptionId);
  connection.removeProgramAccountChangeListener(subscriptionIdos);
  process.exit();
});

// Airdrop Token 2022 according to the Sol deposit
async function withdrawToken() {
  try {
    const transactions = await receivedTXModal.find({ status: 0 });

    const keypair = Keypair.fromSecretKey(
      Buffer.from(bs58.decode(config.SOLANA_PRIVATE as string))
    );

    const chunkSize = 5;

    for (let i = 0; i < transactions.length; i += chunkSize) {
      const blocks = transactions.slice(i, i + chunkSize);

      const pubkeys = blocks.map((block) => {
        return new PublicKey(block.sender as string);
      });

      const amounts = blocks.map((block) => {
        return block.amount ? block.amount : 0;
      });

      // let fullData: Data[] = [];

      // await Promise.all(
      //   blocks.map(async (block) => {
      //     const data: Data = {
      //       receiver: new PublicKey(block.sender as string),
      //       amount: block.amount ? block.amount : 0,
      //       signature: block.signature,
      //     };
      //     fullData.push(data);
      //   })
      // );

      // await token2022Transfer(
      //   connection,
      //   keypair.publicKey,
      //   new PublicKey(config.SOL_TOKEN_ADDRESS),
      //   config.SOL_TOKEN_DECIMAL,
      //   fullData,
      //   keypair
      // );

      const transaction = await buildTransaction(
        connection,
        keypair.publicKey,
        new PublicKey(config.SOL_TOKEN_ADDRESS as string),
        config.SOL_TOKEN_DECIMAL,
        pubkeys,
        amounts,
        keypair
      );

      try {
        const signature = await sendAndConfirmTransaction(
          connection,
          transaction,
          [keypair]
        );
        await Promise.all(
          blocks.map(async (block, index) => {
            await receivedTXModal.updateOne(
              { signature: block.signature },
              { status: 1, signature: signature }
            );
          })
        );
      } catch (e) {
        console.log(e);
      }
    }

    console.log("==========> Nothing to update! 😒 <==========");
  } catch (error) {
    console.error("Error:", error);
  }
}

// Process sol token withdraw every 10s
const cronWithdraw = new CronJob("*/30 * * * * *", async () => {
  await withdrawToken();
});

if (!cronWithdraw.running) {
  cronWithdraw.start();
}
