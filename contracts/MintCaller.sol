//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

interface BaseNFT {
    function mint(
        uint256 _quantity,
        string memory _nonce,
        bytes memory _signature
    ) external payable;
}

contract MintCaller {
    function mint(
        uint256 _quantity,
        string memory _nonce,
        bytes memory _signature,
        address _nftAddress
    ) public payable {
        BaseNFT(_nftAddress).mint(_quantity, _nonce, _signature);
    }
}
