//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "./ERC721A.sol";
import "./extensions/ERC721ASupply.sol";
import "./extensions/ERC721ASale.sol";
import "./extensions/ERC721AState.sol";
import "./extensions/ERC721ASignature.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

abstract contract BaseNFT is
    ERC721A,
    ERC721ASupply,
    ERC721ASale,
    ERC721ASignature,
    ERC721AState
{
    string public baseURI;
    mapping(string => bool) public usedTickets;

    constructor(string memory _baseURI) {
        baseURI = _baseURI;
    }

    //// Write Functions ////

    function mint(
        uint256 _quantity,
        string memory _nonce,
        bytes memory _signature
    ) public payable onlyEOA {
        if (!byPassSignature) {
            if (usedTickets[_nonce]) {
                revert TicketAlreadyUsed();
            }
            usedTickets[_nonce] = true;
        }
        if (!isSignedBySigner(msg.sender, _nonce, _quantity, _signature)) {
            revert InvalidSignature();
        }
        if (projectState == ProjectState.Prepare) {
            revert ProjectNotStarted();
        }
        buyNFT(_quantity); // pay the seller
        _baseMint(msg.sender, _quantity);
    }

    function _baseMint(address _to, uint256 _quantity) internal {
        if (_quantity > 1000) {
            revert Max1000TokenPerTransaction();
        }
        if (totalSupply() + _quantity > maxSupply) {
            revert ExceedsMaximumSupply();
        }
        if (totalSupply() + _quantity > supplyLimit) {
            revert ExceedsSupplyLimit();
        }
        _safeMint(_to, _quantity);
    }

    /** @dev update baseURI
     */
    function setBaseURI(string memory _baseURI) public onlyOwner {
        baseURI = _baseURI;
    }

    /** @dev airdrop nfts to target wallet address
     */
    function airdrop(address[] calldata _address, uint256 num)
        public
        onlyOwner
    {
        for (uint256 i = 0; i < _address.length; i++) {
            _baseMint(_address[i], num);
        }
    }

    /** @dev airdrop nfts to target wallet address with dynamic number of tokens
     */
    function airdropDynamic(
        address[] calldata _address,
        uint256[] calldata _nums
    ) public onlyOwner {
        uint256 sum = 0;
        for (uint256 i = 0; i < _nums.length; i++) {
            sum = sum + _nums[i];
        }
        if (sum > 1000) {
            revert Max1000TokenPerTransaction();
        }
        for (uint256 i = 0; i < _address.length; i++) {
            _baseMint(_address[i], _nums[i]);
        }
    }

    //// Read Functions ////

    /** @dev returns token uri of the token
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721A)
        returns (string memory)
    {
        if (!_exists(tokenId)) revert URIQueryForNonexistentToken();
        return
            bytes(baseURI).length > 0
                ? string.concat(baseURI, Strings.toString(tokenId), ".json")
                : "";
    }

    //// Modifier Functions ////

    /** @dev only eoa can pass this checking
     */
    modifier onlyEOA() {
        if (msg.sender != tx.origin) {
            revert OnlyEOA();
        }
        _;
    }

    //// Errors ////
    error Max1000TokenPerTransaction();
    error ExceedsMaximumSupply();
    error ExceedsSupplyLimit();
    error OnlyEOA();
    error TicketAlreadyUsed();
    error ProjectNotStarted();
}
