// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Onchain721NFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    uint256 private _burnedCount;
    string private _desc;
    mapping(uint256=>string) _tokenURIs;

    constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {
        _burnedCount = 0;
        _desc = "This is a sample of on-chain NFT contract. Enjoy this!!";
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

    function mintNFT(string memory svg, address recipient)
        public
        onlyOwner
        returns (uint256)
    {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, svg);

        return newItemId;
    }

    // svg is string data of the SVG image file
    function _setTokenURI(uint256 tokenId, string memory svg) private {
        if (bytes(svg).length != 0) {
            _tokenURIs[tokenId] = string(abi.encodePacked("data:image/svg+xml;base64,",Base64.encode(bytes(svg))));
        }
    }

    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        bytes memory json = abi.encodePacked(
            '{"name":"TestNFTProject#',
            Strings.toString(_tokenId),
            '", "description":"',
            _desc,
            '", "image":"',
            _tokenURIs[_tokenId],
            '"}'
        );
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(json)));
    }

    function burnNFT(uint256 tokenId) public onlyOwner {
        require(msg.sender == ownerOf(tokenId), "Invalid Transaction Caller");

        _burn(tokenId);
        _burnedCount++;
    }

    function _burn(uint256 tokenId) internal virtual override {
        super._burn(tokenId);

        if (bytes(_tokenURIs[tokenId]).length != 0) {
            delete _tokenURIs[tokenId];
        }
    }
}