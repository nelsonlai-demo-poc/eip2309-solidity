//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/** @dev ERC721ASignature provides functions of signature verification.
 */
abstract contract ERC721ASignature is Ownable {
    using ECDSA for bytes32;

    address public signerWallet;
    bool public byPassSignature = false;

    constructor(address _signerWallet) {
        signerWallet = _signerWallet;
    }

    //// Write Functions ////

    /** @dev update signer address.
     */
    function setSignerWallet(address _signer) public onlyOwner {
        signerWallet = _signer;
    }

    /** @dev update byPassSignature
     */
    function setByPassSignature(bool byPass) public onlyOwner {
        byPassSignature = byPass;
    }

    //// Read Functions ////

    /** @dev check if the signature is signed by the signer.
     */
    function isSignedBySigner(
        address _sender,
        string memory _nonce,
        uint256 _quantity,
        bytes memory _signature
    ) internal view returns (bool) {
        if (byPassSignature) {
            return true;
        }
        bytes32 hash = keccak256(abi.encodePacked(_sender, _nonce, _quantity));
        return signerWallet == hash.recover(_signature);
    }

    //// Errors ////
    error InvalidSignature();
}
