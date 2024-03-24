export interface Block {
  height: number;
  hash?: string;
  timestamp?: Date;
  proposer?: Validator;
  chainId?: string;
  rounds: { [key: number]: Round };

  validatorSet?: ValidatorSet;
}

export interface ValidatorSet {
  [key: string]: Validator;
}

export function getBondStatus(status: string) {
  switch (status) {
    case 'BOND_STATUS_BONDED':
      return BondStatus.BONDED;
    case 'BOND_STATUS_UNBONDED':
      return BondStatus.UNBONDED;
    case 'BOND_STATUS_UNBONDING':
      return BondStatus.UNBONDING;
    default:
      return BondStatus.UNKNOWN;
  }
}

export interface Validator {
  name: string;
  identity: string;
  website: string;
  emailAddress: string;
  description: string;

  operatorAddress: string;
  consensusAddress?: string;
  publicKey: PublicKey;

  bondStatus: BondStatus;
  jailed: boolean;
  unbondingHeight: number;
  unbondingTimestamp: Date;
  tokens: number;
  minSelfDelegation: number;
  delegatorShares: number;
  commission: Commission;

  votingPower?: number;
  proposerPriority?: number;
}

export enum BondStatus {
  BONDED, UNBONDED, UNBONDING, UNKNOWN
}

export interface PublicKey {
  type: string;
  key: string;
}

export interface Commission {
  rate: number;
  maxRate: number;
  changeRate: number;
  updateTimestamp: Date;
}

export interface Vote {
  timestamp: Date;
  blockHash?: string;
  validator?: Validator,
}

export interface Pre extends Vote {
  validatorHash: string;
  validatorIndex: number;
}



export interface Prevote extends Pre {
}

export interface Precommit extends Pre {
}

export interface Commit extends Vote {
  commitType: CommitType;
}

export enum CommitType {
  COMMIT = 'BLOCK_ID_FLAG_COMMIT',
  ABSENT = 'BLOCK_ID_FLAG_ABSENT',
  NIL = 'BLOCK_ID_FLAG_NIL',
  UNKNOWN = 'BLOCK_ID_FLAG_UNKNOWN',
}


export interface Round {
  prevotes: Prevote[];
  precommits: Precommit[];
  commits: Commit[];
}
