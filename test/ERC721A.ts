import { expect } from "chai";
import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

const FILE_NAME = "Advanced721",
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

  it("should activate WL and verify by MerkleProof", async function() {
    const [owner, wl1, wl2, wl3, nwl1] = await ethers.getSigners();
    const Nft = await ethers.getContractFactory(FILE_NAME);
    const nft = await Nft.deploy(NAME, SYMBOL);
    await nft.deployed();

    const wl = [wl1.address, wl2.address, wl3.address];
    const leaves = wl.map(addr=>keccak256(addr));
    const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = merkleTree.getHexRoot();

    await nft.setWlRoot(root);

    let proof = merkleTree.getHexProof(keccak256(wl[0]));

    // If not activated
    try {
        proof = merkleTree.getHexProof(keccak256(wl[0]));
        await nft.connect(wl1).wlMint(2, proof, {
            value: ethers.utils.parseEther("0.1")
        });
    } catch (err: any) {
        expect(err.message).to.include("WL mint is not Active now.");
    }

    await nft.switchWlActive();

    // If called by non-whitelisted account
    try {
        proof = merkleTree.getHexProof(keccak256(nwl1.address));
        await nft.connect(nwl1).wlMint(2, proof, {
            value: ethers.utils.parseEther("0.1"),
        });
    } catch (err: any) {
        expect(err.message).to.include("You're not whitelisted");
    }

    // If the value is not correct
    try {
        proof = merkleTree.getHexProof(keccak256(wl1.address));
        await nft.connect(wl1).wlMint(2, proof, {
            value: ethers.utils.parseEther("0.07"),
        })
    } catch (err: any) {
        expect(err.message).to.include("invalid cost");
    }

    // If the _quantity is invalid
    try {
        proof = merkleTree.getHexProof(keccak256(wl1.address));
        await nft.connect(wl1).wlMint(4, proof, {
            value: ethers.utils.parseEther("0.2")
        });
    } catch (err: any) {
        expect(err.message).to.include("The limit number of WL mint is 3. You can mint only 3.")
    }

    // Succeed in wlMint
    let e = "";
    try {
        proof = merkleTree.getHexProof(keccak256(wl1.address));
        await nft.connect(wl1).wlMint(2, proof, {
            value: ethers.utils.parseEther("0.1")
        });
    } catch (err: any) {
        e = err.message;
    }

    expect(e).to.equal("");
    expect(await nft.balanceOf(wl1.address)).to.equal(2);
  })

  it("should public mint is controlled by switchPubActive", async function() {
    const [owner, wl1] = await ethers.getSigners();
    const Nft = await ethers.getContractFactory(FILE_NAME);
    const nft = await Nft.deploy(NAME, SYMBOL);
    await nft.deployed();

    // If not activated
    try {
        await nft.connect(wl1).publicMint(2, {
            value: ethers.utils.parseEther("0.14")
        });
    } catch (err: any) {
        expect(err.message).to.include("Public mint is not active now.");
    }

    await nft.switchPubActive();

    // If the value is not correct
    try {
        await nft.connect(wl1).publicMint(2, {
            value: ethers.utils.parseEther("0.07"),
        })
    } catch (err: any) {
        expect(err.message).to.include("invalid cost");
    }

    // Succeed in wlMint
    let e = "";
    try {
        await nft.connect(wl1).publicMint(2, {
            value: ethers.utils.parseEther("0.14")
        });
    } catch (err: any) {
        e = err.message;
    }

    expect(e).to.equal("");
    expect(await nft.balanceOf(wl1.address)).to.equal(2);
    expect(await nft.tokenURI(1)).to.equal("ipfs://00000000000000000000/1")
    expect(await nft.tokenURI(0)).to.equal("ipfs://00000000000000000000/0")
  })

  it("setBaseURI should work correctly", async function() {
    const [owner, wl1] = await ethers.getSigners();
    const Nft = await ethers.getContractFactory(FILE_NAME);
    const nft = await Nft.deploy(NAME, SYMBOL);
    await nft.deployed();

    await nft.switchPubActive();

    await nft.connect(wl1).publicMint(2, {
        value: ethers.utils.parseEther("0.14")
    });

    // Succeed in wlMint
    let e = "";
    try {
        await nft.setBaseURI("ipfs://2222222222222222222/");
    } catch (err: any) {
        e = err.message;
    }

    expect(e).to.equal("");
    expect(await nft.tokenURI(1)).to.equal("ipfs://2222222222222222222/1")
    expect(await nft.tokenURI(0)).to.equal("ipfs://2222222222222222222/0")
  })
});
