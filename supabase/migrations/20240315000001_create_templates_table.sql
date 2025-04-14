-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('contract', 'nda', 'agreement', 'other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_public BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read public templates
CREATE POLICY "Allow users to read public templates"
ON templates FOR SELECT
TO authenticated
USING (is_public = true);

-- Insert B2B Templates
INSERT INTO templates (title, description, content, category) VALUES
-- Service Agreement
(
    'Professional Services Agreement',
    'Comprehensive agreement for B2B professional services',
    'PROFESSIONAL SERVICES AGREEMENT

This Professional Services Agreement (the "Agreement") is entered into as of [DATE] by and between:

[COMPANY A NAME], a company organized under the laws of [JURISDICTION], with its principal place of business at [ADDRESS] ("Service Provider")

and

[COMPANY B NAME], a company organized under the laws of [JURISDICTION], with its principal place of business at [ADDRESS] ("Client")

1. SERVICES
1.1 Service Provider agrees to provide the professional services described in Exhibit A (the "Services") to Client according to the terms and conditions of this Agreement.
1.2 Any additional services must be agreed upon in writing by both parties.

2. COMPENSATION
2.1 Client agrees to pay Service Provider the fees specified in Exhibit B.
2.2 Payment terms: [PAYMENT TERMS]
2.3 Invoicing schedule: [INVOICING SCHEDULE]

3. TERM AND TERMINATION
3.1 This Agreement shall commence on [START DATE] and continue until [END DATE], unless terminated earlier.
3.2 Either party may terminate this Agreement with [X] days written notice.

4. INTELLECTUAL PROPERTY
4.1 All pre-existing intellectual property remains the property of its original owner.
4.2 Any new intellectual property created specifically for Client shall be owned by Client.

5. CONFIDENTIALITY
5.1 Both parties agree to maintain the confidentiality of any proprietary information shared during the course of this Agreement.
5.2 This obligation survives the termination of this Agreement.

6. WARRANTIES AND LIMITATIONS
6.1 Service Provider warrants that the Services will be performed in a professional manner.
6.2 EXCEPT AS EXPRESSLY SET FORTH IN THIS AGREEMENT, NO OTHER WARRANTIES ARE GIVEN.

7. LIMITATION OF LIABILITY
7.1 Neither party shall be liable for any indirect, incidental, or consequential damages.
7.2 Service Provider''s total liability shall not exceed the amounts paid under this Agreement.

8. GOVERNING LAW
This Agreement shall be governed by the laws of [JURISDICTION].

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.

[COMPANY A NAME]
By: _________________________
Name:
Title:
Date:

[COMPANY B NAME]
By: _________________________
Name:
Title:
Date:

EXHIBIT A - SERVICES
[Detailed description of services to be provided]

EXHIBIT B - COMPENSATION
[Detailed fee structure and payment terms]',
    'contract'
),

-- Master Services Agreement
(
    'Master Services Agreement (MSA)',
    'Framework agreement for ongoing B2B relationships',
    'MASTER SERVICES AGREEMENT

This Master Services Agreement (the "MSA") is made as of [DATE] between:

[COMPANY A NAME] ("Provider")
and
[COMPANY B NAME] ("Client")

1. FRAMEWORK
1.1 This MSA establishes the general terms and conditions under which Provider will provide services to Client.
1.2 Specific services will be detailed in Statement of Work (SOW) documents executed by both parties.

2. STATEMENTS OF WORK
2.1 Each SOW shall include:
    - Detailed description of services
    - Deliverables and timelines
    - Fees and payment terms
    - Any specific terms or conditions
2.2 Each SOW incorporates the terms of this MSA by reference.

3. FEES AND PAYMENT
3.1 Fees for specific services will be outlined in each SOW.
3.2 Standard payment terms: Net 30 from invoice date.
3.3 Late payments incur interest at [RATE]% per month.

4. TERM AND TERMINATION
4.1 This MSA remains in effect until terminated by either party with 90 days notice.
4.2 Active SOWs survive termination until completed or separately terminated.

5. INTELLECTUAL PROPERTY
5.1 Background IP remains with its original owner.
5.2 New IP ownership will be specified in each SOW.

6. CONFIDENTIALITY
6.1 Both parties agree to protect confidential information.
6.2 Confidentiality obligations survive termination.

7. WARRANTIES AND INDEMNIFICATION
7.1 Provider warrants professional service delivery.
7.2 Each party agrees to indemnify the other for gross negligence or willful misconduct.

8. LIMITATION OF LIABILITY
8.1 Neither party liable for indirect or consequential damages.
8.2 Total liability limited to fees paid in previous 12 months.

9. GOVERNING LAW
This Agreement is governed by the laws of [JURISDICTION].

[SIGNATURE BLOCKS]',
    'agreement'
),

-- Non-Disclosure Agreement (NDA)
(
    'Mutual Non-Disclosure Agreement',
    'Bilateral NDA for business discussions',
    'MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement (the "Agreement") is entered into as of [DATE] between:

[COMPANY A NAME] ("Party A")
and
[COMPANY B NAME] ("Party B")

1. PURPOSE
The parties wish to explore a business opportunity of mutual interest and in connection with this opportunity, may disclose confidential information to each other.

2. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" means any information disclosed by either party to the other party, either directly or indirectly, in writing, orally or by inspection of tangible objects, that is designated as "Confidential" or would reasonably be understood to be confidential given the nature of the information and circumstances of disclosure.

3. NON-DISCLOSURE AND NON-USE
3.1 Each party agrees not to use any Confidential Information of the other party for any purpose except to evaluate and engage in discussions concerning a potential business relationship between the parties.
3.2 Each party agrees not to disclose any Confidential Information of the other party to third parties or to its employees, except to those employees who need to know such information.

4. MAINTENANCE OF CONFIDENTIALITY
Each party agrees to:
(a) Take reasonable precautions to protect the confidentiality of the other party''s Confidential Information
(b) Not reverse engineer, decompile, or disassemble any software or other tangible objects which embody the other party''s Confidential Information
(c) Immediately notify the other party of any unauthorized use or disclosure of Confidential Information

5. TERM
5.1 This Agreement shall remain in effect for [TERM] years from the Effective Date.
5.2 Each party''s obligations under this Agreement shall survive termination and shall be binding upon its heirs, successors, and assigns.

6. NO LICENSE
No license or conveyance of any intellectual property rights is granted or implied by this Agreement.

7. RETURN OF MATERIALS
Upon termination of the relationship or upon request, each party shall return or destroy all materials containing Confidential Information of the other party.

[SIGNATURE BLOCKS]',
    'nda'
),

-- Sales Agreement
(
    'B2B Sales Agreement',
    'Template for business-to-business product sales',
    'BUSINESS SALES AGREEMENT

This Sales Agreement (the "Agreement") is made between:

[SELLER NAME] ("Seller")
and
[BUYER NAME] ("Buyer")

1. PRODUCTS AND PRICING
1.1 Products: [DETAILED PRODUCT DESCRIPTION]
1.2 Pricing: [PRICE PER UNIT/SERVICE]
1.3 Price adjustments require 30 days written notice.

2. ORDERING AND DELIVERY
2.1 Purchase Orders must include:
    - Product description and quantity
    - Delivery location and date
    - Price and payment terms
2.2 Delivery terms: [INCOTERMS]
2.3 Lead time: [SPECIFY LEAD TIME]

3. PAYMENT TERMS
3.1 Payment due within [X] days of invoice
3.2 Late payment interest: [RATE]% per month
3.3 Currency: [SPECIFY CURRENCY]

4. WARRANTY
4.1 Seller warrants products free from defects for [PERIOD]
4.2 Warranty claims process: [DESCRIBE PROCESS]

5. LIMITATION OF LIABILITY
5.1 Maximum liability limited to purchase price
5.2 No liability for indirect damages

[SIGNATURE BLOCKS]',
    'contract'
),

-- P2P Templates
(
    'Rental Agreement',
    'Template for property rental between individuals',
    'RESIDENTIAL RENTAL AGREEMENT

This Rental Agreement (the "Agreement") is made between:

[LANDLORD NAME] ("Landlord")
and
[TENANT NAME] ("Tenant")

1. PROPERTY
Address: [FULL PROPERTY ADDRESS]

2. TERM
2.1 Lease start date: [START DATE]
2.2 Lease end date: [END DATE]

3. RENT AND DEPOSITS
3.1 Monthly rent: [AMOUNT]
3.2 Security deposit: [AMOUNT]
3.3 Payment due date: [DATE] of each month
3.4 Payment method: [SPECIFY METHOD]

4. UTILITIES AND MAINTENANCE
4.1 Utilities included: [LIST INCLUDED UTILITIES]
4.2 Tenant responsible for: [LIST TENANT RESPONSIBILITIES]
4.3 Landlord responsible for: [LIST LANDLORD RESPONSIBILITIES]

5. RULES AND REGULATIONS
5.1 Occupancy limits: [SPECIFY LIMITS]
5.2 Pet policy: [SPECIFY POLICY]
5.3 Noise restrictions: [SPECIFY RESTRICTIONS]

6. TERMINATION
6.1 Notice required: [SPECIFY NOTICE PERIOD]
6.2 Early termination conditions: [SPECIFY CONDITIONS]

[SIGNATURE BLOCKS]',
    'agreement'
),

-- Loan Agreement
(
    'Personal Loan Agreement',
    'Template for loans between individuals',
    'PERSONAL LOAN AGREEMENT

This Loan Agreement (the "Agreement") is made between:

[LENDER NAME] ("Lender")
and
[BORROWER NAME] ("Borrower")

1. LOAN AMOUNT AND TERMS
1.1 Principal amount: [AMOUNT]
1.2 Interest rate: [RATE]% per annum
1.3 Term: [SPECIFY TERM]

2. REPAYMENT
2.1 Payment schedule: [SPECIFY SCHEDULE]
2.2 Payment amount: [AMOUNT] per payment
2.3 Payment method: [SPECIFY METHOD]

3. PREPAYMENT
3.1 Borrower may prepay without penalty
3.2 Prepayments applied to principal

4. DEFAULT
4.1 Events of default:
    - Missed payments
    - Bankruptcy
    - Death of Borrower
4.2 Remedies upon default

5. SECURITY
5.1 This loan is [secured/unsecured]
5.2 Collateral (if any): [DESCRIBE COLLATERAL]

[SIGNATURE BLOCKS]',
    'agreement'
),

-- Vehicle Sale Agreement
(
    'Vehicle Sale Agreement',
    'Template for private vehicle sales',
    'VEHICLE SALE AGREEMENT

This Vehicle Sale Agreement (the "Agreement") is made between:

[SELLER NAME] ("Seller")
and
[BUYER NAME] ("Buyer")

1. VEHICLE INFORMATION
Make: [MAKE]
Model: [MODEL]
Year: [YEAR]
VIN: [VIN]
Mileage: [MILEAGE]

2. PURCHASE PRICE AND PAYMENT
2.1 Purchase price: [AMOUNT]
2.2 Payment method: [SPECIFY METHOD]
2.3 Payment schedule: [SPECIFY SCHEDULE]

3. VEHICLE CONDITION
3.1 Seller certifies:
    - Clear title
    - No undisclosed defects
    - Accurate mileage
3.2 Vehicle sold "as-is"

4. TRANSFER OF OWNERSHIP
4.1 Date of transfer: [DATE]
4.2 Required documents:
    - Title
    - Bill of sale
    - Registration

5. WARRANTIES
5.1 No warranties unless specified
5.2 Existing warranty transfer (if any)

[SIGNATURE BLOCKS]',
    'contract'
);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_title ON templates USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_templates_description ON templates USING gin(to_tsvector('english', description)); 