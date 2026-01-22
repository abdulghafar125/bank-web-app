# Prominence Bank Core Banking Platform PRD

## Original Problem Statement
Build a Core Banking / Digital Banking Platform for Prominence Bank with:
- Client Portal (web) with Password + Email OTP authentication
- Admin Back Office for customer/account/transfer management
- Multi-currency support for all major world currencies
- External wire/withdrawal requests stay PENDING until admin updates
- OTP mandatory for: Login, adding beneficiary, external transfers
- Bank instruments (KTT) management
- Full audit logging with RBAC
- Crypto Wallet support with QR codes for deposits

## User Personas
1. **Bank Clients**: High-net-worth individuals and businesses using the platform for account management, transfers, viewing bank instruments, and crypto deposits
2. **Bank Administrators**: Staff managing customers, processing transfers, creating instruments, configuring settings including crypto wallets
3. **Super Admin**: Full system access including transaction redaction and audit log access

## Core Requirements (Static)
- Password + Email OTP two-factor authentication
- Multi-currency accounts (USD, EUR, GBP, CHF, JPY, etc.)
- Internal transfers (instant between Prominence accounts)
- External wire transfers (pending → admin approval flow)
- Beneficiary management with OTP verification
- Bank instruments (KTT, CD, endorsements)
- Support ticket system
- Audit logging for all actions
- Transaction redaction (super admin)
- Configurable SMTP for OTP delivery
- Crypto wallet addresses for deposits (BTC, ETH, XLM, BCH, USDT)

## What's Been Implemented
### Date: 2026-01-22 (Crypto Wallets Feature)

**Crypto Wallets Feature**
- ✅ Backend API endpoints for crypto wallet settings
  - GET /api/crypto/wallets - Get wallet addresses for client deposits
  - GET /api/admin/crypto/wallets - Admin view of wallet settings
  - PUT /api/admin/crypto/wallets - Admin update wallet addresses
- ✅ Client Dashboard Crypto Wallets section showing:
  - Wallet addresses for BTC, ETH, XLM, BCH, USDT
  - QR codes for each wallet address (expandable on click)
  - Copy-to-clipboard functionality with visual feedback
  - Network badges (ERC20 compatible, TRC20, etc.)
  - Warning messages about confirmations required
  - Horizontally scrollable cards for mobile
- ✅ Admin Settings Crypto Wallets tab with:
  - Configuration fields for all supported cryptocurrencies
  - USDT network selector (ERC20/TRC20/BEP20)
  - Crypto transfer fee percentage setting
  - Audit logging for all wallet address changes
- ✅ Demo wallet addresses seeded for testing

### Date: 2026-01-20 (Initial MVP + Modernization)

**Backend (FastAPI + MongoDB)**
- ✅ User authentication with JWT + Email OTP
- ✅ Demo OTP mode (123456) when SMTP not configured
- ✅ Account management (checking, savings, KTT)
- ✅ Multi-currency support (20+ currencies)
- ✅ Balance types: Available, Transit, Held, Blocked
- ✅ Internal transfers (instant)
- ✅ External wire transfers (pending workflow)
- ✅ Beneficiary management with OTP
- ✅ Bank instruments CRUD
- ✅ Support tickets
- ✅ Admin dashboard stats
- ✅ Customer management (create/edit/suspend)
- ✅ Account creation
- ✅ Transfer status updates
- ✅ Transaction redaction (super admin)
- ✅ Audit logging
- ✅ SMTP settings configuration
- ✅ Funding instructions editor
- ✅ Seed data with demo accounts

**Frontend (React + Tailwind + Shadcn)**
- ✅ Modern split-screen login page with branding
- ✅ OTP verification screen with fingerprint icon
- ✅ Demo credentials display on login
- ✅ Client Dashboard with:
  - KYC status badge
  - Total balance display
  - In Transit/On Hold indicators
  - SEND/PAY/REQUEST quick actions (mobile banking style)
  - Horizontal scrollable account cards
  - Crypto Wallets section with QR codes
  - Recent transactions with status
  - Quick links grid
- ✅ Accounts page with multi-currency display
- ✅ Transaction history with search/filter/export
- ✅ Print statement functionality
- ✅ CSV export
- ✅ Transfers (internal/external tabs)
- ✅ Beneficiaries management with OTP
- ✅ Bank Instruments viewer
- ✅ Support Tickets
- ✅ Profile & Security settings
- ✅ Funding Instructions page
- ✅ Admin Dashboard
- ✅ Admin Customer Management
- ✅ Admin Account Management
- ✅ Admin Transfer Management
- ✅ Admin Instrument Creation
- ✅ Admin Settings (SMTP, Crypto Wallets, Funding Instructions)
- ✅ Admin Audit Logs

**Branding**
- ✅ Prominence Bank logo integrated
- ✅ Navy blue (#0a1628) + Cyan (#00a8e8) theme
- ✅ Professional banking UI/UX
- ✅ Mobile responsive design

## Demo Credentials
- **Admin**: admin@prominencebank.com / admin123 / OTP: 123456
- **Client**: client@example.com / client123 / OTP: 123456

## Prioritized Backlog

### P0 (Critical - Done)
- [x] Authentication with OTP
- [x] Account management
- [x] Transfers (internal/external)
- [x] Admin portal
- [x] Modern UI/UX
- [x] Crypto Wallets with QR codes

### P1 (High Priority - Next)
- [ ] Complete mobile responsiveness for all pages
- [ ] PDF statement generation
- [ ] Banking Products full CRUD (CD, SBLC, BG, SKR, BCC, POF, BF, KTT, SWIFT)
- [ ] Password reset flow
- [ ] Email notifications for transfer status changes

### P2 (Medium Priority)
- [ ] Deposit Management with Hold/Release
- [ ] Fee Table configuration
- [ ] Wire Transfer minimum balance settings
- [ ] Admin OTP generation for customers
- [ ] Advanced reporting dashboard

### P3 (Future)
- [ ] Native mobile apps (React Native)
- [ ] SWIFT/SEPA integration
- [ ] Data migration tools
- [ ] Real-time WebSocket updates

## Next Action Items
1. Complete mobile responsiveness for remaining pages
2. Implement PDF statement generation
3. Add full Banking Products CRUD
4. Add password reset flow
