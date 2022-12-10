import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import dapp from "../assets/naira.png";

import { loadBalances, mintTokens } from "../store/interactions";

const MintToken = () => {
  const [amount, setAmount] = useState(0);

  const dispatch = useDispatch();

  const provider = useSelector((state) => state.provider.connection);
  const account = useSelector((state) => state.provider.account);

  const transferInProgress = useSelector(
    (state) => state.tokens.transferInProgress
  );

  const tokens = useSelector((state) => state.tokens.contracts);
  const symbols = useSelector((state) => state.tokens.symbols);
  const tokenBalance = useSelector((state) => state.tokens.balance);

  const amountHandler = (e, token) => {
    setAmount(e.target.value);
  };

  const mintHandler = (e, token) => {
    e.preventDefault();

    mintTokens(provider, token, amount, account, dispatch);
  };

  useEffect(() => {
    if (tokens && account) {
      loadBalances(tokens, account, dispatch);
    }
  }, [tokens, account, transferInProgress, dispatch]);

  return (
    <div className="component exchange__transfers">
      <div className="component__header flex-between">
        <div />
        <div className="tabs">
          <button className="tab tab--active">Mint Tokens</button>
        </div>
      </div>

      <div className="exchange__transfers--form">
        <div className="flex-between">
          <p>
            <small>Token</small>
            <br />
            <img src={dapp} alt="Token Logo" width="20px" />
            {symbols && symbols}
          </p>
          <p>
            <small>Wallet</small>
            <br />
            {tokenBalance && tokenBalance}
          </p>
        </div>

        <form onSubmit={(e) => mintHandler(e, tokens)}>
          <label htmlFor="token0">Enter Amount</label>
          <input
            type="text"
            id="token0"
            placeholder="0.0000"
            value={amount === 0 ? "" : amount}
            onChange={(e) => amountHandler(e)}
          />

          <button className="button" type="submit">
            <span>Mint</span>
          </button>
        </form>
      </div>

      <hr />
    </div>
  );
};

export default MintToken;
