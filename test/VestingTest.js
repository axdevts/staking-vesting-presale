// const { constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
// const { ZERO_ADDRESS } = constants;
// const { expect } = require('chai');
// const { ethers } = require("hardhat");

// let beneficiary;
// let baseERC20Instance;
// let baseERC20Contract;
// let VestingInstance;
// let VestingContract;
// let owner;
// let account1
// let start;
// let cliffDuration;
// let duration;
// let amountLockedToken;
// let amountBN;

// let blockNum;
// let blockTest;

// describe('TokenVesting', function() {
//     beforeEach(async function() {
//         [owner, account1] = await ethers.getSigners();
//         amountLockedToken = 1000;
//         amountBN = ethers.utils.parseEther("1000");
//         baseERC20Instance = await ethers.getContractFactory("BaseERC20");
//         baseERC20Contract = await baseERC20Instance.deploy();
//         await baseERC20Contract.deployed();

//         beneficiary = owner.address;
//         blockNum = await ethers.provider.getBlockNumber();
//         blockTest = await ethers.provider.getBlock(blockNum);
//         start = blockTest.timestamp;
//         cliffDuration = 4;
//         duration = 10;
//         VestingInstance = await ethers.getContractFactory("TokenVesting");
//     });

//     it('reverts with a duration shorter than the cliff', async function() {
//         cliffDuration = 10;
//         duration = 2;
//         expect(cliffDuration).to.be.at.least(duration);
//         await expectRevert(
//             VestingInstance.deploy(baseERC20Contract.address, beneficiary, start, cliffDuration, duration, true),
//             'TokenVesting: cliff is longer than duration'
//         );
//     });

//     it('reverts with a null beneficiary', async function() {
//         await expectRevert(
//             VestingInstance.deploy(baseERC20Contract.address, ZERO_ADDRESS, start, cliffDuration, duration, true),
//             'TokenVesting: beneficiary is the zero address'
//         );
//     });

//     it('reverts with a null duration', async function() {
//         await expectRevert(
//             VestingInstance.deploy(baseERC20Contract.address, beneficiary, start, 0, 0, true), 'TokenVesting: duration is 0'
//         );
//     });

//     it('reverts if the end time is in the past', async function() {
//         start = blockTest.timestamp - 20;
//         await expectRevert(
//             VestingInstance.deploy(baseERC20Contract.address, beneficiary, start, cliffDuration, duration, true),
//             'TokenVesting: final time is before current time'
//         );
//     });

//     describe('once deployed', function() {
//         beforeEach(async function() {
//             start = blockTest.timestamp;
//             cliffDuration = 4;
//             duration = 10;
//             VestingContract = await VestingInstance.deploy(baseERC20Contract.address, beneficiary, start, cliffDuration, duration, true);
//             await VestingContract.deployed();
//         });

//         it('can get state', async function() {
//             expect(await VestingContract.beneficiary()).to.equal(beneficiary);
//             expect(await VestingContract.cliff()).to.be.equal(start + cliffDuration);
//             expect(await VestingContract.start()).to.be.equal(start);
//             expect(await VestingContract.duration()).to.be.equal(duration);
//             expect(await VestingContract.revocable()).to.be.equal(true);
//         });
//         it('should be released by owner', async function() {
//             start = blockTest.timestamp - 16;
//             cliffDuration = 10;
//             duration = 20;
//             VestingContract = await VestingInstance.deploy(baseERC20Contract.address, beneficiary, start, cliffDuration, duration, true);
//             await VestingContract.deployed();
//             await baseERC20Contract.mintBaseToken(VestingContract.address, amountLockedToken);
//             await VestingContract.setTotaltokens(amountLockedToken);

//             await expectRevert(VestingContract.connect(account1).release(),
//                 "Ownable: caller is not the owner"
//             );
//         });
//         it('cannot be released before cliff', async function() {
//             start = blockTest.timestamp + 2;
//             cliffDuration = 4;
//             duration = 20;
//             VestingContract = await VestingInstance.deploy(baseERC20Contract.address, beneficiary, start, cliffDuration, duration, true);
//             await VestingContract.deployed();
//             await baseERC20Contract.mintBaseToken(VestingContract.address, amountLockedToken);
//             await VestingContract.setTotaltokens(amountLockedToken);

