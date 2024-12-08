import { extractVk } from "maci-circuits";
import { VerifyingKey } from "maci-domainobjs";
import { ContractStorage, EContracts } from "maci-contracts";

import type { IVerifyingKeyStruct } from "maci-contracts";
import type { VkRegistry } from "../typechain-types";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
  intStateTreeDepth,
  messageBatchDepth,
  messageTreeDepth,
  processMessagesNonQvZkeyPath,
  processMessagesZkeyPath,
  stateTreeDepth,
  tallyVotesNonQvZkeyPath,
  tallyVotesZkeyPath,
  voteOptionTreeDepth,
} from "../constants";

export enum EMode {
  QV,
  NON_QV,
}

const storage = ContractStorage.getInstance();

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  await hre.deployments.deploy("VkRegistry", {
    from: deployer,
    args: [],
    log: false,
    autoMine: true,
  });

  const vkRegistry = await hre.ethers.getContract<VkRegistry>("VkRegistry", deployer);
  console.log(`The Vk Registry is deployed at ${await vkRegistry.getAddress()}`);

  const [processVk, tallyVk, tallyVkNonQv, processVkNonQv] = await Promise.all([
    extractVk(processMessagesZkeyPath),
    extractVk(tallyVotesZkeyPath),
    extractVk(tallyVotesNonQvZkeyPath),
    extractVk(processMessagesNonQvZkeyPath),
  ]).then(vks => vks.map(vk => (vk ? VerifyingKey.fromObj(vk as any) : null)));

  const messageBatchSize = 5 ** messageBatchDepth;
  const processVkParam = processVk!.asContractParam() as IVerifyingKeyStruct;
  const tallyVkParam = tallyVk!.asContractParam() as IVerifyingKeyStruct;
  const tallyVkNonQvParam = tallyVkNonQv!.asContractParam() as IVerifyingKeyStruct;
  const processVkNonQvParam = processVkNonQv!.asContractParam() as IVerifyingKeyStruct;

  console.log("Setting verifying keys");
  console.log("Log", {
    stateTreeDepth,
    intStateTreeDepth,
    messageTreeDepth,
    voteOptionTreeDepth,
    messageBatchSize,
    a: [EMode.QV, EMode.NON_QV],
    b: [processVkParam, processVkNonQvParam],
    c: [tallyVkParam, tallyVkNonQvParam],
  });

  const tx = await vkRegistry.setVerifyingKeysBatch(
    stateTreeDepth,
    intStateTreeDepth,
    messageTreeDepth,
    voteOptionTreeDepth,
    messageBatchSize,
    [EMode.QV, EMode.NON_QV],
    [processVkParam, processVkNonQvParam],
    [tallyVkParam, tallyVkNonQvParam],
  );
  await tx.wait();

  await storage.register({
    id: EContracts.VkRegistry,
    contract: vkRegistry,
    args: [],
    network: hre.network.name,
  });
};

export default deployContracts;

deployContracts.tags = ["VkRegistry"];