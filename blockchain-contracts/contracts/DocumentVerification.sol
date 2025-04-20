// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DocumentVerification {
    struct Document {
        bytes32 hash; // Cryptographic fingerprint of document content and metadata
        address creator;// Ethereum address of the document owner
        uint256 timestamp; // Timestamp of when the document was created
        bool exists; // Flag to check if the document exists
    }

    mapping(bytes32 => Document) public documents;
    
    event DocumentStored(bytes32 indexed documentId, bytes32 hash, address creator);
    event DocumentVerified(bytes32 indexed documentId, bool authentic);

    function storeDocument(bytes32 documentId, bytes32 hash) public {
        require(!documents[documentId].exists, "Document already exists");
        
        documents[documentId] = Document({
            hash: hash,
            creator: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });
        
        emit DocumentStored(documentId, hash, msg.sender);
    }

    function verifyDocument(bytes32 documentId, bytes32 hash) public view returns (bool) {
        require(documents[documentId].exists, "Document does not exist");
        return documents[documentId].hash == hash;
    }

    function getDocument(bytes32 documentId) public view returns (bytes32, address, uint256, bool) {
        Document memory doc = documents[documentId];
        return (doc.hash, doc.creator, doc.timestamp, doc.exists);
    }
} 