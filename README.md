# SealTrack Global

A secure document signing application leveraging blockchain technology for enhanced verification and trust. Built with React, Supabase, and Ethereum.

## Features

*   **User Authentication:** Secure login and registration using Supabase Auth.
*   **Document Management:**
    *   Create, view, update, and delete documents.
    *   Rich text editor for document content.
    *   Organize documents by category.
    *   Utilize templates for faster document creation.
*   **Secure Signing:**
    *   Multi-signer support.
    *   Visual signature capture using a signature canvas.
    *   Blockchain-based signature verification using MetaMask and Ethereum (Sepolia Testnet).
    *   Combined hashing of document content and visual signature for integrity.
*   **Verification:**
    *   Verify document authenticity against blockchain records.
    *   Track document status (Draft, Pending, Completed, Rejected).
    *   View detailed document history and signature timestamps.
*   **PDF Generation:** Download signed documents as PDF files via Supabase Edge Functions.
*   **Notifications:** Email notifications for signature requests and document completion.
*   **Real-time Updates:** Uses Supabase Realtime for live updates on document changes.
*   **Contact Management:** Simple contact list integration.

## Tech Stack

*   **Frontend:** React, TypeScript, Vite, Tailwind CSS, Shadcn UI, Framer Motion
*   **Backend:** Supabase (Database, Auth, Edge Functions, Realtime)
*   **Blockchain:**
    *   Solidity (Smart Contracts)
    *   Hardhat (Development & Deployment)
    *   Ethers.js (Frontend Interaction)
    *   MetaMask (Wallet Integration)
*   **Testing:** JMeter (Load Testing)

## Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn
*   MetaMask browser extension installed and configured for Sepolia Testnet.
*   Supabase Account
*   Git

## Installation & Setup

1.  **Clone the Repository:**
    ```bash
    git clone <your-repository-url>
    cd docu-chain-global
    ```

2.  **Install Frontend Dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Install Blockchain Dependencies:**
    ```bash
    cd blockchain-contracts
    npm install
    # or
    yarn install
    cd ..
    ```

4.  **Set up Supabase:**
    *   Create a new project on [Supabase](https://supabase.com/).
    *   Navigate to **Project Settings** -> **API**.
    *   Copy the **Project URL** and the **anon public** key.
    *   Set up your database schema (you might need to run SQL scripts, refer to `supabase/migrations` if available).
    *   Set up Supabase Auth.
    *   Deploy Supabase Edge Functions (`generate-pdf`, `send-signature-request`).

5.  **Set up Environment Variables:**
    *   Create a `.env` file in the root directory.
    *   Add the following variables:
        ```env
        VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
        VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_PUBLIC_KEY
        VITE_CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS 
        # Add any other required keys (e.g., email service keys if used)
        ```
    *   Replace the placeholder values with your actual Supabase credentials and the deployed contract address.

6.  **Deploy Blockchain Contract:**
    *   Navigate to the `blockchain-contracts` directory: `cd blockchain-contracts`
    *   Compile the contract: `npx hardhat compile`
    *   Configure your deployment network (e.g., Sepolia) in `hardhat.config.ts` with your node provider URL and private key.
    *   Run the deployment script: `npx hardhat run scripts/deploy.ts --network sepolia` (replace `sepolia` with your target network if different).
    *   Copy the deployed contract address printed in the console.
    *   Paste the contract address into the `VITE_CONTRACT_ADDRESS` variable in your `.env` file.

## Running the Application

1.  **Start the Frontend Development Server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The application should now be running, typically on `http://localhost:5173`.

## Running Tests (JMeter)

1.  **Install JMeter:** Follow instructions for your OS (e.g., using `choco install jmeter` on Windows). Ensure Java is installed.
2.  **Install JMeter Plugins Manager (Optional but Recommended):**
    *   Download from [jmeter-plugins.org](https://jmeter-plugins.org/install/Install/).
    *   Place the `.jar` file in JMeter's `lib/ext` directory.
3.  **Run Tests:**
    *   Ensure your `SUPABASE_ANON_KEY` is set as an environment variable or passed correctly.
    *   Navigate to the project root directory.
    *   Run the test plan (adjust parameters as needed):
        ```bash
        # Set Anon Key (example for PowerShell)
        $env:SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"

        # Remove old report if it exists
        rm -r test_report -ErrorAction SilentlyContinue

        # Run JMeter test
        jmeter -n -t DocuChain_TestPlan.jmx -l test_results.jtl -J SUPABASE_ANON_KEY=$env:SUPABASE_ANON_KEY -e -o test_report
        ```
    *   Open the generated `test_report/index.html` in a browser to view results.

## Environment Variables

The following environment variables are needed (create a `.env` file in the root):

*   `VITE_SUPABASE_URL`: Your Supabase project URL.
*   `VITE_SUPABASE_ANON_KEY`: Your Supabase project's public anon key.
*   `VITE_CONTRACT_ADDRESS`: The Ethereum address where the `DocumentVerification` contract is deployed.
*   `SUPABASE_SERVICE_ROLE_KEY` (Optional, for backend scripts/functions): Your Supabase project's service role key (keep this secret).

## Blockchain Details

*   **Contract:** `DocumentVerification.sol` located in `blockchain-contracts/contracts/`.
*   **Deployment:** Use Hardhat scripts in `blockchain-contracts/scripts/`. Requires configuration in `hardhat.config.ts`.
*   **Network:** Currently configured for Sepolia testnet. Ensure MetaMask is connected to the same network.

---

*This README provides a general overview. Refer to specific code comments and documentation for more details.*
