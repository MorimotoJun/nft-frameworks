// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";


contract Normal1155 is ERC1155, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds; 
    uint256 public unitPrice = 0.05 ether;
    uint256 public maxSupply = 3000;
    uint256 public maxWlAmount = 3;
    string public name;
    string public symbol;
    string private _base;
    bool public publicActive = false;
    mapping(address => uint256[]) private tokensAsOwners;

    constructor(string memory _name, string memory _symbol, string memory _url)
        ERC1155("")
    {
        _base = _url;
        name = _name;
        symbol = _symbol;
    }

    modifier mintCompliance(uint256 amount, string memory type_) {
        require((_tokenIds.current() + amount) <= maxSupply, "Too many mint.");
        _;
    }

    function switchPubActive() public onlyOwner {
        publicActive = !publicActive;
    }

    function totalSupply() public view virtual returns (uint256) {
        return _tokenIds.current();
    }

    function walletOfOwner(address owner) public view returns (uint256[] memory) {
        return tokensAsOwners[owner];
    }

    function publicMint(uint256 amount)
        public
        payable
        mintCompliance(amount, "")
    {
        require(publicActive, "publicMint is not active now.");
        require(msg.value == unitPrice * amount, "Invalid cost.");
        address to = msg.sender;
        uint256 ind = 0;
        uint256[] memory ids = new uint256[](amount);
        uint256[] memory amounts = new uint256[](amount);
        while (
            ind < amount
        ) {
            _tokenIds.increment();
            uint256 id = _tokenIds.current();
            ids[ind] = id;
            amounts[ind] = 1;
            ind++;
        }
        _mintBatch(to, ids, amounts, '');
        ind = 0;
        while (ind < amount) {
            tokensAsOwners[msg.sender].push(ids[ind]);
            ind++;
        }
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(_base, Strings.toString(tokenId)));
    }

    function setBaseURI(string memory newURI) 
        public 
        onlyOwner
    {
        _base = newURI;
    }

    function safeTransferFrom(
        address to,
        uint256 id
    ) public virtual {
        address from = msg.sender;
        safeTransferFrom(from, to, id, 1, '');
        uint256[] memory list = new uint256[](tokensAsOwners[from].length - 1);
        uint256 i = 0;
        uint256 ind = 0;
        while (ind < tokensAsOwners[from].length) {
            if (tokensAsOwners[from][ind] != id) {
                list[i] = tokensAsOwners[from][ind];
                i++;
            }
            ind++;
        }
        tokensAsOwners[from] = list;
        tokensAsOwners[to].push(id);
    }

    /**
     * @dev See {IERC1155-safeBatchTransferFrom}.
     */
    function safeBatchTransferFrom(
        address to,
        uint256[] memory ids
    ) public virtual {
        uint256[] memory amounts = new uint256[](ids.length);
        uint256 ind = 0;
        uint256 i;
        while (ind < ids.length) {
            amounts[ind] = 1;
            ind++;
        }

        address from = msg.sender;
        safeBatchTransferFrom(from, to, ids, amounts, '');
        ind = 0;
        i = 0;
        uint256[] memory list = new uint256[](tokensAsOwners[from].length - ids.length);

        while (ind < tokensAsOwners[from].length) {
            uint256 j = 0;
            bool del = false;
            while (j < ids.length) {
                if (tokensAsOwners[from][ind] == ids[j]) del = true;
                j++;
            }
            if (!del) {
                list[i] = tokensAsOwners[from][ind];
                i++;
            }
            ind++;
        }
        tokensAsOwners[from] = list;

        ind = 0;
        uint256[] memory toList = new uint256[](tokensAsOwners[to].length + ids.length);
        while (ind < tokensAsOwners[to].length) {
            toList[ind] = tokensAsOwners[to][ind];
            ind++;
        }
        i = 0;
        while (i < ids.length) {
            toList[ind + i] = ids[i];
            i++;
        }
        tokensAsOwners[to] = toList;
    }
}