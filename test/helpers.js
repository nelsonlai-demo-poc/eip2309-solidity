const { ethers } = require('ethers');

const getWhitelistSignature = async (address, signer, quantity) => {
    const nonce = getNonce();
    const hash = ethers.utils.solidityKeccak256(
        ['address', 'string', 'uint256'],
        [address, nonce, quantity]
    );
    const sig = ethers.utils.joinSignature(
        signer._signingKey().signDigest(hash)
    );
    return { sig: sig, nonce: nonce };
};

const getNonce = () => {
    let characters =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let nonce = '';
    for (let i = 0; i < characters.length; i++) {
        nonce += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }
    return nonce;
};

module.exports = {
    getWhitelistSignature,
};
