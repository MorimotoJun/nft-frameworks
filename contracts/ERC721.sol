// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract Normal721NFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    uint256 private _burnedCount;

    constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {
        _burnedCount = 0;
    }

    /**
     * Override isApprovedForAll to auto-approve OS's proxy contract
     */
    function _baseURI()
        internal
        view
        virtual
        override
        returns (string memory)
    {
        return "ipfs://";
    }

    /**
     * Override isApprovedForAll to auto-approve OS's proxy contract
     */
    function isApprovedForAll(address _owner, address _operator)
        public
        view
        override
        returns (bool isOperator)
    {
        // if OpenSea's ERC721 Proxy Address is detected, auto-return true
        if (_operator == address(0x58807baD0B376efc12F5AD86aAc70E78ed67deaE)) {
            return true;
        }

        // otherwise, use the default ERC721.isApprovedForAll()
        return ERC721.isApprovedForAll(_owner, _operator);
    }

    function totalSupply() public view virtual returns (uint256) {
        return _tokenIds.current() - _burnedCount;
    }

    function mintNFT(address recipient, string memory ipfsHash)
        public
        onlyOwner
        returns (uint256)
    {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, ipfsHash);

        return newItemId;
    }

    function setTokenURI(uint256 tokneId, string memory ipfsHash) public onlyOwner {
        _setTokenURI(tokneId, ipfsHash);
    }

    function burnNFT(uint256 tokenId) public onlyOwner {
        require(msg.sender == ownerOf(tokenId), "Invalid Transaction Caller");

        _burn(tokenId);
        _burnedCount++;
    }
}