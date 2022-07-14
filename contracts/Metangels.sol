//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "./BaseNFT.sol";

contract Metaangels is BaseNFT {
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _sellPrice,
        address _sellerWallet,
        uint256 _maxSupply,
        uint256 _supplyLimit,
        address _signerAddress,
        string memory _baseURI
    )
        ERC721A(_name, _symbol)
        ERC721ASale(_sellPrice, _sellerWallet)
        ERC721ASupply(_maxSupply, _supplyLimit)
        ERC721ASignature(_signerAddress)
        BaseNFT(_baseURI)
    {}
}
