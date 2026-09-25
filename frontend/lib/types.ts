export type SystemStatus = "NORMAL" | "UNDER_ATTACK" | "DEFENDED" | "SLASHED";

export type AlertKind = "info" | "warn" | "danger" | "success" | "slash";

export type Alert = {
  id: string;
  kind: AlertKind;
  text: string;
  ts: number;
};

export type GraphNodeKind =
  | "real"
  | "unverified"
  | "flagged"
  | "master"
  | "slashed";

export type GraphNodeData = {
  kind: GraphNodeKind;
  label?: string;
};

export type WsMessage =
  | { type: "STAKE_LOCKED"; address: string; amount: number; fundingSource?: string; isReal?: boolean; timestamp: number }
  | { type: "BENEFIT_CLAIMED"; address: string; amount: number; timestamp: number }
  | { type: "STAKE_RETURNED"; address: string; timestamp: number }
  | { type: "ATTACK_DETECTED"; reason: string; wallets: string[]; multiplier: number; timestamp: number }
  | { type: "STAKE_REQUIREMENT_UPDATED"; requiredStake: number; multiplier: number }
  | { type: "CAPITAL_LOCKED"; amount: number }
  | { type: "SLASH_PROPOSAL"; wallets: string[]; reason: string; disputeSeconds: number }
  | { type: "SLASH_EXECUTED"; burned: number; treasury: number; attackerLoss: number }
  | { type: "STATUS_UPDATE"; status: SystemStatus }
  | { type: "RESET" };