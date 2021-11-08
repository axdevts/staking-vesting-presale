//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./BaseERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract StakingRewards {
    using SafeMath for uint256;
    BaseERC20 public BaseERC20Token;

    event RewardPaid(address indexed user, uint256 reward);

    uint256 rewardRate = 1;
    uint256 fixedTotalSupply = 800;
    struct StakeList {
        address walletAddr;
        uint256 stakesAmount;
        uint256 rewardsAmount;
        uint256 lastUpdateTime;
    }

    /**
     * @notice The accumulated stake status for each stakeholder.
     */
    mapping(address => StakeList) public stakeLists;
    address[] public stakeListActs;

    /**
     * @dev Creates a staking contract that handles the staking, unstaking, getReward features
     * for BaseERC20 tokens.
     * @param _tokenAddress BaseERC20 contract addresss that is already deployed
     */
    constructor(BaseERC20 _tokenAddress) {
        BaseERC20Token = _tokenAddress;
    }

    /**
     * @notice A method for this contract stakeholder to create a stake.
     * uint256 The amount of wei in this method.
     * @param _amount The size of the stake to be created.
     */
    function stake(uint256 _amount) public returns (bool) {
        require(
            BaseERC20Token.balanceOf(msg.sender) >= _amount,
            "Please deposite more in your card!"
        );
        require(
            _amount > 0,
            "The amount to be transferred should be larger than 0"
        );

        BaseERC20Token.transferFrom(msg.sender, address(this), _amount);
        StakeList storage _personStakeSatus = stakeLists[msg.sender];
        _personStakeSatus.rewardsAmount = updateReward(msg.sender);
        _personStakeSatus.stakesAmount += _amount;
        updateStakeList(msg.sender);

        return true;
    }

    /**
     * @notice A method for this contract stakeholder to unstake.
     * uint256 The amount of wei in this method.
     * @param _amount The size of the unstake.
     */
    function unStake(uint256 _amount) public returns (bool) {
        StakeList storage _personStakeSatus = stakeLists[msg.sender];

        require(_personStakeSatus.stakesAmount != 0, "No stake");
        require(
            _amount > 0,
            "The amount to be transferred should be larger than 0"
        );
        require(
            _amount <= _personStakeSatus.stakesAmount,
            "The amount to be transferred should be less than Deposit"
        );

        BaseERC20Token.transfer(msg.sender, _amount);
        _personStakeSatus.rewardsAmount = updateReward(msg.sender);
        _personStakeSatus.stakesAmount -= _amount;
        updateStakeList(msg.sender);

        return true;
    }

    /**
     * @notice A method to allow a stakeholder to check his rewards.
     * uint256 The amount of wei in this method.
     */
    function getReward() public returns (bool) {
        StakeList storage _personStakeSatus = stakeLists[msg.sender];

        require(_personStakeSatus.rewardsAmount != 0, "No rewards");

        _personStakeSatus.rewardsAmount = updateReward(msg.sender);
        uint256 getRewardAmount = _personStakeSatus.rewardsAmount;
        BaseERC20Token.transfer(msg.sender, _personStakeSatus.rewardsAmount);
        _personStakeSatus.rewardsAmount = 0;
        updateStakeList(msg.sender);

        emit RewardPaid(msg.sender, getRewardAmount);

        return true;
    }

    /**
     * @notice A method to calcaulate the stake rewards for a stakeholder for all transactions.
     * @param _account The stakeholder to retrieve the stake rewards for.
     * @return uint256 The amount of ethers.
     */
    function updateReward(address _account) public view returns (uint256) {
        StakeList storage _personStakeSatus = stakeLists[_account];

        if (_personStakeSatus.stakesAmount == 0) {
            return _personStakeSatus.rewardsAmount;
        }
        return
            _personStakeSatus.rewardsAmount.add(
                block
                    .timestamp
                    .sub(_personStakeSatus.lastUpdateTime)
                    .mul(_personStakeSatus.stakesAmount)
                    .mul(rewardRate)
                    .div(fixedTotalSupply)
                    .div(10000)
            ); // it means that rewardRate is 0.001%
    }

    /**
     * @notice A method to update or push stake status for all transactions.
     * If an account is new, push his stake status while an already existing user, update them.
     * @param account The stakeholder to retrieve the stake status.
     */
    function updateStakeList(address account) public {
        StakeList storage personStakeSatus = stakeLists[account];

        if (personStakeSatus.lastUpdateTime == 0) {
            stakeListActs.push(account);
        }
        personStakeSatus.lastUpdateTime = block.timestamp;
    }

    /**
     * @notice A method to retrieve the stake for a stakeholder.
     * @param _stakeholder The stakeholder to retrieve the stake for.
     * @return uint256 The amount of ethers.
     */
    function stakeOf(address _stakeholder) public view returns (uint256) {
        StakeList storage _personStakeSatus = stakeLists[_stakeholder];
        return _personStakeSatus.stakesAmount;
    }

    /**
     * @notice A method to retrieve the rewards for a stakeholder.
     * @param _stakeholder The stakeholder to retrieve the rewards for.
     * @return uint256 The amount of ethers.
     */
    function rewardOf(address _stakeholder) public view returns (uint256) {
        StakeList storage _personStakeSatus = stakeLists[_stakeholder];
        return _personStakeSatus.rewardsAmount;
    }
}
