import {
  SystemProgram,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
  Connection,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createTransferCheckedInstruction,
  getOrCreateAssociatedTokenAccount,
  transferChecked,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, sendAndConfirmTransaction } from "@solana/web3.js";
import { web3 } from "@project-serum/anchor";
import { receivedTXModal } from "./models/transaction";
import { Data } from "./type";

export const getAssociatedTokenAccount = (
  ownerPubkey: PublicKey,
  mintPk: PublicKey
): PublicKey => {
  const associatedTokenAccountPubkey = PublicKey.findProgramAddressSync(
    [
      ownerPubkey.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      mintPk.toBuffer(), // mint address
    ],

    ASSOCIATED_TOKEN_PROGRAM_ID
  )[0];
  return associatedTokenAccountPubkey;
};

export const createAssociatedTokenAccountInstruction = (
  associatedTokenAddress: PublicKey,
  payer: PublicKey,
  walletAddress: PublicKey,
  splTokenMintAddress: PublicKey
) => {
  const keys = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
    { pubkey: walletAddress, isSigner: false, isWritable: false },
    { pubkey: splTokenMintAddress, isSigner: false, isWritable: false },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];
  return new TransactionInstruction({
    keys,
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data: Buffer.from([]),
  });
};

export const getATokenAccountsNeedCreate = async (
  connection: Connection,
  walletAddress: PublicKey,
  owner: PublicKey,
  nfts: PublicKey[],
  payer: PublicKey
) => {
  const instructions: any = [];
  const destinationAccounts: any = [];
  for (const mint of nfts) {
    const destinationPubkey = getAssociatedTokenAccount(owner, mint);
    let response = await connection.getAccountInfo(destinationPubkey);
    if (!response) {
      const createATAIx = createAssociatedTokenAccountInstruction(
        destinationPubkey,
        payer,
        owner,
        mint
      );
      instructions.push(createATAIx);
    }
    destinationAccounts.push(destinationPubkey);
    if (walletAddress != owner) {
      const userAccount = getAssociatedTokenAccount(walletAddress, mint);
      response = await connection.getAccountInfo(userAccount);
      if (!response) {
        const createATAIx = createAssociatedTokenAccountInstruction(
          userAccount,
          payer,
          walletAddress,
          mint
        );
        instructions.push(createATAIx);
      }
    }
  }
  return {
    instructions,
    destinationAccounts,
  };
};

export const buildSplTransferTx = async (
  connection: Connection,
  sender: PublicKey,
  tokenMint: PublicKey,
  tokenDecimal: number,
  receiver: PublicKey,
  amount: number,
  wallet: Keypair
) => {
  console.log("spl token transfer ....");
  let senderTokenAccount = getAssociatedTokenAccount(sender, tokenMint);
  console.log(
    "sendertokenaccount address ===> ",
    senderTokenAccount.toBase58()
  );

  let transaction = new web3.Transaction();

  const { instructions, destinationAccounts } =
    await getATokenAccountsNeedCreate(
      connection,
      receiver,
      receiver,
      [tokenMint],
      wallet.publicKey
    );
  const aTokenAddress = destinationAccounts[0];
  console.log("atokenaddress ===>", destinationAccounts[0]);
  if (instructions && instructions.length !== 0) {
    transaction.add(instructions[0]);
  }

  transaction.add(
    createTransferCheckedInstruction(
      senderTokenAccount,
      tokenMint,
      aTokenAddress,
      sender,
      amount * Math.pow(10, tokenDecimal),
      tokenDecimal
    )
  );
  const blockhash = await connection.getLatestBlockhash();

  transaction.feePayer = wallet.publicKey;
  transaction.recentBlockhash = blockhash.blockhash;

  const signature = await sendAndConfirmTransaction(connection, transaction, [
    wallet,
  ]);
  console.log("signature ==>", signature);
};

export const buildSplTokenTransferTx = async (
  connection: Connection,
  sender: PublicKey,
  tokenMint: PublicKey,
  amounts: number[],
  tokenDecimal: number,
  receivers: PublicKey[]
) => {
  const transaction = new web3.Transaction();

  for (let i = 0; i < amounts.length; i++) {
    const senderTokenAccount = getAssociatedTokenAccount(sender, tokenMint);

    const transferAmount = amounts[i] * Math.pow(10, tokenDecimal);

    const { instructions, destinationAccounts } =
      await getATokenAccountsNeedCreate(
        connection,
        sender,
        receivers[i],
        [tokenMint],
        sender
      );
    const aTokenAddress = destinationAccounts[0];

    if (instructions && instructions.length !== 0) {
      transaction.add(instructions[0]);
    }

    transaction.add(
      createTransferCheckedInstruction(
        senderTokenAccount,
        tokenMint,
        aTokenAddress,
        sender,
        transferAmount,
        tokenDecimal,
        [],
        new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb")
      )
    );
  }

  transaction.feePayer = sender;

  return transaction;
};

export const buildTransaction = async (
  connection: Connection,
  sender: PublicKey,
  tokenMint: PublicKey,
  tokenDecimal: number,
  receivers: PublicKey[],
  amounts: number[],
  wallet: Keypair
) => {
  const [address] = PublicKey.findProgramAddressSync(
    [sender.toBuffer(), TOKEN_2022_PROGRAM_ID.toBuffer(), tokenMint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const sendTokenAccount: PublicKey = address;

  let transaction = new web3.Transaction();

  await Promise.all(
    receivers.map(async (receiver, index) => {
      const receiveTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet,
        tokenMint,
        receiver,
        true,
        "confirmed",
        undefined,
        TOKEN_2022_PROGRAM_ID
      );

      console.log("receiveTokenAccount", receiveTokenAccount.address);

      transaction.add(
        createTransferCheckedInstruction(
          sendTokenAccount,
          tokenMint,
          receiveTokenAccount.address,
          sender,
          amounts[index],
          tokenDecimal,
          [wallet],
          TOKEN_2022_PROGRAM_ID
        )
      );

      const blockhash = await connection.getLatestBlockhash();

      transaction.feePayer = wallet.publicKey;
      transaction.recentBlockhash = blockhash.blockhash;
    })
  );

  return transaction;
};

export const token2022Transfer = async (
  connection: Connection,
  sender: PublicKey,
  tokenMint: PublicKey,
  tokenDecimal: number,
  fullData: Data[],
  wallet: Keypair
) => {
  const [address] = PublicKey.findProgramAddressSync(
    [sender.toBuffer(), TOKEN_2022_PROGRAM_ID.toBuffer(), tokenMint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const sendTokenAccount: PublicKey = address;

  await Promise.all(
    fullData.map(async (txs, index) => {
      const receiveTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet,
        tokenMint,
        txs.receiver,
        true,
        "confirmed",
        undefined,
        TOKEN_2022_PROGRAM_ID
      );

      console.log("=>Got the receiveTokenAccount");

      try {
        const signature = await transferChecked(
          connection,
          wallet,
          sendTokenAccount,
          tokenMint,
          receiveTokenAccount.address,
          sender,
          txs.amount,
          tokenDecimal,
          [wallet],
          { commitment: "confirmed" },
          TOKEN_2022_PROGRAM_ID
        );
        console.log(
          "===================================================================================================="
        );
        console.log("Confirmed :", signature);
        console.log(
          "===================================================================================================="
        );
        await receivedTXModal.updateOne(
          { signature: txs.signature },
          { status: 1, signature: signature }
        );
        console.log("==>Saved Sol Sent Data saved successfully.");

        return signature;
      } catch (error) {
        console.log("error", error);
      }
    })
  );
};
