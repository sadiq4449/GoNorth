# BaltiTour: Vendor Financial Onboarding & KYC Framework

## 1. Wallet & Bank Verification Logic
To prevent fraud and ensure that the "10% Commission Splitter" routes funds to the correct person, the following verification logic is mandatory:

### A. Digital Wallet (JazzCash/EasyPaisa)
*   **Step 1: Title Lookup**: The backend triggers a Title-Fetch API call.
*   **Step 2: Name Cross-Check**: The system matches the fetched account title against the CNIC name. If "Sajjad Ali" is the CNIC name, the wallet account must not be registered to "Relative Name".
*   **Step 3: Penny Verification**: A 1 PKR test credit is sent. The vendor must verify the transaction in-app to confirm they have access to the SIM/Wallet.

### B. Commercial Bank (IBAN)
*   **Standard**: Mandatory IBAN format (24 digits).
*   **Branch Code**: Automatic extraction of branch code to verify the bank's presence in GB (e.g., NBP Skardu, HBL Gilgit).

---

## 2. Onboarding Wizard: Financial Step Fields
The "Financial Setup" screen in the Vendor App must capture:

| Field Label | Input Type | Validation Rule |
| :--- | :--- | :--- |
| **Account Title** | Text | Must match CNIC exactly |
| **Payout Method** | Radio Button | [JazzCash, EasyPaisa, Bank] |
| **Account/IBAN** | Numeric/Alpha | IBAN check (PK...) or 11-digit mobile |
| **CNIC Number** | Numeric | 13 Digits (XXXXX-XXXXXXX-X) |
| **CNIC Photos** | Image Upload | Front & Back (High Res) |
| **Business License** | Image Upload | Optional for small hostels; Required for Hotels |

---

## 3. The 24-Hour "Connectivity Guard" (Escrow Buffer)
While banking cycles in Pakistan are fast (IBFT), the **Gilgit-Baltistan connectivity gap** necessitates a tiered escrow release:

*   **Standard Release (12 Hours)**: Applicable for city-based bookings (Skardu/Hunza hotels).
*   **Adventure Release (24-48 Hours)**: Applicable for remote valley trips (Deosai, Shigar, Khaplu).
*   **Logic**: The Escrow release timer only begins **once the passenger's app pings the server** confirming they have returned to a network zone, or after a maximum of 48 hours if no dispute is filed.

---
**Verification Status**: Finalized
**Region Specifics**: Adjusted for SCOM/Telenor network latency in North Pakistan.
