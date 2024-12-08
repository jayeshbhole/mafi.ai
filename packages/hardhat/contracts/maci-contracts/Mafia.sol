// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IMACI } from "maci-contracts/contracts/interfaces/IMACI.sol";
import { IPollFactory } from "maci-contracts/contracts/interfaces/IPollFactory.sol";
import { DomainObjs } from "maci-contracts/contracts/utilities/DomainObjs.sol";
import { Params } from "maci-contracts/contracts/utilities/Params.sol";
import { Utilities } from "maci-contracts/contracts/utilities/Utilities.sol";
import { SignUpGatekeeper } from "maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol";
import { InitialVoiceCreditProxy } from "maci-contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol";
import { ITallyFactory } from "maci-contracts/contracts/interfaces/ITallyFactory.sol";
import { IMessageProcessorFactory } from "maci-contracts/contracts/interfaces/IMPFactory.sol";
import { LazyIMTData, InternalLazyIMT } from "maci-contracts/contracts/trees/LazyIMT.sol";
import { CurveBabyJubJub } from "maci-contracts/contracts/crypto/BabyJubJub.sol";

contract Mafia is DomainObjs, Params, Utilities, Ownable(msg.sender) {
	uint256 internal constant BLANK_STATE_LEAF_HASH =
		uint256(
			6769006970205099520508948723718471724660867171122235270773600567925038008762
		);
	uint8 internal constant STATE_TREE_DEPTH = 5;

	IPollFactory public immutable pollFactory;
	IMessageProcessorFactory public immutable messageProcessorFactory;
	ITallyFactory public immutable tallyFactory;

	struct Poll {
		address poll;
		address messageProcessor;
		address tally;
	}

	struct Game {
		uint256 startTime;
		uint256 endTime;
		string tallyUrl;
		address[] players;
		Poll[] polls;
		LazyIMTData lazyIMTData;
	}

	struct Player {
		address addr;
		uint256 x;
		uint256 y;
	}

	TreeDepths public treeDepths;
	PubKey public coordinatorPubKey;
	address public verifier;
	address public vkRegistry;

	Game[] private games;
	mapping(address => uint256) playerHash;

	uint256[5] public emptyBallotRoots;

	error PoseidonHashLibrariesNotLinked();
	error TooManySignups();
	error InvalidPubKey();

	event DeployPoll(
		uint256 indexed _gameId,
		uint256 indexed _pollId,
		Mode _mode
	);

	constructor(
		IPollFactory _pollFactory,
		IMessageProcessorFactory _messageProcessorFactory,
		ITallyFactory _tallyFactory,
		uint256[5] memory _emptyBallotRoots
	) payable {
		pollFactory = _pollFactory;
		messageProcessorFactory = _messageProcessorFactory;
		tallyFactory = _tallyFactory;
		emptyBallotRoots = _emptyBallotRoots;

		// Verify linked poseidon libraries
		if (hash2([uint256(1), uint256(1)]) == 0)
			revert PoseidonHashLibrariesNotLinked();
	}

	function setConfig(
		TreeDepths memory _treeDepths,
		PubKey memory _coordinatorPubKey,
		address _verifier,
		address _vkRegistry
	) public onlyOwner {
		treeDepths = _treeDepths;
		coordinatorPubKey = _coordinatorPubKey;
		verifier = _verifier;
		vkRegistry = _vkRegistry;
	}

	/// @notice create a new game
	/// @param _duration the duration of the game
	function createGame(
		uint256 _duration,
		Player[] calldata _players
	) external onlyOwner {
		games.push();
		uint gameId = games.length - 1;
		Game storage game = games[gameId];
		game.startTime = block.timestamp;
		game.endTime = block.timestamp + _duration;
		for (uint256 i = 0; i < _players.length; i++) {
			game.players.push(_players[i].addr);
		}

		_addPlayers(gameId, _players);
	}

	function _addPlayers(uint256 _gameId, Player[] calldata _players) private {
		Game storage game = games[_gameId];
		InternalLazyIMT._init(game.lazyIMTData, STATE_TREE_DEPTH);
		InternalLazyIMT._insert(game.lazyIMTData, BLANK_STATE_LEAF_HASH);

		uint256 timestamp = block.timestamp;

		for (uint256 i = 0; i < _players.length; i++) {
			Player memory player = _players[i];
			if (!CurveBabyJubJub.isOnCurve(player.x, player.y)) {
				revert InvalidPubKey();
			}

			uint256 stateLeaf = hashStateLeaf(
				StateLeaf(PubKey(player.x, player.y), 100, timestamp)
			);
			playerHash[player.addr] = stateLeaf;
			InternalLazyIMT._insert(game.lazyIMTData, stateLeaf);
		}
	}

	function updatePlayers(
		uint256 _gameId,
		address removedPlayer
	) public onlyOwner {
		Game storage game = games[_gameId];

		InternalLazyIMT._init(game.lazyIMTData, STATE_TREE_DEPTH);
		InternalLazyIMT._insert(game.lazyIMTData, BLANK_STATE_LEAF_HASH);

		for (uint256 i = 0; i < game.players.length; i++) {
			if (game.players[i] == removedPlayer) {
				game.players[i] = game.players[game.players.length - 1];
				game.players.pop();
			}
			InternalLazyIMT._insert(
				game.lazyIMTData,
				playerHash[game.players[i]]
			);
		}
	}

	function createPoll(uint256 _gameId, uint _duration) public onlyOwner {
		uint256 voteOptionTreeDepth = treeDepths.voteOptionTreeDepth;
		address p = pollFactory.deploy(
			_duration,
			treeDepths,
			coordinatorPubKey,
			address(this),
			emptyBallotRoots[voteOptionTreeDepth - 1]
		);

		address mp = messageProcessorFactory.deploy(
			verifier,
			vkRegistry,
			p,
			msg.sender,
			Mode.NON_QV
		);
		address tally = tallyFactory.deploy(
			verifier,
			vkRegistry,
			p,
			mp,
			msg.sender,
			Mode.NON_QV
		);

		Game storage game = games[_gameId];
		game.polls.push(Poll({ poll: p, messageProcessor: mp, tally: tally }));

		emit DeployPoll(_gameId, game.polls.length - 1, Mode.NON_QV);
	}
}
