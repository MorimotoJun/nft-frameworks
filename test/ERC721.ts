import { expect } from "chai";
import { ethers } from "hardhat";

const FILE_NAME = "Normal721NFT",
      NAME = "Test NFT Contract",
      SYMBOL = "TNC";


describe(FILE_NAME, function () {
  it("Should be deployed as correct name and symbol", async function () {
    const Nft = await ethers.getContractFactory(FILE_NAME);
    const nft = await Nft.deploy(NAME, SYMBOL);
    await nft.deployed();

    expect(await nft.name()).to.equal(NAME);
    expect(await nft.symbol()).to.equal(SYMBOL);
  });

  it("baseURI should be the access token for Pinata", async function () {
    const [owner] = await ethers.getSigners();
    const Nft = await ethers.getContractFactory(FILE_NAME);
    const nft = await Nft.deploy(NAME, SYMBOL);
    await nft.deployed();

    const nftRes = await nft.mintNFT(owner.address, "");
    console.log("tokenId of the first one", parseInt((await nftRes.wait()).logs[0].topics[3], 16));
    expect(await nft.ownerOf(1)).to.equal(owner.address);
    expect(await nft.tokenURI(1)).to.equal("ipfs://1");
  })

  it("isApprovedForAll should return correct response", async function () {
    const [owner] = await ethers.getSigners();
    const Nft = await ethers.getContractFactory(FILE_NAME);
    const nft = await Nft.deploy(NAME, SYMBOL);
    await nft.deployed();

    await nft.mintNFT(owner.address, "DUMMY");

    expect(await nft.isApprovedForAll(owner.address, owner.address)).to.equal(false);
    expect(await nft.isApprovedForAll(owner.address, "0x58807baD0B376efc12F5AD86aAc70E78ed67deaE")).to.equal(true);

    await nft.setApprovalForAll("0xcf291b16E2269176dF4c9707F08EC6BA0532841d", true);
    expect(await nft.isApprovedForAll(owner.address, "0xcf291b16E2269176dF4c9707F08EC6BA0532841d")).to.equal(true);
  })

  it("burnNFT should not work by called by no-token-owner", async function() {
    const Nft = await ethers.getContractFactory(FILE_NAME);
    const nft = await Nft.deploy(NAME, SYMBOL);
    await nft.deployed();
    await nft.mintNFT("0x92552ad8D15Cf07BbeEA159AE0D9e8e4fC3eee8d", "DUMMY");

    let err = '';
    try {
        await nft.burnNFT(1);
    } catch (e: any) {
        err = e.message;
    }
    expect(err).to.equal("VM Exception while processing transaction: reverted with reason string 'Invalid Transaction Caller'");
  })

  it("burnNFT should work successfully if it's owned by contract owner and the contract owner call burnNFT function", async function() {
    const [owner] = await ethers.getSigners();
    const Nft = await ethers.getContractFactory(FILE_NAME);
    const nft = await Nft.deploy(NAME, SYMBOL);
    await nft.deployed();
    await nft.mintNFT(owner.address, "DUMMY");

    let err = '';
    try {
        await nft.burnNFT(1);
    } catch (e:any) {
        err = e.message;
    }

    expect(err).to.equal('');
  })

  it('totalSupply should return total NFT count', async function() {
    const [owner] = await ethers.getSigners();
    const Nft = await ethers.getContractFactory(FILE_NAME);
    const nft = await Nft.deploy(NAME, SYMBOL);
    await nft.deployed();
    expect(await nft.totalSupply()).to.equal(0);

    await nft.mintNFT(owner.address, "DUMMY");
    expect(await nft.totalSupply()).to.equal(1);

    await nft.mintNFT(owner.address, "DUMMY");
    expect(await nft.totalSupply()).to.equal(2);
  })

  it ('setTokenURI should change ipfsHash', async function() {
    const [owner] = await ethers.getSigners();
    const Nft = await ethers.getContractFactory(FILE_NAME);
    const nft = await Nft.deploy(NAME, SYMBOL);
    await nft.deployed();

    await nft.mintNFT(owner.address, "DUMMY");
    expect(await nft.tokenURI(1)).to.equal("ipfs://DUMMY");

    await nft.setTokenURI(1, "DUMMY2");
    expect(await nft.tokenURI(1)).to.equal("ipfs://DUMMY2");
  })
});
