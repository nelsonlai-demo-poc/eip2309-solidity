//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "./ERC721A.sol";
import "./extensions/ERC721ASupply.sol";
import "./extensions/ERC721ASale.sol";
import "./extensions/ERC721AState.sol";
import "./extensions/ERC721ASignature.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NFTERC2309 is ERC721A, ERC721ASupply {
    constructor()
        ERC721A("NFTERC2309", "NFTERC2309")
        ERC721ASupply(9999, 9999)
    {}

    event ConsecutiveTransfer(
        uint256 indexed fromTokenId,
        uint256 toTokenId,
        address indexed fromAddress,
        address indexed toAddress
    );

    string public baseURI;

    //// Write Functions ////

    function mint(uint256 _quantity) public payable onlyEOA {
        _baseMint(msg.sender, _quantity);
    }

    function _afterTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal override {
        emit ConsecutiveTransfer(
            startTokenId,
            startTokenId + quantity - 1,
            from,
            to
        );
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
}
