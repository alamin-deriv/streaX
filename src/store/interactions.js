import { ethers } from "ethers";
import TOKEN_ABI from "../abis/Token.json";

export const loadProvider = (dispatch) => {
  const connection = new ethers.providers.Web3Provider(window.ethereum);
  dispatch({ type: "PROVIDER_LOADED", connection });

  return connection;
};

export const loadNetwork = async (provider, dispatch) => {
  const { chainId } = await provider.getNetwork();
  dispatch({ type: "NETWORK_LOADED", chainId });

  return chainId;
};

export const loadAccount = async (provider, dispatch) => {
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  const account = ethers.utils.getAddress(accounts[0]);

  dispatch({ type: "ACCOUNT_LOADED", account });

  let balance = await provider.getBalance(account);
  balance = ethers.utils.formatEther(balance);

  dispatch({ type: "ETHER_BALANCE_LOADED", balance });

  return account;
};

export const loadToken = async (provider, address, dispatch) => {
  let token, symbol, totalSupply;

  token = new ethers.Contract(address, TOKEN_ABI, provider);
  symbol = await token.symbol();
  totalSupply = ethers.utils.formatUnits(await token.totalSupply(), 18);

  dispatch({ type: "TOKEN_LOADED", token, symbol, totalSupply });

  return token;
};

export const subscribeToEvents = (token, provider, tokenAddress, dispatch) => {
  token.on("Mint", (address, to, amount, event) => {
    dispatch({ type: "SUCCESS", event });
    loadToken(provider, tokenAddress, dispatch);
  });

  token.on("Transfer", (address, to, amount, event) => {
    dispatch({ type: "SUCCESS", event });
  });
};

// ------------------------------------------------------------------------------
// LOAD USER BALANCE (WALLET)

export const loadBalances = async (token, account, dispatch) => {
  let balance = ethers.utils.formatUnits(await token.balanceOf(account), 18);

  dispatch({ type: "TOKEN_BALANCE_LOADED", balance });
};

// ------------------------------------------------------------------------------
// MINT TOKENS

export const mintTokens = async (
  provider,
  token,
  amount,
  account,
  dispatch
) => {
  let transaction;

  dispatch({ type: "REQUEST" });

  try {
    const signer = await provider.getSigner();
    const amountToMint = ethers.utils.parseUnits(amount.toString(), 18);

    transaction = await token.connect(signer).mint(account, amountToMint);

    await transaction.wait();
  } catch (error) {
    dispatch({ type: "FAIL" });
  }
};

// ------------------------------------------------------------------------------
// TRANSFER TOKENS

export const transferTokens = async (provider, token, to, amount, dispatch) => {
  let transaction;

  dispatch({ type: "REQUEST" });

  try {
    const signer = await provider.getSigner();
    const amountToTransfer = ethers.utils.parseUnits(amount.toString(), 18);

    transaction = await token.connect(signer).transfer(to, amountToTransfer);
    await transaction.wait();
  } catch (error) {
    dispatch({ type: "FAIL" });
  }
};

