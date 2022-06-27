import { expect } from "chai";
import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

const FILE_NAME = "Normal1155",
    NAME = "Test NFT Contract",
    SYMBOL = "TNC";


    describe(FILE_NAME, function () {
        it("Should be deployed as correct name and symbol", async function () {
            const [,wl1, wl2, wl3, wl4] = await ethers.getSigners();
            const Nft = await ethers.getContractFactory(FILE_NAME);

            const wl = [wl1.address, wl2.address, wl3.address, wl4.address];
            const leaves = wl.map(addr=>keccak256(addr));
            const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
            const root = merkleTree.getHexRoot();

            const nft = await Nft.deploy(NAME, SYMBOL, "ipfs*//0000000000/");
            await nft.deployed();
        
            expect(await nft.name()).to.equal(NAME);
            expect(await nft.symbol()).to.equal(SYMBOL);
        });

        it('should publicMint for specific cost', async function() {
            const [,account] = await ethers.getSigners();
            const Nft = await ethers.getContractFactory(FILE_NAME);

            const nft = await Nft.deploy(NAME, SYMBOL, "ipfs*//0000000000/");
            await nft.deployed();

            // err by total Amount
            try {
                await nft.connect(account).publicMint(4000);
            } catch (err: any) {
                expect(err.message).to.include("Too many mint.");
            }
            expect(await nft.totalSupply()).to.equal(0);

            // err by activation
            try {
                await nft.connect(account).publicMint(500);
            } catch (err: any) {
                expect(err.message).to.include("publicMint is not active now.");
            }
            expect(await nft.totalSupply()).to.equal(0);

            await nft.switchPubActive();

            // err by cost
            try {
                await nft.connect(account).publicMint(500);
            } catch (err: any) {
                expect(err.message).to.include("Invalid cost.");
            }
            expect(await nft.totalSupply()).to.equal(0);

            // succeed
            try {
                await nft.connect(account).publicMint(500, {
                    value: ethers.utils.parseEther("25")
                });
            } catch (err: any) {
                console.log(err.message)
            }
            expect(await nft.totalSupply()).to.equal(500);
            let list: number[] = [];
            for (let i = 1; i <= 500; i++) {
                list.push(i);
            }
            let ans: number[] = [];
            for (const l of await nft.walletOfOwner(account.address)) {
                ans.push(parseInt(l._hex, 16));
            }
            
            expect(JSON.stringify(ans)).to.equal(JSON.stringify(list));
        });

        it('setBaseURI should reset baseURI', async function() {
            const [,account] = await ethers.getSigners();
            const Nft = await ethers.getContractFactory(FILE_NAME);

            const nft = await Nft.deploy(NAME, SYMBOL, "ipfs://0000000000/");
            await nft.deployed();

            await nft.switchPubActive();
            await nft.setBaseURI("ipfs://xxxxxxxxxx/");

            // succeed
            try {
                await nft.connect(account).publicMint(500, {
                    value: ethers.utils.parseEther("25")
                });
            } catch (err: any) {
                console.log(err.message)
            }

            expect(await nft.uri(400)).to.equal("ipfs://xxxxxxxxxx/400");
        });

        it('safeTransferFrom should reset baseURI', async function() {
            const [,acc1, acc2] = await ethers.getSigners();
            const Nft = await ethers.getContractFactory(FILE_NAME);

            const nft = await Nft.deploy(NAME, SYMBOL, "ipfs://0000000000/");
            await nft.deployed();

            await nft.switchPubActive();
            await nft.connect(acc1).publicMint(500, {
                value: ethers.utils.parseEther("25")
            });
            expect(await nft.totalSupply()).to.equal(500);

            await nft.connect(acc1)["safeTransferFrom(address,uint256)"](acc2.address, 400);
            let list: number[] = [];
            for (let i = 1; i <= 500; i++) {
                if (i != 400) list.push(i);
            }
            let ans: number[] = [];
            for (const l of await nft.walletOfOwner(acc1.address)) {
                ans.push(parseInt(l._hex, 16));
            }

            expect(JSON.stringify(ans)).to.equal(JSON.stringify(list));
            expect(parseInt((await nft.walletOfOwner(acc2.address))[0]._hex, 16)).to.equal(400);
        });

        it('safeBatchTransferFrom should reset baseURI', async function() {
            const [,acc1, acc2] = await ethers.getSigners();
            const Nft = await ethers.getContractFactory(FILE_NAME);

            const nft = await Nft.deploy(NAME, SYMBOL, "ipfs://0000000000/");
            await nft.deployed();

            await nft.switchPubActive();
            await nft.connect(acc1).publicMint(500, {
                value: ethers.utils.parseEther("25")
            });
            expect(await nft.totalSupply()).to.equal(500);

            await nft.connect(acc1)["safeBatchTransferFrom(address,uint256[])"](acc2.address, [400, 209]);
            let list: number[] = [];
            for (let i = 1; i <= 500; i++) {
                if (i != 400 && i != 209) list.push(i);
            }
            let ans: number[] = [];
            for (const l of await nft.walletOfOwner(acc1.address)) {
                ans.push(parseInt(l._hex, 16));
            }

            expect(JSON.stringify(ans)).to.equal(JSON.stringify(list));

            list = [400, 209];
            ans = [];
            for (const l of await nft.walletOfOwner(acc2.address)) {
                ans.push(parseInt(l._hex, 16));
            }
            expect(JSON.stringify(ans)).to.equal(JSON.stringify(list));

            await nft.connect(acc1)["safeBatchTransferFrom(address,uint256[])"](acc2.address, [2, 300]);

            list = [400, 209, 2, 300];
            ans = [];
            for (const l of await nft.walletOfOwner(acc2.address)) {
                ans.push(parseInt(l._hex, 16));
            }
            expect(JSON.stringify(ans)).to.equal(JSON.stringify(list));
        });
    })
      