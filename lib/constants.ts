// ── BNB Smart Chain Configuration ──
export const BSC_RPC = "https://bsc-dataseed.binance.org/";
export const BSC_CHAIN_ID = 56;

// ── 3WM Token Contract (BEP-20) ──
export const TOKEN_CONTRACT_ADDRESS = "0xd065ca6460ae6d379c93ec0422084c2bc7048d77";
export const TOKEN_DECIMALS = 10;

// ── Minimal ERC-20 ABI for transfer + read operations ──
export const ERC20_ABI = [
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

// ── BscScan explorer base URL ──
export const BSCSCAN_BASE = "https://bscscan.com/address/";
export const BSCSCAN_TX_BASE = "https://bscscan.com/tx/";
