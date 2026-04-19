import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { WalletProvider } from './context/WalletContext'
import { DashboardScreen } from './screens/DashboardScreen'
import { BillsScreen } from './screens/bills/BillsScreen'
import { DataScreen } from './screens/bills/DataScreen'
import { AirtimeScreen } from './screens/bills/AirtimeScreen'
import { ElectricityScreen } from './screens/bills/ElectricityScreen'
import { CableTVScreen } from './screens/bills/CableTVScreen'
import { FundWalletScreen } from './screens/FundWalletScreen'
import { TransferScreen } from './screens/TransferScreen'
import { WithdrawScreen } from './screens/WithdrawScreen'
import { ProfileScreen } from './screens/ProfileScreen'

function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardScreen />} />
          <Route path="/bills" element={<BillsScreen />} />
          <Route path="/data" element={<DataScreen />} />
          <Route path="/airtime" element={<AirtimeScreen />} />
          <Route path="/electricity" element={<ElectricityScreen />} />
          <Route path="/cable-tv" element={<CableTVScreen />} />
          <Route path="/fund-wallet" element={<FundWalletScreen />} />
          <Route path="/transfer" element={<TransferScreen />} />
          <Route path="/withdraw" element={<WithdrawScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </WalletProvider>
  )
}

export default App
