export interface Block {
  height: number;
  rounds: { [key: number]: Round };

  validatorSet?: any[];
}

export interface Vote {
  timestamp: number;
  blockHash?: string;
  validatorMoniker?: string;
  validatorDetails?: any;
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
