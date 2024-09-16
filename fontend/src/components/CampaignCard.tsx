/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useWeb3ModalAccount } from "@web3modal/ethers/react";
import { ethers, Contract } from "ethers";
import { useState } from "react";
import { BrowserProvider } from "ethers";
import { contractCrowdfundingCampaignAbi } from "@/contract/contract-data";

interface CampaignCardProps {
  index: number;
  campaign: {
    addr: string;
    projectOwner: string;
    goal: ethers.BigNumberish;
    totalRaised: ethers.BigNumberish;
    endTime: string;
    goalMet: boolean;
    isETH: boolean;
  };
  walletProvider: any;
  pending: boolean;
}

export default function CampaignCard({
    index,
    campaign,
    walletProvider,
    pending,
    handleInteraction
  }: CampaignCardProps & { handleInteraction: (interaction: () => Promise<void>) => void }) {
    const [ethAmount, setEthAmount] = useState("");
    const [isContributing, setIsContributing] = useState(false);
    const [isRequestingRefund, setIsRequestingRefund] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const { address } = useWeb3ModalAccount();
  
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEthAmount(e.target.value);
    };
  
    const contributeETH = async (campaignAddr: string, amount: string) => {
      if (walletProvider) {
        try {
          setIsContributing(true);
          const ethersProvider = new BrowserProvider(walletProvider);
          const signer = await ethersProvider.getSigner();
          const ethAmount = ethers.parseEther(amount);
          const tx = await signer.sendTransaction({
            to: campaignAddr,
            value: ethAmount,
          });
          await tx.wait();
          console.log("Contribution successful");
        } catch (error) {
          console.error("Error contributing to campaign:", error);
        } finally {
          setIsContributing(false);
        }
      }
    };
  
    const refundContribution = async (campaignAddr: string, isETH: boolean) => {
      if (walletProvider) {
        try {
          setIsRequestingRefund(true);
          const ethersProvider = new BrowserProvider(walletProvider);
          const signer = await ethersProvider.getSigner();
          const contract = new Contract(campaignAddr, contractCrowdfundingCampaignAbi, signer);
  
          const [goal, totalRaised, endTime, goalMet] = await contract.getCampaignDetails();
          if (goalMet || Date.now() / 1000 <= Number(endTime)) {
            console.error("Cannot refund contributions.");
            return;
          }
  
          if (isETH) {
            const tx = await contract.refund(ethers.ZeroAddress);
            await tx.wait();
            console.log("Refund successful (ETH)");
          } else {
            const usdtTokenAddress = "0xYourUSDTTokenAddress";
            const tx = await contract.refund(usdtTokenAddress);
            await tx.wait();
            console.log("Refund successful (USDT)");
          }
        } catch (error) {
          console.error("Error processing refund:", error);
        } finally {
          setIsRequestingRefund(false);
        }
      }
    };
  
    const withdrawFunds = async (campaignAddr: string) => {
      if (walletProvider) {
        try {
          setIsWithdrawing(true);
          const ethersProvider = new BrowserProvider(walletProvider);
          const signer = await ethersProvider.getSigner();
          const contract = new Contract(campaignAddr, contractCrowdfundingCampaignAbi, signer);
          const [goal, totalRaised, endTime, goalMet] = await contract.getCampaignDetails();
  
          if (!goalMet || Date.now() / 1000 <= Number(endTime)) {
            console.error("Cannot withdraw funds.");
            return;
          }
  
          const tx = await contract.withdraw();
          await tx.wait();
          console.log("Withdrawal successful");
        } catch (error) {
          console.error("Error withdrawing funds:", error);
        } finally {
          setIsWithdrawing(false);
        }
      }
    };
  
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5 m-4 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Campaign {index + 1}</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p><strong>Address:</strong> {campaign.addr}</p>
          <p><strong>Owner:</strong> {campaign.projectOwner}</p>
          <p><strong>Goal:</strong> {ethers.formatEther(campaign.goal.toString())} ETH</p>
          <p><strong>Total Raised:</strong> {ethers.formatEther(campaign.totalRaised.toString())} ETH</p>
          <p><strong>End Time:</strong> {new Date(Number(campaign.endTime) * 1000).toLocaleString()}</p>
          <p><strong>Goal Met:</strong> {campaign.goalMet ? "Yes" : "No"}</p>
        </div>
        <input
          type="text"
          placeholder="Enter ETH amount"
          value={ethAmount}
          onChange={handleInputChange}
          id={`ethAmount-${index}`}
          className="w-full mt-4 p-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
          disabled={isContributing || isRequestingRefund || isWithdrawing}
        />
  
        <div className="flex gap-4 mt-4">
          <button
            className={`w-full bg-blue-500 text-white p-2 ${isContributing ? "opacity-50" : ""}`}
            onClick={() => handleInteraction(() => contributeETH(campaign.addr, ethAmount))}
            disabled={isContributing || pending}
          >
            {isContributing ? "Processing..." : "Contribute ETH"}
          </button>
  
          <div className="flex space-x-2">
            {campaign.projectOwner && (
              <button
                className={`bg-red-600 text-white px-4 py-2 ${isRequestingRefund ? "opacity-50" : ""}`}
                onClick={() => handleInteraction(() => refundContribution(campaign.addr, campaign.isETH))}
                disabled={isRequestingRefund || pending}
              >
                {isRequestingRefund ? "Refunding..." : "Refund"}
              </button>
            )}
  
            {campaign.projectOwner === address && (
              <button
                className={`bg-green-600 text-white px-4 py-2 ${isWithdrawing ? "opacity-50" : ""}`}
                onClick={() => handleInteraction(() => withdrawFunds(campaign.addr))}
                disabled={isWithdrawing || pending}
              >
                {isWithdrawing ? "Withdrawing..." : "Withdraw"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
  