//             expect(await VestingContract.balanceOf())
//                 .to.be.equal(amountLockedToken);
//             await expectRevert(VestingContract.release(),
//                 'TokenVesting: no tokens are due'
//             );
//         });

//         it('should release proper amount after cliff', async function() {
//             start = blockTest.timestamp - 2;
//             cliffDuration = 4;
//             duration = 20;
//             VestingContract = await VestingInstance.deploy(baseERC20Contract.address, beneficiary, start, cliffDuration, duration, true);
//             await VestingContract.deployed();
//             await baseERC20Contract.mintBaseToken(VestingContract.address, amountLockedToken);
//             await VestingContract.setTotaltokens(amountLockedToken);

//             nowTime = await VestingContract.nowTime();
//             releasedAmount = amountLockedToken * (nowTime - start + 1) / duration;
//             releaseResult = await VestingContract.release();

//             expect(releaseResult)
//                 .to.emit(VestingContract, 'TokensReleased')
//                 .withArgs(beneficiary, releasedAmount);
//             expect(await baseERC20Contract.balanceOf(beneficiary))
//                 .to.be.equal(releasedAmount);
//             expect(await VestingContract.balanceOf())
//                 .to.be.equal(amountLockedToken - releasedAmount);
//         });

//         it('should have released all after end', async function() {
//             start = blockTest.timestamp - 16;
//             cliffDuration = 10;
//             duration = 20;
//             VestingContract = await VestingInstance.deploy(baseERC20Contract.address, beneficiary, start, cliffDuration, duration, true);
//             await VestingContract.deployed();
//             await baseERC20Contract.mintBaseToken(VestingContract.address, amountLockedToken);
//             await VestingContract.setTotaltokens(amountLockedToken);

//             await VestingContract.release();
//             expect(await baseERC20Contract.balanceOf(beneficiary))
//                 .to.be.equal(amountLockedToken);
//             expect(await VestingContract.balanceOf())
//                 .to.be.equal(0);
//         });

//         it('should be revoked by only owner if revocable is set', async function() {
//             start = blockTest.timestamp - 8;
//             cliffDuration = 5;
//             duration = 20;
//             VestingContract = await VestingInstance.deploy(baseERC20Contract.address, beneficiary, start, cliffDuration, duration, true);
//             await VestingContract.deployed();
//             await baseERC20Contract.mintBaseToken(VestingContract.address, amountLockedToken);
//             await VestingContract.setTotaltokens(amountLockedToken);

//             await expectRevert(VestingContract.connect(account1).revoke(),
//                 "Ownable: caller is not the owner"
//             );
//             await VestingContract.revoke();
//             expect(await VestingContract.revoked(beneficiary))
//                 .to.equal(true);
//             expect(await baseERC20Contract.balanceOf(VestingContract.address))
//                 .to.be.equal(amountLockedToken);
//         });

//         it('should fail to be revoked by owner if revocable not set', async function() {
//             start = blockTest.timestamp - 8;
//             cliffDuration = 5;
//             duration = 20;
//             VestingContract = await VestingInstance.deploy(baseERC20Contract.address, beneficiary, start, cliffDuration, duration, false);
//             await VestingContract.deployed();
//             await baseERC20Contract.mintBaseToken(VestingContract.address, amountLockedToken);
//             await VestingContract.setTotaltokens(amountLockedToken);

//             await expectRevert(VestingContract.revoke(),
//                 'TokenVesting: cannot revoke'
//             );
//         });
//         it('should fail to be revoked a second time', async function() {
//             start = blockTest.timestamp - 8;
//             cliffDuration = 5;
//             duration = 20;
//             VestingContract = await VestingInstance.deploy(baseERC20Contract.address, beneficiary, start, cliffDuration, duration, true);
//             await VestingContract.deployed();
//             await baseERC20Contract.mintBaseToken(VestingContract.address, amountLockedToken);
//             await VestingContract.setTotaltokens(amountLockedToken);

//             await VestingContract.revoke();
//             await expectRevert(VestingContract.revoke(),
//                 'TokenVesting: token already revoked'
//             );
//         });
//     });
// });