import { useEffect } from 'react';
import config from '../config.json';
import { useDispatch } from "react-redux";

import Navbar from "./Navbar";
import TotalSupply from "./TotalSupply";
import MintToken from "./MintToken";
import Transfer from "./Transfer";



import {
  loadProvider,
  loadNetwork,
  loadAccount,
  loadToken,
  subscribeToEvents,
} from "../store/interactions";

function App() {
  const dispatch = useDispatch();

  const loadBlockchainData = async () => {
    // Connect Ethers to blockchain
    const provider = loadProvider(dispatch);

    // Fetch current network's chainId (e.g. hardhat: 31337, goerli: 5)
    const chainId = await loadNetwork(provider, dispatch);

    // Reload page when network changes
    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });

    // Fetch current account & balance from Metamask when changed
    window.ethereum.on("accountsChanged", () => {
      loadAccount(provider, dispatch);
    });

    // Token Smart Contract

    const STREAX = config[chainId].STREAX;
    const token = await loadToken(provider, STREAX.address, dispatch);

    // // Listen to events
    subscribeToEvents(token, provider, STREAX.address, dispatch);
  };

  useEffect(() => {
    loadBlockchainData();
  });

  return (
    <div>
      <Navbar />

      <main className="exchange grid">
        <section className="exchange__section--left grid">
          <TotalSupply />
          <MintToken />
          <Transfer />
        </section>
        <section className="exchange__section--right grid"></section>
      </main>
    </div>
  );
}

export default App;
