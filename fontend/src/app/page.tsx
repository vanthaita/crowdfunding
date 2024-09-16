/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useWeb3ModalProvider } from "@web3modal/ethers/react";
import { BrowserProvider, Contract, ethers } from "ethers";
import { contractAddr, contractCrowdfundingFactoryAbi, contractCrowdfundingCampaignAbi } from "@/contract/contract-data";
import { useEffect, useState } from "react";
import CampaignCard from "@/components/CampaignCard";

export default function Home() {
  const { walletProvider } = useWeb3ModalProvider();
  const [campaignAddresses, setCampaignAddresses] = useState<string[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [pendingCampaigns, setPendingCampaigns] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState("");

  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    const fetchCampaignAddresses = async () => {
      if (walletProvider) {
        try {
          const ethersProvider = new BrowserProvider(walletProvider);
          const signer = await ethersProvider.getSigner();
          const contract = new Contract(contractAddr, contractCrowdfundingFactoryAbi, signer);

          const addresses = await contract.getCampaigns();
          console.log(addresses);
          setCampaignAddresses(addresses);
          const campaignDetails = await Promise.all(
            addresses.map(async (addr: string) => {
              const campaignContract = new Contract(addr, contractCrowdfundingCampaignAbi, signer);
              const [goal, totalRaised, endTime, goalMet, projectOwner] = await campaignContract.getCampaignDetails();
              return { addr, goal, totalRaised, endTime, goalMet, projectOwner };
            })
          );
          setCampaigns(campaignDetails);
        } catch (error) {
          console.error("Error fetching contract data:", error);
        }
      } else {
        console.log("No wallet provider available");
      }
    };
    fetchCampaignAddresses();
  }, [walletProvider]);

  const createCrowdfundingCampaign = async (_goal: string, _duration: string) => {
    if (walletProvider) {
      try {
        setPending(true);
        const ethersProvider = new BrowserProvider(walletProvider);
        const signer = await ethersProvider.getSigner();
        const contract = new Contract(contractAddr, contractCrowdfundingFactoryAbi, signer);
        const goalInWei = ethers.parseUnits(_goal, 'ether'); 
        const durationInSeconds = parseInt(_duration) * 24 * 60 * 60; 
        const tx = await contract.createCrowdfundingCampaign(goalInWei, durationInSeconds);
        await tx.wait();
        console.log("Crowdfunding campaign created successfully");
      } catch (error) {
        console.error("Error creating crowdfunding campaign:", error);
      } finally {
        setPending(false);
      }
    }
  };

  const handleCampaignInteraction = async (addr: string, interaction: () => Promise<void>) => {
    setPendingCampaigns((prev) => [...prev, addr]);
    try {
      await interaction();
    } catch (error) {
      console.error("Error interacting with campaign:", error);
    } finally {
      setPendingCampaigns((prev) => prev.filter((campaignAddr) => campaignAddr !== addr));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Crowdfunding Campaigns</h1>

      <div className="flex justify-center mb-8">
        <button
          className={`bg-blue-600 text-white px-6 py-3 rounded-md shadow-lg hover:bg-blue-700 transition duration-300 ${pending ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => setIsModalOpen(true)}
          disabled={pending}
        >
          {pending ? 'Creating...' : 'Create New Campaign'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.length > 0 ? (
          campaigns.map((campaign, index) => (
            <CampaignCard
              key={campaign.addr}
              index={index}
              campaign={campaign}
              walletProvider={walletProvider}
              pending={pendingCampaigns.includes(campaign.addr)}
              handleInteraction={(interaction: () => Promise<void>) => handleCampaignInteraction(campaign.addr, interaction)}
            />
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">No campaigns available</p>
        )}
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
            <h2 className="text-xl font-semibold mb-6">Create New Campaign</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Goal (in ETH)</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter campaign goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (in days)</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter campaign duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300 ${pending ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => createCrowdfundingCampaign(goal, duration)}
                disabled={pending}
              >
                {pending ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
