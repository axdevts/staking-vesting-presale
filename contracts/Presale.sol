//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./BaseERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Presale {
    using SafeMath for uint256;

    BaseERC20 public BaseERC20Token;

    event GotTokens(BaseERC20 token_, uint256 amount);

    address payable ownerWallet;
    uint256 public rate;
    uint256 public totalEarned;
    uint256 public sentEther; //TEST VARIABLE
    /**
    * @dev Creates a presale contract that allows all users to buy BaseERC20 tokens.
    * @param _rate the currency of BaseERC20 with ether
    * @param _ownerWallet wallet address of owner to receive ethers
    * @param _baseTokenAddr BaseERC20 contract addresss that is already deployed
    */ 
    constructor(uint256 _rate, address payable _ownerWallet, BaseERC20 _baseTokenAddr) {
        require(_rate > 0, 'Zero rate!');
        require(address(_ownerWallet) != address(0), 'Zero wallet address');
        require(address(_baseTokenAddr) != address(0), 'Zero token address');

        rate = _rate;
        ownerWallet = _ownerWallet;
        BaseERC20Token = _baseTokenAddr;
    }
    /**
     * @return the amount of the total ethers that is pre-saled so far.
     */
    function _getTotalEarned() private view returns(uint256) {
        return totalEarned;
    }

    /**
     * @return the price according of the amount of the tokens.
     * @param amount the amount of the tokens
     */
    function getPrice(uint256 amount) public view returns(uint256) {
        return amount.div(rate);
    }
    
    /**
    * @notice A method to transfer the number of BaseERC20Tokens respect to the paid wei.
    * Calculates the number of tokens with rate , and the total presale wei.
    * Get paid and transfer tokens to the beneficairy.
    * @param _beneficiary the beneficairy wallet address.
    */
    function buyTokens(address _beneficiary) external payable {
        require(_beneficiary != address(0));
        require(msg.value != 0);

        uint256 tokens = msg.value.mul(rate);
        totalEarned = totalEarned.add(msg.value);

        BaseERC20Token.transfer(_beneficiary, tokens);
        ownerWallet.transfer(msg.value);
        sentEther = msg.value;

        emit GotTokens(BaseERC20Token, tokens);
    }

    /* ========== TEST FUNCTIONS ========== */

    /**
     * pubic function for TEST
     * @return the msg.vaule
     */
    function getSentEther() public view returns(uint256) {
        return sentEther;
    }
    
    /**
     * pubic function for TEST
     * @return the amount of the total ethers that is pre-saled so far.
     */
    function getTotalEarned() public view returns(uint256) {
        return _getTotalEarned();
    }
}