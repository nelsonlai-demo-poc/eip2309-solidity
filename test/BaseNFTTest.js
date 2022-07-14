const { expect } = require('chai');
const { ethers } = require('hardhat');
const { parseEther } = require('@ethersproject/units');
const { ContractFactory, Contract } = require('ethers');
const { getWhitelistSignature } = require('./helpers');

describe('BaseNFTImpl', () => {
    /** @type {ContractFactory} */
    let NFTFactory;

    /** @type {Contract} */
    let nft;

    const privateKey =
        'bae36fcb095314867da8ced1b8fb757109b2d5a40e713a4c7bdb95b842e7846d';
    const signerWallet = new ethers.Wallet(privateKey);

    /** @type {SignerWithAddress} */
    let owner;
    /** @type {SignerWithAddress} */
    let seller;
    /** @type {SignerWithAddress} */
    let wallet1;
    /** @type {SignerWithAddress} */
    let wallet2;
    /** @type {SignerWithAddress} */
    let wallet3;
    /** @type {SignerWithAddress} */
    let wallet4;
    /** @type {SignerWithAddress} */
    let wallet5;

    //// NFT Contract Settings ////
    const name = 'NFT Project';
    const symbol = 'NFT';
    const sellPrice = parseEther('0.1');
    const maxSupply = 3;
    const supplyLimit = 2;
    const baseURI = 'https;//nft.com/';

    beforeEach(async () => {
        [owner, seller, wallet1, wallet2, wallet3, wallet4, wallet5] =
            await ethers.getSigners();

        NFTFactory = await ethers.getContractFactory('BaseNFTImpl');
        nft = await NFTFactory.deploy(
            name,
            symbol,
            sellPrice,
            seller.address,
            maxSupply,
            supplyLimit,
            signerWallet.address,
            baseURI
        );
        await nft.setProjectState(1);
    });

    describe('ERC721ASale', () => {
        it('should have a sell price', async () => {
            const price = await nft.sellPrice();
            expect(price).to.equal(sellPrice);
        });
        it('should be able to set a new sell price', async () => {
            const newPrice = parseEther('0.2');
            await nft.setSellPrice(newPrice);
            const price = await nft.sellPrice();
            expect(price).to.equal(newPrice);
        });
        it('should have seller address', async () => {
            const sellerAddress = await nft.sellerWallet();
            expect(sellerAddress).to.equal(seller.address);
        });
        it('should be able to set a new seller address', async () => {
            const newSeller = wallet1;
            await nft.setSellerWallet(newSeller.address);
            const sellerAddress = await nft.sellerWallet();
            expect(sellerAddress).to.equal(newSeller.address);
        });
        it('should can buy a nft', async () => {
            const sellerBalance = await ethers.provider.getBalance(
                seller.address
            );
            const quantity = 1;
            const resp = await getWhitelistSignature(
                wallet1.address,
                signerWallet,
                quantity
            );
            await nft
                .connect(wallet1)
                .mint(quantity, resp.nonce, resp.sig, { value: sellPrice });
            const balance = await nft.balanceOf(wallet1.address);
            expect(balance).to.equal(quantity);
            expect(await ethers.provider.getBalance(seller.address)).to.equal(
                sellerBalance.add(sellPrice)
            );
        });
        it('should can buy multiple nft', async () => {
            const sellerBalance = await ethers.provider.getBalance(
                seller.address
            );
            const quantity = 2;
            const resp = await getWhitelistSignature(
                wallet1.address,
                signerWallet,
                quantity
            );
            await nft.connect(wallet1).mint(quantity, resp.nonce, resp.sig, {
                value: sellPrice.mul(quantity),
            });
            const balance = await nft.balanceOf(wallet1.address);
            expect(balance).to.equal(quantity);
            expect(await ethers.provider.getBalance(seller.address)).to.equal(
                sellerBalance.add(sellPrice.mul(quantity))
            );
        });
        it('should cannot buy nft if not enough ether', async () => {
            const quantity = 2;
            const resp = await getWhitelistSignature(
                wallet1.address,
                signerWallet,
                quantity
            );
            await expect(
                nft.connect(wallet1).mint(quantity, resp.nonce, resp.sig, {
                    value: sellPrice,
                })
            ).to.be.revertedWithCustomError(
                nft,
                'SentValueShouldBeEqualToSellPrice'
            );
        });
        it('should cannot buy nft if exceeded ethers have been sent', async () => {
            const quantity = 1;
            const resp = await getWhitelistSignature(
                wallet1.address,
                signerWallet,
                quantity
            );
            await expect(
                nft.connect(wallet1).mint(quantity, resp.nonce, resp.sig, {
                    value: sellPrice.mul(2),
                })
            ).to.be.revertedWithCustomError(
                nft,
                'SentValueShouldBeEqualToSellPrice'
            );
        });
        it('should can free mint if the price set 0', async () => {
            await nft.setSellPrice(parseEther('0'));
            const quantity = 1;
            const resp = await getWhitelistSignature(
                wallet1.address,
                signerWallet,
                quantity
            );
            await nft.connect(wallet1).mint(quantity, resp.nonce, resp.sig);
            const balance = await nft.balanceOf(wallet1.address);
            expect(balance).to.equal(quantity);
        });
    });

    describe('ERC721ASignature', () => {
        it('should have a signer wallet', async () => {
            const signerAddress = await nft.signerWallet();
            expect(signerAddress).to.equal(signerWallet.address);
        });
        it('should be able to set a new signer wallet', async () => {
            await nft.setSignerWallet(wallet1.address);
            const signerAddress = await nft.signerWallet();
            expect(signerAddress).to.equal(wallet1.address);
        });
        it('should have a by passing signature state', async () => {
            const byPassingSignatureState = await nft.byPassSignature();
            expect(byPassingSignatureState).to.equal(false);
        });
        it('should can set by passing signature state', async () => {
            await nft.setByPassSignature(true);
            const byPassingSignatureState = await nft.byPassSignature();
            expect(byPassingSignatureState).to.equal(true);
        });
        it('should can by pass the signature checking', async () => {
            await nft.setByPassSignature(true);
            const quantity = 1;
            await nft.connect(wallet1).mint(quantity, '', '0x00', {
                value: sellPrice,
            });
            const balance = await nft.balanceOf(wallet1.address);
            expect(balance).to.equal(quantity);
        });
        it('should cannot mint with invalid signature', async () => {
            const quantity = 1;
            const resp = await getWhitelistSignature(
                wallet1.address,
                signerWallet,
                2
            );
            await expect(
                nft.connect(wallet1).mint(quantity, resp.nonce, resp.sig, {
                    value: sellPrice,
                })
            ).to.be.revertedWithCustomError(nft, 'InvalidSignature');
        });
    });

    describe('ERC721State', () => {
        it('should have a state', async () => {
            const state = await nft.projectState();
            expect(state).to.equal(1);
        });
        it('should be able to set a new state', async () => {
            await nft.setProjectState(0);
            const state = await nft.projectState();
            expect(state).to.equal(0);
        });
        it('should cannot mint when the project is paused', async () => {
            await nft.setProjectState(0);
            const quantity = 1;
            const resp = await getWhitelistSignature(
                wallet1.address,
                signerWallet,
                quantity
            );
            await expect(
                nft.connect(wallet1).mint(quantity, resp.nonce, resp.sig, {
                    value: sellPrice,
                })
            ).to.be.revertedWithCustomError(nft, 'ProjectNotStarted');
        });
    });

    describe('ERC721Supply', () => {
        it('should have a max supply', async () => {
            const maxSupply = await nft.maxSupply();
            expect(maxSupply).to.equal(maxSupply);
        });
        it('should have a supply limit', async () => {
            const supplyLimit = await nft.supplyLimit();
            expect(supplyLimit).to.equal(supplyLimit);
        });
        it('should can set a new supply limit', async () => {
            await nft.setSupplyLimit(2);
            const supplyLimit = await nft.supplyLimit();
            expect(supplyLimit).to.equal(2);
        });
        it('should cannot set a new supply limit greater than max supply', async () => {
            await expect(
                nft.setSupplyLimit(maxSupply + 1)
            ).to.be.revertedWithCustomError(
                nft,
                'SupplyLimitGreaterThanMaxSupply'
            );
        });
        it('should cannot mint when the supply limit is reached', async () => {
            await nft.setSupplyLimit(1);
            const quantity = 2;
            const resp = await getWhitelistSignature(
                wallet1.address,
                signerWallet,
                quantity
            );
            await expect(
                nft.connect(wallet1).mint(quantity, resp.nonce, resp.sig, {
                    value: sellPrice.mul(quantity),
                })
            ).to.be.revertedWithCustomError(nft, 'ExceedsSupplyLimit');
        });
        it('should cannot mint when the max supply is reached', async () => {
            const quantity = 4;
            const resp = await getWhitelistSignature(
                wallet1.address,
                signerWallet,
                quantity
            );
            await expect(
                nft.connect(wallet1).mint(quantity, resp.nonce, resp.sig, {
                    value: sellPrice.mul(quantity),
                })
            ).to.be.revertedWithCustomError(nft, 'ExceedsMaximumSupply');
        });
    });

    describe('BaseNFT - token uri', () => {
        it('should have a base uri', async () => {
            const uri = await nft.baseURI();
            expect(uri).to.equal(baseURI);
        });
        it('should be able to set a new base uri', async () => {
            const baseURI2 = 'https://example.com/';
            await nft.setBaseURI(baseURI2);
            const uri = await nft.baseURI();
            expect(uri).to.equal(baseURI2);
        });
        it('should can get the token uri', async () => {
            const quantity = 1;
            const resp = await getWhitelistSignature(
                wallet1.address,
                signerWallet,
                quantity
            );
            await nft.connect(wallet1).mint(quantity, resp.nonce, resp.sig, {
                value: sellPrice,
            });
            const tokenId = await nft.tokenOfOwnerByIndex(wallet1.address, 0);
            console.log(tokenId);
            const uri = await nft.tokenURI(tokenId);
            expect(uri).to.equal(baseURI + '0.json');
        });
    });

    describe('BaseNFT - airdrop', () => {
        it('should be able to airdrop', async () => {
            await nft.airdrop([wallet1.address, wallet2.address], 1);
            expect(await nft.balanceOf(wallet1.address)).to.equal(1);
            expect(await nft.balanceOf(wallet2.address)).to.equal(1);
        });
        it('should not able to airdrop more than 1000 tokens in one tx', async () => {
            await expect(
                nft.airdrop([wallet1.address, wallet2.address], 1001)
            ).to.be.revertedWithCustomError(nft, 'Max1000TokenPerTransaction');
        });
        it('should be able to airdrop dynamically', async () => {
            await nft.setSupplyLimit(3);
            await nft.airdropDynamic(
                [wallet1.address, wallet2.address],
                [1, 2]
            );
            expect(await nft.balanceOf(wallet1.address)).to.equal(1);
            expect(await nft.balanceOf(wallet2.address)).to.equal(2);
        });
        it('should not able to airdrop dynamically more than 1000 tokens in one tx', async () => {
            await expect(
                nft.airdropDynamic(
                    [wallet1.address, wallet2.address],
                    [1, 1000]
                )
            ).to.be.revertedWithCustomError(nft, 'Max1000TokenPerTransaction');
        });
    });

    describe('BaseNFT - tickets', () => {
        it('should not be able to use a ticket twice', async () => {
            const quantity = 1;
            const resp = await getWhitelistSignature(
                wallet1.address,
                signerWallet,
                quantity
            );
            await nft.connect(wallet1).mint(quantity, resp.nonce, resp.sig, {
                value: sellPrice,
            });
            await expect(
                nft.connect(wallet1).mint(quantity, resp.nonce, resp.sig, {
                    value: sellPrice,
                })
            ).to.be.revertedWithCustomError(nft, 'TicketAlreadyUsed');
        });
    });

    describe('BaseNFT - onlyEOA', () => {
        it('should can reject the non eoa caller', async () => {
            /** @type {ContractFactory} */
            let MintCallerFactory;
            /** @type {Contract} */
            let mintCallerFactory;

            MintCallerFactory = await ethers.getContractFactory('MintCaller');
            mintCallerFactory = await MintCallerFactory.deploy();
            await expect(
                mintCallerFactory
                    .connect(wallet1)
                    .mint(1, '', '0x00', nft.address, {
                        value: sellPrice,
                    })
            ).to.be.revertedWithCustomError(nft, 'OnlyEOA');
        });
    });
});
