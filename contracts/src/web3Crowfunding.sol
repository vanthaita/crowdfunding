// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {AggregatorV3Interface} from "lib/chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract CrowdfundingCampaign is Ownable {
    struct Contribution {
        uint256 amount;
        bool isETH;
    }

    AggregatorV3Interface internal dataFeed;
    address public projectOwner;
    uint256 public goal;
    uint256 public totalRaised;
    uint256 public endTime;
    bool public goalMet = false;
    string public img_url;

    mapping(address => Contribution[]) public contributions;

    event ContributionMade(address indexed contributor, uint256 amount, bool isETH);
    event GoalReached(uint256 totalRaised);

    constructor(
        uint256 _goal,
        uint256 _duration,
        address _projectOwner
    ) Ownable(_projectOwner) {
        dataFeed = AggregatorV3Interface(
            0x694AA1769357215DE4FAC081bf1f309aDC325306
        );  
        goal = _goal;
        endTime = block.timestamp + _duration;
        projectOwner = _projectOwner;
    }

    function getChainlinkDataFeedLatestAnswer() public view returns (int) {
        (
               /* uint80 roundID */,
               int price,
               /* uint startedAt */,
               /* uint timeStamp */,
               /* uint80 answeredInRound */
           ) = dataFeed.latestRoundData();
           return price * 1e10;
    }

    function getCampaignDetails() external view returns (uint256, uint256, uint256, bool, address) {
        return (goal, totalRaised, endTime, goalMet, projectOwner);
    }

    function contributeETH() external payable {
        require(block.timestamp <= endTime, "Campaign ended");
        require(msg.value > 0, "Contribution amount must be greater than zero");
        
        int ethPriceUSD = getChainlinkDataFeedLatestAnswer();
        require(ethPriceUSD > 0, "Invalid price from oracle");
        
        uint256 ethPriceInUSD = uint256(ethPriceUSD); 

        require((msg.value * ethPriceInUSD) / 1 ether > 1e18, "Contribution must be greater than $1");

        contributions[msg.sender].push(Contribution(msg.value, true));
        totalRaised += msg.value;

        emit ContributionMade(msg.sender, msg.value, true);
        if (totalRaised >= goal) {
            goalMet = true;
            emit GoalReached(totalRaised);
        }
    }

    function withdraw() external onlyOwner {
        require(goalMet, "Goal not reached");
        require(block.timestamp > endTime, "Campaign still active");
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(projectOwner).transfer(balance);
    }

    function refund() external {
        require(block.timestamp > endTime, "Campaign still active");
        require(!goalMet, "Goal reached, no refunds");
        uint256 totalRefund;
        for (uint i = 0; i < contributions[msg.sender].length; i++) {
            Contribution memory contribution = contributions[msg.sender][i];
            if (contribution.isETH) {
                payable(msg.sender).transfer(contribution.amount);
            }
            totalRefund += contribution.amount;
        }
        delete contributions[msg.sender];
    }

    receive() external payable {
        contributions[msg.sender].push(Contribution(msg.value, true));
        totalRaised += msg.value;

        emit ContributionMade(msg.sender, msg.value, true);
        if (totalRaised >= goal) {
            goalMet = true;
            emit GoalReached(totalRaised);
        }
    }
}