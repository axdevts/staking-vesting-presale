const { constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const { expect } = require('chai');
const { ethers } = require("hardhat");
const { BigNumber } = require('ethers');

let baseERC20Instance;
let baseERC20Contract;
let presaleInstance;
let presaleContract;
let owner;
let account1;
let rate = 2;
let tokenDecimals = 18;

describe('Presale', function() {
    beforeEach(async function() {
        [owner, account1] = await ethers.getSigners();

        baseERC20Instance = await ethers.getContractFactory("BaseERC20");
        baseERC20Contract = await baseERC20Instance.deploy();
        await baseERC20Contract.deployed();
    });
    describe('when deploy', function() {
        it('reverts with the zero rate', async function() {
            rate = 0;
            presaleInstance = await ethers.getContractFactory("Presale");
            await expectRevert(presaleInstance.deploy(rate, owner.address, baseERC20Contract.address),
                'Zero rate!'
            );
        });
    });
    describe('once deployed, when buy tokens', function() {
        beforeEach(async function() {
            rate = 2;
            presaleInstance = await ethers.getContractFactory("Presale");
            presaleContract = await presaleInstance.deploy(rate, owner.address, baseERC20Contract.address);
            await presaleContract.deployed();
            //mint to all users and presaleContract for testing presale features
            await baseERC20Contract
                .mintBaseToken(presaleContract.address, ethers.utils.parseEther("500"));
            await baseERC20Contract
                .mintBaseToken(owner.address, ethers.utils.parseEther("200"));
            await baseERC20Contract
                .mintBaseToken(account1.address, ethers.utils.parseEther("200"));
        })
        it('sucess initial mint to basecontract, owner, user', async function() {
            expect(await baseERC20Contract.balanceOf(presaleContract.address))
                .to.be.equal(ethers.utils.parseEther("500"));
            expect(await baseERC20Contract.balanceOf(owner.address))
                .to.be.equal(ethers.utils.parseEther("200"));
            expect(await baseERC20Contract.balanceOf(account1.address))
                .to.be.equal(ethers.utils.parseEther("200"));
        });
        it('Buy action sucess', async function() {
            const provider = ethers.getDefaultProvider('http://127.0.0.1:8545/');
            // display the initial balances for owner
            ownerInitBalance = await ethers.provider.getBalance(owner.address);
            ownerInitBalanceDecimal = ownerInitBalance.toString(10) / Math.pow(10, tokenDecimals);
            console.log("owner initial balance is --------", ownerInitBalanceDecimal);
            // transfer
            getPriceResult = await presaleContract
                .getPrice(ethers.utils.parseEther("20"));
            buyTokensResult = await presaleContract.connect(account1)
                .buyTokens(account1.address, {
                    from: account1.address,
                    value: getPriceResult
                });
            await buyTokensResult.wait();
            // display the owner balances after transfer
            ownerBalance = await ethers.provider.getBalance(owner.address);
            ownerBalanceDecimal = ownerBalance.toString(10) / Math.pow(10, tokenDecimals);
            console.log("owner current balance is --------", ownerBalanceDecimal);
            // expect values
            expect(await baseERC20Contract.balanceOf(presaleContract.address))
                .to.be.equal(ethers.utils.parseEther("480"));
            expect(await baseERC20Contract.balanceOf(account1.address))
                .to.be.equal(ethers.utils.parseEther("220"));
            expect(await ethers.provider.getBalance(owner.address))
                .to.be.equal(BigNumber.from(ownerInitBalance.add(ethers.utils.parseEther("10"))));
            expect(await ethers.provider.getBalance(account1.address))
                .to.be.within(ethers.utils.parseEther("9989.9"), ethers.utils.parseEther("9990"));
            expect(await presaleContract.getTotalEarned())
                .to.be.equal(getPriceResult);
        });
    });
});