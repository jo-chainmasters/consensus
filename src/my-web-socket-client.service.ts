import { Injectable, Logger } from '@nestjs/common';
import { WebSocket } from 'ws';
import { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Block, Vote } from './model/Block';

const wsUrl = 'wss://rpc.unification.chainmasters.ninja/websocket';
const rpcUrl = 'https://rpc.unification.chainmasters.ninja:443';

@Injectable()
export class MyWebSocketClient {
  private readonly logger = new Logger(MyWebSocketClient.name);

  private client: WebSocket;

  private blocks: { [key: number]: Block } = {};

  private subscribeNewRoundStep = {
    jsonrpc: '2.0',
    method: 'subscribe',
    params: {
      query: "tm.event='NewRoundStep'",
    },
    id: '1',
  };

  private subscribeVote = {
    jsonrpc: '2.0',
    method: 'subscribe',
    params: {
      query: "tm.event='Vote'",
    },
    id: '2',
  };
  private subscribeCompleteProposal = {
    jsonrpc: '2.0',
    method: 'subscribe',
    params: {
      query: "tm.event='CompleteProposal'",
    },
    id: '2',
  };
  private subscribeTimeoutPropose = {
    jsonrpc: '2.0',
    method: 'subscribe',
    params: {
      query: "tm.event='TimeoutPropose'",
    },
    id: '2',
  };
  private subscribeCompletePolka = {
    jsonrpc: '2.0',
    method: 'subscribe',
    params: {
      query: "tm.event='Polka'",
    },
    id: '2',
  };
  private subscribeValidBlock = {
    jsonrpc: '2.0',
    method: 'subscribe',
    params: {
      query: "tm.event='ValidBlock'",
    },
    id: '2',
  };
  private subscribeNewRound = {
    jsonrpc: '2.0',
    method: 'subscribe',
    params: {
      query: "tm.event='NewRound'",
    },
    id: '2',
  };

  private persistBlock(height: number) {
    const block = this.blocks[height];
    if (block) {
      const collection = this.connection.collection('consensus');
      collection.insertOne(block).then();
    }
  }

  private processMessage(message: any): void {
    if (message.result.query === "tm.event='NewRoundStep'") {
      const newRoundStep = {
        height: Number(message.result.data.value.height),
        step: message.result.data.value.step,
        round: Number(message.result.data.value.round),
        timestamp: Date.now(),
      };
      this.logger.log(
        `NewRoundStep     : height: ${newRoundStep.height}, round: ${newRoundStep.round}, step: ${newRoundStep.step}`,
      );

      if (newRoundStep.step === 'RoundStepNewHeight') {
        this.blocks[newRoundStep.height] = {
          height: newRoundStep.height,
          rounds: {},
        };

        const pHeight = newRoundStep.height - 2;
        this.persistBlock(pHeight);
        delete this.blocks[pHeight];
      }
    } else if (message.result.query === "tm.event='NewRound'") {
      this.logger.log(
        `NewRound         : height: ${message.result.data.value.height}, round: ${message.result.data.value.round}, step: ${message.result.data.value.step}, validator: ${message.result.data.value.proposer.address}`,
      );

      if (this.blocks[message.result.data.value.height]) {
        this.blocks[message.result.data.value.height].rounds[
          message.result.data.value.round
        ] = {
          prevotes: [],
          precommits: [],
          commits: [],
          prevote: [],
          precommit: [],
        };
      }
    } else if (message.result.query === "tm.event='CompleteProposal'") {
      this.logger.log(
        `CompleteProposal : height: ${message.result.data.value.height}, round: ${message.result.data.value.round}, step: ${message.result.data.value.step}, block: ${message.result.data.value.block_id.hash}`,
      );
    } else if (message.result.query === "tm.event='Polka'") {
      this.logger.log(
        `Polka            : height: ${message.result.data.value.height}, round: ${message.result.data.value.round}, step: ${message.result.data.value.step}`,
      );
    } else if (message.result.query === "tm.event='TimeoutPropose'") {
      this.logger.log(
        `TimeoutPropose   : height: ${message.result.data.value.height}, round: ${message.result.data.value.round}, step: ${message.result.data.value.step}`,
      );
    } else if (message.result.query === "tm.event='ValidBlock'") {
      this.logger.log(
        `ValidBlock       : height: ${message.result.data.value.height}, round: ${message.result.data.value.round}, step: ${message.result.data.value.step}`,
      );
    } else if (message.result.query === "tm.event='Vote'") {
      let type = message.result.data.value.Vote.type as string;
      if (type == '1') {
        type = 'prevote';
      }
      if (type == '2') {
        type = 'precommit';
      }
      const vote = {
        height: Number(message.result.data.value.Vote.height),
        type,
        round: Number(message.result.data.value.Vote.round),
        block: message.result.data.value.Vote.block_id.hash,
        timestamp: new Date(message.result.data.value.Vote.timestamp).getTime(),
        validatorHash: message.result.data.value.Vote.validator_address,
        validatorIndex: Number(message.result.data.value.Vote.validator_index),
      };
      // this.logger.log(
      //   `Vote             : height: ${vote.height}, round: ${vote.round}, type: ${vote.type}, block: ${vote.block}, timestamp: ${new Date(vote.timestamp)}, validator: ${vote.validator}`,
      // );

      if (this.blocks[vote.height]) {
        switch (vote.type) {
          case 'prevote':
            break;
          case 'precommit':
        }
      }

      if (this.blocks[vote.height]) {
        if (!this.blocks[vote.height].rounds[vote.round][vote.type]) {
          this.blocks[vote.height].rounds[vote.round][vote.type] = [];
        }

        this.blocks[vote.height].rounds[vote.round][vote.type].push({
          blockHash: vote.block,
          timestamp: vote.timestamp,
          validatorHash: vote.validatorHash,
          validatorIndex: vote.validatorIndex,
        } as Vote);
      }
    } else {
      console.log('Messenge', message);
    }
  }

  constructor(@InjectConnection() private readonly connection: Connection) {
    this.client = new WebSocket(wsUrl);

    this.client.on('open', () => {
      this.sendMessage(this.subscribeNewRoundStep);
      this.sendMessage(this.subscribeVote);
      this.sendMessage(this.subscribeNewRound);
      this.sendMessage(this.subscribeCompleteProposal);
      this.sendMessage(this.subscribeCompletePolka);
      this.sendMessage(this.subscribeTimeoutPropose);
      this.sendMessage(this.subscribeValidBlock);
    });

    this.client.on('message', (data: WebSocket.Data) => {
      const message = JSON.parse(data.toString());
      this.processMessage(message);
    });

    this.client.on('error', (error) => {
      console.error('Fehler in WebSocket:', error);
    });
  }

  sendMessage(message: any) {
    this.client.send(JSON.stringify(message));
  }
}
