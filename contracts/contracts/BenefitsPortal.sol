// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BenefitsPortal {
    address public owner;
    
    uint256 public baseStake = 0.001 ether;   // ~20 AED on testnet
    uint256 public stakeMultiplier = 1;
    uint256 public lockDuration = 60;          // 60 seconds for demo
    uint256 public constant BENEFIT_AMOUNT = 0.01 ether; // ~200 AED
    
    struct Claim {
        uint256 amount;
        uint256 timestamp;
        bool claimed;
        bool withdrawn;
        bool slashed;
    }
    
    mapping(address => Claim) public claims;
    address[] public flaggedWallets;
    uint256 public slashProposalTime;
    bool public slashPending;
    
    event StakeLocked(address indexed user, uint256 amount);
    event BenefitClaimed(address indexed user, uint256 benefit);
    event StakeWithdrawn(address indexed user, uint256 amount);
    event AttackDetected(uint256 newMultiplier);
    event SlashProposed(uint256 walletCount, uint256 timestamp);
    event SlashExecuted(uint256 burned, uint256 treasury);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function lockStake() external payable {
        require(msg.value >= getCurrentStake(), "Insufficient stake");
        require(claims[msg.sender].amount == 0, "Already locked");
        
        claims[msg.sender] = Claim({
            amount: msg.value,
            timestamp: block.timestamp,
            claimed: false,
            withdrawn: false,
            slashed: false
        });
        
        emit StakeLocked(msg.sender, msg.value);
    }
    
    function claimBenefit() external {
        Claim storage c = claims[msg.sender];
        require(c.amount > 0, "No stake");
        require(!c.claimed, "Already claimed");
        
        c.claimed = true;
        (bool success, ) = msg.sender.call{value: BENEFIT_AMOUNT}("");
        require(success, "Transfer failed");
        
        emit BenefitClaimed(msg.sender, BENEFIT_AMOUNT);
    }
    
    function withdrawStake() external {
        Claim storage c = claims[msg.sender];
        require(c.amount > 0, "No stake");
        require(!c.withdrawn, "Already withdrawn");
        require(!c.slashed, "Slashed");
        require(block.timestamp >= c.timestamp + lockDuration, "Still locked");
        
        c.withdrawn = true;
        (bool success, ) = msg.sender.call{value: c.amount}("");
        require(success, "Transfer failed");
        
        emit StakeWithdrawn(msg.sender, c.amount);
    }
    
    function getCurrentStake() public view returns (uint256) {
        return baseStake * stakeMultiplier;
    }
    
    function triggerAttackDetection(uint256 newMultiplier) external onlyOwner {
        stakeMultiplier = newMultiplier;
        emit AttackDetected(newMultiplier);
    }
    
    function submitSlashProposal(address[] calldata wallets) external onlyOwner {
        flaggedWallets = wallets;
        slashProposalTime = block.timestamp;
        slashPending = true;
        emit SlashProposed(wallets.length, block.timestamp);
    }
    
    function executeSlash() external onlyOwner {
        require(slashPending, "No proposal");
        require(block.timestamp >= slashProposalTime + 30, "Dispute window active");
        
        uint256 totalSlashed = 0;
        for (uint256 i = 0; i < flaggedWallets.length; i++) {
            Claim storage c = claims[flaggedWallets[i]];
            if (c.amount > 0 && !c.slashed) {
                totalSlashed += c.amount;
                c.slashed = true;
            }
        }
        
        uint256 burned = totalSlashed / 2;
        uint256 treasury = totalSlashed - burned;
        
        slashPending = false;
        emit SlashExecuted(burned, treasury);
    }
    
    receive() external payable {}
}