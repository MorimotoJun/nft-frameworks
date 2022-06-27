// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";


contract Advanced721 is ERC721A, Ownable {
    uint256 private _unitPrice = 0.07 ether;
    uint256 private _wlPrice = 0.05 ether;
    uint256 private _wlLimit = 3;
    bytes32 private _wlMerkleRoot = keccak256("0");
    string private _baseuri = "ipfs://00000000000000000000/";
    bool public wlActive = false;
    bool public pubActive = false;
    uint256 public maxSupply = 3000;

    constructor (string memory _name, string memory _symbol) ERC721A (_name, _symbol) {
    }

    modifier mintCompliance(uint256 _price, uint256 _quantity, uint256 _value) {
        require(_value == _price * _quantity, "invalid cost");
        _;
    }

    modifier wlCheck(bytes32[] memory _proof) {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(_proof, _wlMerkleRoot, leaf), "You're not whitelisted");
        _;
    }

    function setWlRoot(bytes32 _merkleRoot) public onlyOwner {
        _wlMerkleRoot = _merkleRoot;
    }

    function switchWlActive() public onlyOwner {
        wlActive = !wlActive;
    }

    function wlMint(uint _quantity, bytes32[] memory _proof) 
        public
        wlCheck(_proof)
        payable
        mintCompliance(_wlPrice, _quantity, msg.value)
    {
        require((balanceOf(msg.sender) + _quantity) <= _wlLimit,  string(abi.encodePacked("The limit number of WL mint is ", Strings.toString(_wlLimit), ". You can mint only ", Strings.toString(_wlLimit - balanceOf(msg.sender)), ".")));
        require(wlActive == true, "WL mint is not Active now.");
        _safeMint(msg.sender, _quantity);
    }

    function switchPubActive() public onlyOwner {
        pubActive = !pubActive;
    }

    function publicMint(uint256 _quantity) 
        public 
        payable 
        mintCompliance(_unitPrice, _quantity, msg.value) 
    {
        require(pubActive == true, "Public mint is not active now.");
        _safeMint(msg.sender, _quantity);
    }

    // tokenURI returns "_baseURI() + tokenId" and that should be the URL for JSON metadata
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseuri;
    } 

    // This will be used to "REVEAL"
    function setBaseURI(string memory _newUri) public onlyOwner {
        _baseuri = _newUri;
    }
}