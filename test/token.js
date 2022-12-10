const { ethers } = require("hardhat");
const { expect } = require("chai");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Token", () => {
  let token, accounts, deployer, receiver, exchange;

  beforeEach(async () => {
    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy("streaX", "STREAX", 100);

    accounts = await ethers.getSigners();
    deployer = accounts[0];
    receiver = accounts[1];
    exchange = accounts[2];
  });

  describe("Deployment", () => {
    const name = "streaX";
    const symbol = "STREAX";
    const decimals = "18";
    const totalSupply = tokens(100);

    it("Has correct name", async () => {
      expect(await token.name()).to.equal(name);
    });

    it("Has correct symbol", async () => {
      expect(await token.symbol()).to.equal(symbol);
    });

    it("Has correct decimals", async () => {
      expect(await token.decimals()).to.equal(decimals);
    });

    it("Has correct total supply", async () => {
      expect(await token.totalSupply()).to.equal(totalSupply);
    });

  });

  describe("Issue Tokens", () => {
    let amount, result;

    describe("Success", () => {
      beforeEach(async () => {
        amount = tokens(100);
        const mint = await token
          .connect(deployer)
          .mint(deployer.address, amount);

        result = await mint.wait();
      });
      it("Mint token balances", async () => {
        expect(await token.balanceOf(deployer.address)).to.equal(
          tokens(100)
        );
        expect(await token.totalSupply()).to.equal(tokens(200));
      });

      it("Emits a Transfer event", async () => {
        const event = result.events[0];
        expect(event.event).to.equal("Mint");

        const args = event.args;


        expect(args.from).to.equal(
          "0x0000000000000000000000000000000000000000"
        );
        expect(args.to).to.equal(deployer.address);
        expect(args.value).to.equal(amount);
      });
    });

    describe("Failure", () => {
      it("rejects if amount is 0 ", async () => {
        const invalidAmount = tokens(0);
        await expect(
          token.connect(deployer).mint(deployer.address, invalidAmount)
        ).to.reverted;
      });

      it("rejects invalid mint recipent", async () => {
        const invalidAmount = tokens(100);
        await expect(
          token
            .connect(deployer)
            .transfer(
              "0x0000000000000000000000000000000000000000",
              invalidAmount
            )
        ).to.reverted;
      });
    });
  });

  describe("Sending Tokens", () => {
    let amount, transaction, result;

    describe("Success", () => {
      beforeEach(async () => {
        amount = tokens(100);
        await token.connect(deployer).mint(deployer.address, amount);
        transaction = await token
          .connect(deployer)
          .transfer(receiver.address, tokens(10));
        result = await transaction.wait();
      });
      it("Transfer token balances", async () => {
        expect(await token.balanceOf(deployer.address)).to.equal(
          tokens(90)
        );
        expect(await token.balanceOf(receiver.address)).to.equal(tokens(10));
      });

      it("Emits a Transfer event", async () => {
        const event = result.events[0];
        expect(event.event).to.equal("Transfer");

        const args = event.args;
        expect(args.from).to.equal(deployer.address);
        expect(args.to).to.equal(receiver.address);
        expect(args.value).to.equal(tokens(10));
      });
    });

    describe("Failure", () => {
      it("rejects insufficient balances", async () => {
        const invalidAmount = tokens(100000000);
        await expect(
          token.connect(deployer).transfer(receiver.address, invalidAmount)
        ).to.reverted;
      });

      it("rejects invalid recipent", async () => {
        const invalidAmount = tokens(100);
        await expect(
          token
            .connect(deployer)
            .transfer(
              "0x0000000000000000000000000000000000000000",
              invalidAmount
            )
        ).to.reverted;
      });
    });
  });

  describe("Approving Tokens", () => {
    let amount, transaction, result;

    beforeEach(async () => {
      amount = tokens(100);
      await token.connect(deployer).mint(deployer.address, amount);
      transaction = await token
        .connect(deployer)
        .approve(exchange.address, tokens(10));
      result = await transaction.wait();
    });

    describe("Success", () => {
      it("allocates an allowance for delegated token spending", async () => {
        expect(
          await token.allowance(deployer.address, exchange.address)
        ).to.equal(tokens(10));
      });

      it("emits an Approval event", async () => {
        const event = result.events[0];
        expect(event.event).to.equal("Approval");

        const args = event.args;
        expect(args.owner).to.equal(deployer.address);
        expect(args.spender).to.equal(exchange.address);
        expect(args.value).to.equal(tokens(10));
      });
    });

    describe("Failure", () => {
      it("rejects invalid spenders", async () => {
        await expect(
          token
            .connect(deployer)
            .approve("0x0000000000000000000000000000000000000000", amount)
        ).to.be.reverted;
      });
    });
  });

  describe("Delegated Token Transfers", () => {
    let amount, transaction, result;

    beforeEach(async () => {
      amount = tokens(100);
      await token.connect(deployer).mint(deployer.address, amount);
      transaction = await token
        .connect(deployer)
        .approve(exchange.address, tokens(10));
      result = await transaction.wait();
    });

    describe("Success", () => {
      beforeEach(async () => {
        transaction = await token
          .connect(exchange)
          .transferFrom(deployer.address, receiver.address, tokens(10));
        result = await transaction.wait();
      });

      it("transfers token balances", async () => {
        expect(await token.balanceOf(deployer.address)).to.be.equal(
          ethers.utils.parseUnits("90", "ether")
        );
        expect(await token.balanceOf(receiver.address)).to.be.equal(
          tokens(10)
        );
      });

      it("rests the allowance", async () => {
        expect(
          await token.allowance(deployer.address, exchange.address)
        ).to.be.equal(0);
      });

      it("emits a Transfer event", async () => {
        const event = result.events[0];
        expect(event.event).to.equal("Transfer");

        const args = event.args;
        expect(args.from).to.equal(deployer.address);
        expect(args.to).to.equal(receiver.address);
        expect(args.value).to.equal(tokens(10));
      });
    });

    describe("Failure", () => {
      it("attempt to transfer too many tokens", async () => {
        const invalidAmount = tokens(100000000); // 100 Million, greater than total supply
        await expect(
          token
            .connect(exchange)
            .transferFrom(deployer.address, receiver.address, invalidAmount)
        ).to.be.reverted;
      });
    });
  });
});
