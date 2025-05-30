/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from "./common";

export interface DocumentVerificationInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "documents"
      | "getDocument"
      | "storeDocument"
      | "verifyDocument"
  ): FunctionFragment;

  getEvent(
    nameOrSignatureOrTopic: "DocumentStored" | "DocumentVerified"
  ): EventFragment;

  encodeFunctionData(
    functionFragment: "documents",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getDocument",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "storeDocument",
    values: [BytesLike, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "verifyDocument",
    values: [BytesLike, BytesLike]
  ): string;

  decodeFunctionResult(functionFragment: "documents", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getDocument",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "storeDocument",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "verifyDocument",
    data: BytesLike
  ): Result;
}

export namespace DocumentStoredEvent {
  export type InputTuple = [
    documentId: BytesLike,
    hash: BytesLike,
    creator: AddressLike
  ];
  export type OutputTuple = [documentId: string, hash: string, creator: string];
  export interface OutputObject {
    documentId: string;
    hash: string;
    creator: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace DocumentVerifiedEvent {
  export type InputTuple = [documentId: BytesLike, authentic: boolean];
  export type OutputTuple = [documentId: string, authentic: boolean];
  export interface OutputObject {
    documentId: string;
    authentic: boolean;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface DocumentVerification extends BaseContract {
  connect(runner?: ContractRunner | null): DocumentVerification;
  waitForDeployment(): Promise<this>;

  interface: DocumentVerificationInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  documents: TypedContractMethod<
    [arg0: BytesLike],
    [
      [string, string, bigint, boolean] & {
        hash: string;
        creator: string;
        timestamp: bigint;
        exists: boolean;
      }
    ],
    "view"
  >;

  getDocument: TypedContractMethod<
    [documentId: BytesLike],
    [[string, string, bigint, boolean]],
    "view"
  >;

  storeDocument: TypedContractMethod<
    [documentId: BytesLike, hash: BytesLike],
    [void],
    "nonpayable"
  >;

  verifyDocument: TypedContractMethod<
    [documentId: BytesLike, hash: BytesLike],
    [boolean],
    "view"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "documents"
  ): TypedContractMethod<
    [arg0: BytesLike],
    [
      [string, string, bigint, boolean] & {
        hash: string;
        creator: string;
        timestamp: bigint;
        exists: boolean;
      }
    ],
    "view"
  >;
  getFunction(
    nameOrSignature: "getDocument"
  ): TypedContractMethod<
    [documentId: BytesLike],
    [[string, string, bigint, boolean]],
    "view"
  >;
  getFunction(
    nameOrSignature: "storeDocument"
  ): TypedContractMethod<
    [documentId: BytesLike, hash: BytesLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "verifyDocument"
  ): TypedContractMethod<
    [documentId: BytesLike, hash: BytesLike],
    [boolean],
    "view"
  >;

  getEvent(
    key: "DocumentStored"
  ): TypedContractEvent<
    DocumentStoredEvent.InputTuple,
    DocumentStoredEvent.OutputTuple,
    DocumentStoredEvent.OutputObject
  >;
  getEvent(
    key: "DocumentVerified"
  ): TypedContractEvent<
    DocumentVerifiedEvent.InputTuple,
    DocumentVerifiedEvent.OutputTuple,
    DocumentVerifiedEvent.OutputObject
  >;

  filters: {
    "DocumentStored(bytes32,bytes32,address)": TypedContractEvent<
      DocumentStoredEvent.InputTuple,
      DocumentStoredEvent.OutputTuple,
      DocumentStoredEvent.OutputObject
    >;
    DocumentStored: TypedContractEvent<
      DocumentStoredEvent.InputTuple,
      DocumentStoredEvent.OutputTuple,
      DocumentStoredEvent.OutputObject
    >;

    "DocumentVerified(bytes32,bool)": TypedContractEvent<
      DocumentVerifiedEvent.InputTuple,
      DocumentVerifiedEvent.OutputTuple,
      DocumentVerifiedEvent.OutputObject
    >;
    DocumentVerified: TypedContractEvent<
      DocumentVerifiedEvent.InputTuple,
      DocumentVerifiedEvent.OutputTuple,
      DocumentVerifiedEvent.OutputObject
    >;
  };
}
