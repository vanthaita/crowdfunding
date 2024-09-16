// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";

import {CrowdfundingCampaign} from "src/web3Crowfunding.sol";

contract CrowdfundingFactory is Ownable {
    address[] public crowdfundingCampaigns;

    event CampaignCreated(
        address indexed campaignAddress,
        address indexed projectOwner,
        uint256 goal,
        uint256 endTime
    );
    constructor() Ownable(msg.sender) {}
    function createCrowdfundingCampaign(
        uint256 _goal,
        uint256 _duration
    ) external {
        CrowdfundingCampaign campaign = new CrowdfundingCampaign(
            _goal,
            _duration,
            msg.sender
        );
        crowdfundingCampaigns.push(address(campaign));
        emit CampaignCreated(address(campaign), msg.sender, _goal, block.timestamp + _duration);
    }
    function getCampaignCount() external view returns (uint256) {
        return crowdfundingCampaigns.length;
    }
    function getCampaigns() external view returns (address[] memory) {
        return crowdfundingCampaigns;
    }
}
