import { expect } from "chai";
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { Buffer } from 'buffer'

const FILE_NAME = "Onchain721NFT",
      NAME = "Test NFT Contract",
      SYMBOL = "TNC",
      ROOT_PATH = path.resolve(__dirname, ".."),
      SVG = "hello_world.svg";

function readSVG(filename: string): string {
  // read SVG file and reform it to string data
  const svg = fs.readFileSync(path.join(ROOT_PATH, 'images', filename)).toString();
  let svgStr: string = '';
  for (const d of svg.split('\n')) {
      svgStr += d;
  }
  svgStr = svgStr.replaceAll("> ", ">");
  svgStr = svgStr.replaceAll(" <", "<");
  return svgStr;
}

const svgStr = readSVG(SVG);

describe(FILE_NAME, function () {
  it("Should be deployed as correct name and symbol", async function () {
    const Nft = await ethers.getContractFactory(FILE_NAME);
    const nft = await Nft.deploy(NAME, SYMBOL);
    await nft.deployed();

    expect(await nft.name()).to.equal(NAME);
    expect(await nft.symbol()).to.equal(SYMBOL);
  });

  it("Should mint full on-chain NFT", async function() {
    const Nft = await ethers.getContractFactory(FILE_NAME);
    const nft = await Nft.deploy(NAME, SYMBOL);
    await nft.deployed();

    const [owner] = await ethers.getSigners();
    await nft.mintNFT(svgStr, owner.address);

    // calcurate base64 encoded json
    let svg = "data:image/svg+xml;base64," + Buffer.from(svgStr).toString("base64");
    let json = {
      name: "TestNFTProject#1",
      description: "This is a sample of on-chain NFT contract. Enjoy this!!",
      image: svg
    };

    let uri = await nft.tokenURI(1);
    const splarr = uri.split(',');
    uri = splarr[splarr.length -1];

    let res = Buffer.from(uri, 'base64').toString();
    res = res.replaceAll(', "', ',"');

    expect(res).to.equal(JSON.stringify(json));
  })

  it("Should not mint NFTs", async function() {
    const Nft = await ethers.getContractFactory(FILE_NAME);
    const nft = await Nft.deploy(NAME, SYMBOL);
    await nft.deployed();

    const [owner, caller] = await ethers.getSigners();
    let res: string = '';
    try {
      await nft.connect(caller).mintNFT(svgStr, caller.address);
    } catch (err: any) {
      res = err.message;
    }

    expect(res).to.include('Ownable: caller is not the owner');
  })

  it("Should return true : isApprovedForAll", async function() {
    const Nft = await ethers.getContractFactory(FILE_NAME);
    const nft = await Nft.deploy(NAME, SYMBOL);
    await nft.deployed();

    const [owner, caller] = await ethers.getSigners();
    await nft.mintNFT(svgStr, caller.address);

    let isApproved = await nft.isApprovedForAll(caller.address, "0x58807baD0B376efc12F5AD86aAc70E78ed67deaE");
    expect(isApproved).to.equal(true);

    isApproved = await nft.isApprovedForAll(caller.address, owner.address);
    expect(isApproved).to.equal(false);

    await nft.connect(caller).setApprovalForAll(owner.address, true);
    isApproved = await nft.isApprovedForAll(caller.address, owner.address);
    expect(isApproved).to.equal(true);
  })

  it("Should return false : isApprovedForAll", async function() {
    const Nft = await ethers.getContractFactory(FILE_NAME);
    const nft = await Nft.deploy(NAME, SYMBOL);
    await nft.deployed();

    const [owner, caller] = await ethers.getSigners();
    await nft.mintNFT(svgStr, caller.address);

    const isApproved = await nft.isApprovedForAll(caller.address, owner.address);

    expect(isApproved).to.equal(false);
  })

  it("Should face error : burnNFT", async function() {
    const Nft = await ethers.getContractFactory(FILE_NAME);
    const nft = await Nft.deploy(NAME, SYMBOL);
    await nft.deployed();

    const [owner, caller] = await ethers.getSigners();
    await nft.mintNFT(svgStr, caller.address);
    await nft.mintNFT(svgStr, owner.address);

    let e = '';
    try {
      await nft.burnNFT(1);
    } catch (err: any) {
      e = err.message;
    }
    expect(e).to.include('Invalid Transaction Caller');

    try {
      await nft.connect(caller).burnNFT(2);
    } catch (err: any) {
      e = err.message;
    }
    expect(e).to.include('Ownable: caller is not the owner');
  })

  it("Should succeed : burnNFT", async function() {
    const Nft = await ethers.getContractFactory(FILE_NAME);
    const nft = await Nft.deploy(NAME, SYMBOL);
    await nft.deployed();

    const [owner, caller] = await ethers.getSigners();
    await nft.mintNFT(svgStr, caller.address);
    await nft.mintNFT(svgStr, owner.address);
    await nft.mintNFT('', owner.address);

    await nft.burnNFT(2);
    expect(await nft.totalSupply()).to.equal(2);

    await nft.burnNFT(3);
    expect(await nft.totalSupply()).to.equal(1);
  })
});
