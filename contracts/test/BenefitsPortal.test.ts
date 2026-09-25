import { expect } from "chai";
import hre from "hardhat";

describe("BenefitsPortal", function () {
  let portal: any;
  let owner: any, sarah: any, attacker: any;
  let ethers: any;

  beforeEach(async function () {
    // Create a network connection — required in Hardhat 3
    const connection = await hre.network.connect();
    ethers = connection.ethers;
    const signers = await ethers.getSigners();
    [owner, sarah, attacker] = signers;

    const Portal = await ethers.getContractFactory("BenefitsPortal");
    portal = await Portal.deploy();

    // Fund the contract so it can pay benefits
    await owner.sendTransaction({
      to: await portal.getAddress(),
      value: ethers.parseEther("1.0"),
    });
  });

  it("Sarah can lock stake, claim benefit, and withdraw", async function () {
    const stake = await portal.getCurrentStake();
    await portal.connect(sarah).lockStake({ value: stake });
    await portal.connect(sarah).claimBenefit();

    // Fast-forward 60 seconds using network helpers
    const { networkHelpers } = await hre.network.connect();
    await networkHelpers.time.increase(61);

    await portal.connect(sarah).withdrawStake();
  });

  it("Owner can scale stake to 100x", async function () {
    await portal.connect(owner).triggerAttackDetection(100);
    const newStake = await portal.getCurrentStake();
    expect(newStake).to.equal(ethers.parseEther("0.1"));
  });

  it("Slash can only execute after dispute window", async function () {
    const stake = await portal.getCurrentStake();
    await portal.connect(attacker).lockStake({ value: stake });
    await portal.connect(owner).submitSlashProposal([attacker.address]);

    await expect(portal.connect(owner).executeSlash())
      .to.be.revertedWith("Dispute window active");

    const { networkHelpers } = await hre.network.connect();
    await networkHelpers.time.increase(31);

    await portal.connect(owner).executeSlash();
  });

  it("Slashed wallet cannot withdraw", async function () {
    const stake = await portal.getCurrentStake();
    await portal.connect(attacker).lockStake({ value: stake });
    await portal.connect(owner).submitSlashProposal([attacker.address]);

    const { networkHelpers } = await hre.network.connect();
    await networkHelpers.time.increase(31);
    await portal.connect(owner).executeSlash();
    await networkHelpers.time.increase(61);

    await expect(portal.connect(attacker).withdrawStake())
      .to.be.revertedWith("Slashed");
  });
});