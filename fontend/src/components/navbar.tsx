'use client'
import { shortenEthAddress } from '@/utils/shortenEthAddress'
import { createWeb3Modal, defaultConfig, useWeb3Modal, useWeb3ModalAccount } from '@web3modal/ethers/react'
const projectId = '64678bce9edefaddd6121a074b98bbcc'
const sepolia = {
  chainId: 11155111,
  name: 'Ethereum',
  currency: 'ETH',
  explorerUrl: 'https://sepolia.etherscan.io',
  rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/jS2rYjuA5jd4iZNM_FKujPU7ZHqlT966'
}

const metadata = {
  name: 'My Website',
  description: 'My Website description',
  url: 'https://mywebsite.com',
  icons: ['https://avatars.mywebsite.com/']
}
const ethersConfig = defaultConfig({
  metadata,
  enableEIP6963: true, // true by default
  enableInjected: true, // true by default
})

createWeb3Modal({
  ethersConfig,
  chains: [sepolia],
  projectId,
})
const Navbar = () => {
    const {open} = useWeb3Modal();
    const {address, isConnected } = useWeb3ModalAccount();
    return (
        <div className='container mx-auto flex justify-between items-center p-6'>
            <h1 className='text-2xl'>CrowdFunding</h1>
            <button className='bg-black text-white px-4 py-2 text-lg hover:bg-gray-700' onClick={() => {
                open()
            }}>
                {isConnected ? `${shortenEthAddress(address)}` : "Connect Wallet"}
            </button>
        </div>
  )
}

export default Navbar