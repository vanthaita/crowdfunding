// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script} from "lib/forge-std/src/Script.sol";
import {CrowdfundingFactory} from "src/CrowdfundingFactory.sol";
import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract DeployCrowdfundingFactory is Script {
    function run() external returns (CrowdfundingFactory) {
        vm.startBroadcast();
        CrowdfundingFactory factory = new CrowdfundingFactory();
        vm.stopBroadcast();
        return factory;
    }
}
