//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract ERC721ASale is Ownable {
    uint256 public sellPrice;
    address public sellerWallet;

    constructor(uint256 _sellPrice, address _sellerWallet) {
        sellPrice = _sellPrice;
        sellerWallet = _sellerWallet;
    }

    //// Write Functions ////

    /** @dev update sellPrice
     */
    function setSellPrice(uint256 _sellPrice) public onlyOwner {
        sellPrice = _sellPrice;
    }

    /** @dev update sellerWallet
     */
    function setSellerWallet(address _sellerWallet) public onlyOwner {
        sellerWallet = _sellerWallet;
    }

    /** @dev pay the seller
     */
    function buyNFT(uint256 _quantity) internal {
        if ((sellPrice * _quantity) != msg.value) {
            revert SentValueShouldBeEqualToSellPrice();
        }
        if (msg.value > 0) {
            payable(sellerWallet).transfer(msg.value);
        }
    }

    //// Errors ////

    error SentValueShouldBeEqualToSellPrice();
}
