'use client'

import { createAppKit } from '@reown/appkit/react'
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react'
import { solana } from '@reown/appkit/networks'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'

// 1. Validasi Project ID
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
if (!projectId) {
  throw new Error('Project ID is not defined')
}

// 2. Setup Adapter
export const solanaWeb3JsAdapter = new SolanaAdapter({
  wallets: [new PhantomWalletAdapter(), new SolflareWalletAdapter()]
})

// 3. Metadata
const metadata = {
  name: 'Solana Reward',
  description: 'Claim Reward',
  url: 'https://solana.com', 
  icons: ['https://cryptologos.cc/logos/solana-sol-logo.png']
}

// --- DAFTAR ID RESMI REOWN (JANGAN DIUBAH SATU HURUF PUN) ---
// Urutan Array ini menentukan Urutan Tampilan di Layar.
const orderedWallets = [
  'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393', // 1. Phantom
  '1ca0bdd4747578705b1939af023d120677c64fe6ca76add81fda36e350605e79', // 2. Solflare
  '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // 3. Trust Wallet
  'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // 4. MetaMask
  '971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709', // 5. OKX Wallet
];

// 4. Inisialisasi
createAppKit({
  adapters: [solanaWeb3JsAdapter],
  networks: [solana],
  metadata: metadata,
  projectId,
  
  features: {
    email: false,    
    socials: [],     
    analytics: false 
  },

  // --- PENGATURAN URUTAN ---
  
  // 1. featuredWalletIds: Memaksa wallet ini tampil di HALAMAN DEPAN urut dari atas.
  featuredWalletIds: orderedWallets,

  // 2. includeWalletIds: Hapus ini agar "All Wallets" bisa mencari wallet lain juga.
  // (Jika kamu pakai include, wallet lain selain 5 itu gak bakal ketemu).

  // 3. Tampilkan tombol search/all wallets
  allWallets: 'SHOW',         
  
  // 4. Aktifkan WalletConnect (Untuk QR Code)
  enableWalletConnect: true,

  // Styling
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#000000',
    '--w3m-color-mix-strength': 40,
    '--w3m-accent': '#9945FF',
    '--w3m-border-radius-master': '2px',
    '--w3m-font-family': 'Inter, sans-serif',
    '--w3m-z-index': 999999
  }
})

export function AppKitModal({ children }: { children: React.ReactNode }) {
  return children
}